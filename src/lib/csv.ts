export function generateCSV(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCSV(String(row[header] ?? ""))).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
