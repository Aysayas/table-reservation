type Props = { name: string; src?: string | null; className: string; letter?: string }

export default function DishPhoto({ name, src, className, letter = 'text-2xl' }: Props) {
  return src ? (
    <img src={src} alt={`${name} photo`} className={`${className} object-cover`} />
  ) : (
    <div
      role="img"
      aria-label={`${name} photo`}
      className={`${className} bg-brand-cream flex items-center justify-center p-1.5`}
    >
      <span className="border-brand-gold/50 flex size-full items-center justify-center rounded-[inherit] border">
        <span aria-hidden="true" className={`text-brand-gold-deep font-serif ${letter}`}>
          {name.trim().charAt(0)}
        </span>
      </span>
    </div>
  )
}
