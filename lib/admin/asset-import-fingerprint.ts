type ImportRow = Record<string, string>;

function stableSerializeRow(row: ImportRow): string {
  return JSON.stringify(
    Object.keys(row)
      .sort()
      .reduce<ImportRow>((accumulator, key) => {
        accumulator[key] = row[key];
        return accumulator;
      }, {})
  );
}

export function buildTextImportFingerprint(fileName: string, text: string): string {
  return `text:${fileName}:${text}`;
}

export function buildPdfImportFingerprint(
  fileName: string,
  headers: string[],
  firstRow: ImportRow | undefined
): string {
  return `pdf:${fileName}:${headers.join("|")}:${stableSerializeRow(firstRow ?? {})}`;
}
