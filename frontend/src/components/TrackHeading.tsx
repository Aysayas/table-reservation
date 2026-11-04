type Props = {
  id: string
  name: string
  track?: number
  compact?: boolean
  surface?: string
}

export default function TrackHeading({
  id,
  name,
  track,
  compact = false,
  surface = 'bg-brand-cream',
}: Props) {
  const words = name.trim().split(' ')
  const last = words.pop()

  return (
    <div>
      {track !== undefined && (
        <p
          aria-hidden="true"
          className="text-brand-gold-deep tracking-eyebrow text-xs font-bold uppercase"
        >
          Track {String(track).padStart(2, '0')}
        </p>
      )}
      <div className="relative mt-1">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 inset-y-1.5 flex flex-col justify-between"
        >
          {[0, 1, 2, 3, 4].map((line) => (
            <span key={line} className="bg-brand-line/70 h-px" />
          ))}
        </div>
        <h2
          id={id}
          className={`text-brand-charcoal relative font-serif ${compact ? 'text-2xl' : 'text-2xl md:text-3xl'}`}
        >
          <span className={`box-decoration-clone pr-3 ${surface}`}>
            {words.length > 0 && `${words.join(' ')} `}
            <span className="text-brand-red italic">{last}</span>
          </span>
        </h2>
      </div>
    </div>
  )
}
