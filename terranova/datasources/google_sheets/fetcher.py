from .settings import configure

configure()

import orjson  # noqa: E402
import json  # noqa: E402
import sqlite3  # noqa: E402


from google.oauth2 import service_account  # noqa: E402
from google.auth.transport.requests import Request  # noqa: E402
from google_auth_oauthlib.flow import InstalledAppFlow  # noqa: E402
from googleapiclient.errors import HttpError  # noqa: E402
from googleapiclient.discovery import build  # noqa: E402

from copy import deepcopy  # noqa: E402
from collections import defaultdict  # noqa: E402

from terranova.logging import logger  # noqa: E402
from terranova.settings import (  # noqa: E402
    GOOGLE_SHEETS_CACHE_FILE,
    GOOGLE_SHEETS_TABLE_NAME,
    GOOGLE_SHEETS_META_TABLE_NAME,
    GOOGLE_SHEETS_CREDENTIAL_SOURCE,
    GOOGLE_SHEETS_CREDENTIALS,
)

from .backend import GoogleSheetsBackend  # noqa: E402

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# we will make a copy of this datastructure for each sheet.
# it has keys of expected columns and values of lists of column indices.
# we support metadata with an array of values, so all values are possibly a list
EXPECTED_COLUMNS = {
    "Edges!A:Z": {
        "name": [],
        "description": [],
        "source": [],
        "destination": [],
    },
    "Nodes!A:Z": {
        "name": [],
        "latitude": [],
        "longitude": [],
        "description": [],
    },
}

DATATYPES = {"nodes": "Nodes!A:Z", "edges": "Edges!A:Z"}

BAD_FORMAT_MESSAGE = """
These sheets:
%s

are shared with the service account, but do not conform to the
Terranova Google Sheet format.

Terranova expects two Sheets with specific columns:
    Sheet "Edges" with columns named:
        - "Name"
        - "Description"
        - "Source"
        - "Destination"
    Sheet "Nodes" with columns named:
        - "Name"
        - "Description"
        - "Latitude"
        - "Longitude"

The columns are identified by a header row.
The columns may be in any order, but all must be present.
All other columns will be available as custom metadata.

See
https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit
for an example.

"""


class CacheWriter:
    def __init__(self):
        logger.info("Creating sqlite connection to %s" % GOOGLE_SHEETS_CACHE_FILE)
        self.conn = sqlite3.connect(GOOGLE_SHEETS_CACHE_FILE)

        creates = [
            """
            CREATE TABLE IF NOT EXISTS %s
            (id INTEGER PRIMARY KEY AUTOINCREMENT,
             sheet_id TEXT,
             edge TEXT)
            """
            % GOOGLE_SHEETS_TABLE_NAME,
            """
            CREATE TABLE IF NOT EXISTS %s
            (sheet_id TEXT PRIMARY KEY,
             sheet_name TEXT,
             columns TEXT,
             types TEXT)
            """
            % GOOGLE_SHEETS_META_TABLE_NAME,
        ]
        for create in creates:
            logger.debug("Creating table %s" % create)
            self.conn.execute(create)

        self.conn.commit()

    def insert_metadata(self, sheet_id, sheet_name, columns, types):
        cur = self.conn.cursor()
        insert = (
            """INSERT INTO %s (sheet_id, sheet_name, columns, types) VALUES (?, ?, ?, ?)"""
            % (GOOGLE_SHEETS_META_TABLE_NAME)
        )
        logger.info("Setting metadata for Sheet [%s] to %s", sheet_id, json.dumps(columns))
        cur.execute(insert, (sheet_id, sheet_name, orjson.dumps(columns), orjson.dumps(types)))
        self.conn.commit()
        cur.close()

    def clear(self, table):
        logger.info("Deleting anything existing in table '%s'..." % table)
        self.conn.execute("""DELETE from %s""" % table)
        self.conn.commit()

    def insert(self, sheet_id, data, table):

        query = """INSERT INTO %s (sheet_id, edge) VALUES (?, ?)""" % (table,)

        inserts = []
        for row in data:
            # rearrange into SQL friendly tuples for insert
            inserts.append((sheet_id, orjson.dumps(row)))
        logger.info("Inserting %d records into '%s'" % (len(inserts), table))
        self.conn.executemany(query, inserts)  # do bulk insert
        self.conn.commit()


def enumerate_credentials():
    if GOOGLE_SHEETS_CREDENTIAL_SOURCE == "static":
        return GOOGLE_SHEETS_CREDENTIALS
    else:
        backend = GoogleSheetsBackend()
        return backend.list_credentials(sanitize=False)


def fetch():
    # we'll collect metadata on each column in a sheet
    sheet_metadata = defaultdict(lambda: {"name": "", "columns": [], "types": []})
    # data output will be a dictionary of sheet ids, with a list of documents for each sheet.
    output = {}
    malformed_sheets = set()

    for user_token in enumerate_credentials():

        creds = None
        try:
            creds = service_account.Credentials.from_service_account_info(
                user_token, scopes=SCOPES
            )
        except Exception as e:
            print(e)

        # in the case that we don't have a valid live credential from google
        if not creds or not creds.valid:
            # we may have an expired credential that can be refreshed. If so, refresh it.
            if creds and creds.refresh:
                creds.refresh(Request())
            # otherwise, we don't have credentials. If this is the case, run
            # the browser workflow to get new credentials.
            else:
                flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
                creds = flow.run_local_server(port=0)

        try:
            service = build("drive", "v3", credentials=creds, cache_discovery=False)

            paginated_sheets = (
                service.files()
                .list(
                    q="mimeType='application/vnd.google-apps.spreadsheet'",
                    fields="nextPageToken, files(id, name)",
                )
                .execute()
            )

            sheet_list = paginated_sheets.get("files", [])

            if not sheet_list:
                print("no sheets found for this user account")
                return

            for target_sheet in sheet_list:
                logger.info(
                    "Working on Sheet '%s' with ID [%s]", target_sheet["id"], target_sheet["name"]
                )  # corresponds to `files(id, name)` above

                sheet_metadata[target_sheet["id"]]["name"] = target_sheet["name"]
                service = build("sheets", "v4", credentials=creds, cache_discovery=False)

                data = {"nodes": {}, "edges": []}

                sheet_id = target_sheet["id"]
                sheet_name = target_sheet["name"]
                node_metadata = {"columns": [], "types": []}

                for datatype, cell_range in DATATYPES.items():
                    expected_columns = EXPECTED_COLUMNS[cell_range]
                    try:
                        rows = (
                            service.spreadsheets()
                            .values()
                            .get(spreadsheetId=target_sheet.get("id", ""), range=cell_range)
                            .execute()
                        )
                    except HttpError:
                        malformed_sheets.add(sheet_name)
                        continue
                    # 'rows' is now e.g.
                    # {'range': "'--'!A1:J2161", 'majorDimension': 'ROWS', 'values': [
                    #    ['src', 'dst', 'datetime', 'in_bits', 'out_bits', 'src_total', 'src_lat', 'src_lng', 'dst_lat', 'dst_lng'],  # noqa E501
                    #    ['A', 'B', '2024-12-02 15:48:06', '262825379206', '74598253223', '74598253223', '42', '-104', '42', '-91'],  # noqa E501
                    #    ['B', 'C', '2024-12-02 15:48:06', '375057078131', '372930983029', '449655331354', '42', '-91', '34', '-98']  # noqa E501
                    # ] }
                    rows = rows.get("values")
                    # data_to_cache is now a list of arrays. Populate a hash of indexes for columns
                    header = rows[0]
                    column_positions = defaultdict(list, deepcopy(expected_columns))
                    known_columns = []
                    for expected_column in expected_columns:
                        case_insensitive_header = [column.lower() for column in header]
                        column_index = case_insensitive_header.index(expected_column.lower())
                        # add the column index to the column_positions datastructure
                        column_positions[expected_column].append(column_index)
                        # and add the column index to the known_columns
                        known_columns.append(column_index)
                    for idx, column_name in enumerate(header):
                        if idx not in known_columns:
                            column_positions[column_name.lower()].append(idx)
                    # if our datatype is "nodes", we need to make a
                    # list of the columns available for each node
                    if datatype == "nodes":
                        for column, positions in column_positions.items():
                            node_metadata["columns"].append(column)
                            node_metadata["types"].append(
                                "scalar" if len(positions) in [0, 1] else "array"
                            )
                    # if the datatype is "edges" we need to add each
                    # of the columns for the edge sheet, as well
                    # as each of the columns from the node sheet.
                    # The columns from the node sheet will be prefixed with "endpoint"
                    if datatype == "edges":
                        for column, positions in column_positions.items():
                            sheet_metadata[sheet_id]["columns"].append(column)
                            sheet_metadata[sheet_id]["types"].append(
                                "scalar" if len(positions) in [0, 1] else "array"
                            )
                        for idx, col in enumerate(node_metadata["columns"]):
                            sheet_metadata[sheet_id]["columns"].append(
                                "endpoints_%s" % col.lower()
                            )
                            sheet_metadata[sheet_id]["types"].append(node_metadata["types"][idx])
                    # we now have a datastructure like:
                    # column_positions = {
                    #   "Name": [0],
                    #   "Description": [1],
                    #   "Source": [2],
                    #   "Destination": [3],
                    #   "Meta1": [4, 5, 6],
                    #   "Meta2": [7, 8, 9, 10]
                    # }
                    # for the rest of the rows, excluding the
                    # header, compose a document to be cached.
                    for row in rows[1:]:
                        doc = {}
                        # the key order of DATATYPES guarantees
                        # that we'll compile the list of nodes first
                        if datatype == "edges":
                            doc["endpoints"] = [
                                data["nodes"][row[column_positions["source"][0]]],
                                data["nodes"][row[column_positions["destination"][0]]],
                            ]
                            if "source" in doc:
                                del doc["source"]
                            if "destination" in doc:
                                del doc["destination"]

                        for column, positions in column_positions.items():
                            # if we somehow have a column with no values (?),
                            # skip it and continue with the next column
                            if len(positions) == 0:
                                continue
                            # if we have a column with exactly one value,
                            # we'll just set it on the target document
                            elif len(positions) == 1:
                                doc[column] = row[positions[0]]
                            # if we have a metadata column with multiple values,
                            # we'll create an array of values for the target document
                            elif len(positions) > 1:
                                col_value = []
                                for position in positions:
                                    try:
                                        col_value.append(row[position])
                                    except IndexError:
                                        # no value for this position
                                        pass
                                doc[column] = col_value

                        if datatype == "nodes":
                            data[datatype][doc["name"]] = doc
                        elif datatype == "edges":
                            data[datatype].append(doc)

                output[sheet_id] = data["edges"]

        # receiving an HTTP Error here means that something
        # went drastically wrong fetching the data/credential from google
        except HttpError as err:
            # print it and give up on this credential
            # (continue with next credential)
            print(err)
            continue

        if malformed_sheets:
            formatted_malformed_sheets = "\n    • %s" % "\n    • ".join(list(malformed_sheets))
            logger.warning(BAD_FORMAT_MESSAGE, formatted_malformed_sheets)

        return (output, sheet_metadata)


def main():
    writer = CacheWriter()
    logger.info("clearing sheet metadata and sheet rows")
    writer.clear(GOOGLE_SHEETS_META_TABLE_NAME)
    writer.clear(GOOGLE_SHEETS_TABLE_NAME)
    records, metadata = fetch()

    for sheet_id, rows in records.items():
        logger.info("Fetched %s Edge rows from Google Sheet with ID [%s]", len(rows), sheet_id)
        writer.insert_metadata(
            sheet_id,
            metadata[sheet_id]["name"],
            metadata[sheet_id]["columns"],
            metadata[sheet_id]["types"],
        )
        logger.info(
            "Inserting %s rows into '%s' for [%s]", len(rows), GOOGLE_SHEETS_TABLE_NAME, sheet_id
        )
        writer.insert(sheet_id, rows, GOOGLE_SHEETS_TABLE_NAME)


if __name__ == "__main__":
    main()
