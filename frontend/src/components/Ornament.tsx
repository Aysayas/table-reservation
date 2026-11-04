type Props = {
  label?: string
  as?: 'h2' | 'h3' | 'p'
  id?: string
  tone?: 'light' | 'dark'
  className?: string
}

export default function Ornament({
  label,
  as: Tag = 'h2',
  id,
  tone = 'light',
  className = '',
}: Props) {
  const ink = tone === 'dark' ? 'text-brand-gold' : 'text-brand-gold-deep'
  const rule = `h-px flex-1 ${tone === 'dark' ? 'bg-brand-gold/50' : 'bg-brand-gold-deep/35'}`
  const diamond = (
    <span aria-hidden="true" className={`${ink} text-xs leading-none`}>
      ◆
    </span>
  )

  return (
    <div aria-hidden={label ? undefined : true} className={`flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className={rule} />
      {label ? (
        <>
          {diamond}
          <Tag
            id={id}
            className={`${ink} tracking-eyebrow text-center text-xs font-bold uppercase`}
          >
            {label}
          </Tag>
          {diamond}
        </>
      ) : (
        diamond
      )}
      <span aria-hidden="true" className={rule} />
    </div>
  )
}
