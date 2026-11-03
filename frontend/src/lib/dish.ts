// shortcut: hides seed placeholder text, drop once real descriptions are entered on screen 21
export const dishDescription = (description: string | null) =>
  description === 'Short description of the dish.' ? null : description
