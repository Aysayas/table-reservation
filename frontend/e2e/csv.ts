import { expect, type Download } from '@playwright/test'

export async function readCsv(download: Download) {
  const chunks = await (await download.createReadStream()).toArray()
  const text = Buffer.concat(chunks).toString('utf8')
  expect(text.startsWith('\uFEFF')).toBe(true)
  return text
    .slice(1)
    .split('\r\n')
    .map((line) =>
      line ? [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"')) : [],
    )
}
