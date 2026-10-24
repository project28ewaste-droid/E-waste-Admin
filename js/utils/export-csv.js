// Downloads rows (array of arrays) as a CSV file.
export function downloadCsv(filename, rows) {
  const csv = rows.map(r => r.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
