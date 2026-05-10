function Table({ columns, data, emptyMessage = "Нет данных" }) {
  if (!data || data.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col, colIdx) => {
                const value = typeof col.accessor === "function"
                  ? col.accessor(row)
                  : row[col.accessor];

                return (
                  <td key={colIdx}>
                    {col.render ? col.render(row) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
