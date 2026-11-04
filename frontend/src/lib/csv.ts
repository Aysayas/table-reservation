export type Cell = string | number | null | undefined

export const csvCell = (value: Cell) => {
  const text = value == null ? '' : String(value)
  const safe = typeof value === 'string' && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export const toCsv = (rows: Cell[][]) =>
  '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')

export function downloadCsv(name: string, rows: Cell[][]) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}

export async function allPages<T>(
  load: (page: number, per_page: number) => Promise<{ data: T[]; meta: { total: number } }>,
) {
  const per_page = 500
  const first = await load(1, per_page)
  const rows = [...first.data]
  for (let page = 2; rows.length < first.meta.total; page++) {
    const next = await load(page, per_page)
    if (!next.data.length) break
    rows.push(...next.data)
  }
  return rows
}
