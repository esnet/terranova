import { PktsDataTable as PDT, PktsSpinner } from "@esnet/packets-ui-react";
import React from "react";

export interface TableViewProps {
    data: Record<string, any>[];
    loading?: boolean;
    datasetVisible?: boolean;
}

export const TableView = ({ data, loading, datasetVisible }: TableViewProps) => {
    if (loading) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <PktsSpinner />
            </div>
        );
    }

    if (!Array.isArray(data) || data.length < 1 || !datasetVisible) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <span className="text-xl text-light-copyAlt">No data</span>
            </div>
        );
    }

    const headers = Object.keys(data[0]);

    // TODO: improve UX of table by adding column sorting
    // Also, format the endpoints better than just stringifying it
    return (
        <PDT>
            {/* Table Header */}
            <PDT.PktsDataTableHead>
                {headers.map((key) => (
                    <PDT.PktsDataTableHeaderCell key={key} sort="NONE">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </PDT.PktsDataTableHeaderCell>
                ))}
            </PDT.PktsDataTableHead>

            {/* Table Body */}
            <PDT.PktsDataTableBody>
                {data.map((row, rowIndex) => (
                    <PDT.PktsDataTableRow key={`row-${rowIndex}`}>
                        {headers.map((key) => {
                            let value = row[key] ?? "N/A";
                            if (typeof value !== "string") value = JSON.stringify(value);

                            return (
                                <PDT.PktsDataTableCell key={`${rowIndex}-${key}`}>
                                    {value}
                                </PDT.PktsDataTableCell>
                            );
                        })}
                    </PDT.PktsDataTableRow>
                ))}
            </PDT.PktsDataTableBody>
        </PDT>
    );
};
