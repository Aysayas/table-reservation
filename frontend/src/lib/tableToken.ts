export const readTableToken = (tableId: number) => {
  try {
    return sessionStorage.getItem(`qr_token:${tableId}`)
  } catch {
    return null
  }
}

export const readLastOrder = (tableId: number) => {
  try {
    return Number(sessionStorage.getItem(`last_order:${tableId}`)) || null
  } catch {
    return null
  }
}

export const rememberLastOrder = (tableId: number, orderId: number) => {
  try {
    sessionStorage.setItem(`last_order:${tableId}`, String(orderId))
  } catch {
    return
  }
}
