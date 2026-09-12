type Page<T> = { data: T[] | null; error: unknown; count?: number | null };

/** Fetch every row, including when PostgREST caps responses below our page size. */
export async function collectPages<T>(fetchPage: (from: number, to: number) => PromiseLike<Page<T>>, pageSize = 500): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Tamanho de página inválido.');
  const rows: T[] = [];
  let expected: number | null = null;
  for (;;) {
    const { data, error, count } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) throw error;
    if (count != null) {
      if (expected != null && expected !== count) throw new Error('Os dados mudaram durante a consulta. Atualize para tentar novamente.');
      expected = count;
    }
    if (!data?.length) {
      if (expected != null && rows.length !== expected) throw new Error('Consulta incompleta. Atualize para tentar novamente.');
      return rows;
    }
    rows.push(...data);
    if (expected != null && rows.length === expected) return rows;
    if (expected != null && rows.length > expected) throw new Error('Contagem inconsistente na consulta.');
  }
}
