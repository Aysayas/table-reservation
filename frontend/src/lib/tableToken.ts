export const readTableToken = (tableId: number) => {
  try {
    return sessionStorage.getItem(`qr_token:${tableId}`)
  } catch {
    return null
  }
}
