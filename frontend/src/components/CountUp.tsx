import useCountUp from '@/hooks/useCountUp'

export default function CountUp({
  value,
  format = (n) => String(Math.round(n)),
}: {
  value: number
  format?: (n: number) => string
}) {
  const shown = useCountUp(value, 700, 0)
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}
