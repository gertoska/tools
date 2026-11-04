/** Cells starting with one of these are read as a formula by spreadsheet apps. */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/** `=HYPERLINK("x")` becomes `'=HYPERLINK("x")`, plain text in every spreadsheet. */
export function neutralizeFormula(value: string): string {
  const first = value.charAt(0);
  return FORMULA_PREFIXES.includes(first) ? `'${value}` : value;
}

function quote(value: string): string {
  return `"${neutralizeFormula(value).replace(/"/g, '""')}"`;
}

export function toCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const lines = [header.map(quote).join(','), ...rows.map((row) => row.map(quote).join(','))];
  return `${lines.join('\r\n')}\r\n`;
}

export function toTxt(lines: readonly string[]): string {
  return `${lines.join('\n')}\n`;
}
