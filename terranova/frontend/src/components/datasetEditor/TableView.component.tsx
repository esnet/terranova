interface TableViewProps {
    data: any[];
    loading: boolean;
    datasetVisible: boolean;
}

/**
 * Renders a table of data given a set of headers and an array of data object records. Each record should have keys matching the
 * given set of headers.
 *
 * @param {TableViewProps} props
 * @returns
 */
export const TableView = (props: TableViewProps) => {
    const { data, loading } = props;
    if (!!loading) {
        return <div className="m-2">Loading...</div>;
    }
    if (!Array.isArray(data) || data.length < 1 || !props.datasetVisible) {
        return <div className="m-2">No Data</div>;
    }

    let headers = Object.keys(data[0]);

    return (
        <table className="data-table overflow-scroll">
            <thead>
                <tr>
                    {headers.map((header) => (
                        <th key={`table-view-header-${header}`}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((record, idx) => (
                    <tr key={`table-view-record-${idx}`}>
                        {headers.map((header, headerIdx) => (
                            <td key={`table-view-cell-${headerIdx}`}>
                                {JSON.stringify(record[header])}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
