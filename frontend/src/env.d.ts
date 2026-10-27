interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_USE_SAMPLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
