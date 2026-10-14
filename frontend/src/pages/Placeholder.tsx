type Props = {
  screen: string
  title: string
}

export default function Placeholder({ screen, title }: Props) {
  return (
    <div className="p-6">
      <p className="text-sm text-neutral-500">Screen {screen}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  )
}
