const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/"/g, '""');
  if (/[",\n]/.test(text)) {
    return `"${text}"`;
  }
  return text;
};

export const downloadCsv = (fileName, columns, rows) => {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(","))
    .join("\n");

  const csv = [header, body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
