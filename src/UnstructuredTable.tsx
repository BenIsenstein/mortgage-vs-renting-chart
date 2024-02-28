type DataObject = Record<string, boolean | number | string>

export function UnstructuredTable(props: { data: DataObject[] }) {
    const columns = new Set<string>()
    const theadElements = []
    const tbodyElements = []
    
    for (const row of props.data) {
        for (const key in row) {
            columns.add(key)
        }
    }

    for (const col of columns) {
        theadElements.push(
            <th
                key={col}
                className="border-1px border-slate-600 p-2" 
                scope="col"
            >
                {col}
            </th>
        )
    }

    for (const row of props.data) {
        const tdatas = []

        for (const col of columns) {
            const value = row[col] ?? ''
            
            tdatas.push(
                <td
                    key={col + value}
                    className="border-1px border-slate-600 p-2"
                >
                    {value}
                </td>
            )
        }

        tbodyElements.push(
            <tr
                key={row.id ? String(row.id) : JSON.stringify(row)}
                className="odd:bg-white even:bg-slate-50"
            >
                {tdatas}
            </tr>
        )
    }

    return (
        <table className="border-1px border-black">
            <thead className="bg-slate-300">
                <tr>
                    {theadElements}
                </tr>
            </thead>
            <tbody>
                {tbodyElements}
            </tbody>
        </table>
    )
}