export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

interface CsvRow {
  [column: string]: unknown;
}

export function generateCsvBlob(columns: string[], rows: CsvRow[]): Blob {
  const bom = '\uFEFF';
  const header = columns.map(escapeCsvField).join(',');
  const body = rows.map((row) =>
    columns.map((col) => {
      const val = row[col];
      return escapeCsvField(String(val ?? ''));
    }).join(','),
  ).join('\n');

  const content = `${bom}${header}\n${body}`;
  return new Blob([content], { type: 'text/csv;charset=utf-8;' });
}

export function downloadCsv(filename: string, columns: string[], rows: CsvRow[]): void {
  const blob = generateCsvBlob(columns, rows);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}