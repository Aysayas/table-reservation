import type { ReactNode } from 'react'

export type MomentKind =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'booked'
  | 'verifying'
  | 'paid'
  | 'failed'
  | 'empty'
  | 'loading'
  | 'lost'

const line = 'stroke-brand-charcoal fill-none'
const solid = 'stroke-brand-charcoal fill-white'
const box = 'motion-safe:[transform-box:fill-box]'

const steam = (x: number, delay: number) => (
  <path
    key={x}
    d={`M${x} 62c-6-8 6-12 0-20`}
    strokeWidth={3}
    strokeLinecap="round"
    style={{ animationDelay: `${delay}s` }}
    className={`stroke-brand-gold fill-none opacity-70 ${box} motion-safe:animate-[moment-steam_2.2s_ease-out_infinite]`}
  />
)

const scenes: Record<MomentKind, ReactNode> = {
  received: (
    <>
      <line x1="20" y1="40" x2="150" y2="40" strokeWidth={3} className={line} />
      <g className="motion-safe:animate-[moment-drop_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
        <rect x="55" y="46" width="60" height="80" rx="3" strokeWidth={3} className={solid} />
        <path d="M66 66h38M66 80h32M66 94h36" strokeWidth={2} className={line} />
        <circle
          cx="85"
          cy="44"
          r="5"
          className={`fill-brand-gold origin-center ${box} motion-safe:animate-[moment-pop_400ms_600ms_both]`}
        />
      </g>
    </>
  ),
  preparing: (
    <>
      {steam(66, 0)}
      {steam(85, 0.5)}
      {steam(104, 1)}
      <g
        className={`origin-bottom ${box} motion-safe:animate-[moment-jiggle_2.6s_ease-in-out_infinite]`}
      >
        <path d="M48 80h74M80 72h10" strokeWidth={3} strokeLinecap="round" className={line} />
      </g>
      <path
        d="M52 84h66v30a10 10 0 0 1-10 10H62a10 10 0 0 1-10-10z"
        strokeWidth={3}
        className={solid}
      />
      <path d="M44 92h8M118 92h8" strokeWidth={3} strokeLinecap="round" className={line} />
      <path
        d="M70 146c0-10 8-10 6-18 8 6 8 12 8 18"
        className={`fill-brand-gold origin-bottom ${box} motion-safe:animate-[moment-flicker_500ms_ease-in-out_infinite]`}
      />
      <path
        d="M86 146c0-8 6-8 5-14 6 5 6 9 6 14"
        style={{ animationDelay: '0.2s' }}
        className={`fill-brand-red origin-bottom ${box} motion-safe:animate-[moment-flicker_600ms_ease-in-out_infinite]`}
      />
      <line
        x1="58"
        y1="148"
        x2="112"
        y2="148"
        strokeWidth={3}
        strokeLinecap="round"
        className={line}
      />
    </>
  ),
  ready: (
    <>
      <line
        x1="30"
        y1="132"
        x2="140"
        y2="132"
        strokeWidth={3}
        strokeLinecap="round"
        className={line}
      />
      <g className={`origin-top ${box} motion-safe:animate-[moment-ring_1s_300ms_ease-in-out_2]`}>
        <path
          d="M50 128a35 35 0 0 1 70 0z"
          strokeWidth={3}
          className="fill-brand-gold stroke-brand-charcoal"
        />
        <circle cx="85" cy="88" r="5" className="fill-brand-charcoal" />
      </g>
      <path d="M44 128h82" strokeWidth={3} strokeLinecap="round" className={line} />
    </>
  ),
  served: (
    <>
      <g
        className={`origin-center ${box} motion-safe:animate-[moment-grow_600ms_cubic-bezier(0.16,1,0.3,1)_both]`}
      >
        <circle cx="85" cy="92" r="46" strokeWidth={3} className={solid} />
        <circle cx="85" cy="92" r="32" strokeWidth={2} className="stroke-brand-gold fill-none" />
      </g>
      {[
        [40, 40],
        [132, 48],
        [128, 140],
      ].map(([x, y], i) => (
        <path
          key={x}
          d={`M${x} ${y - 8}v16M${x - 8} ${y}h16`}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ animationDelay: `${0.5 + i * 0.15}s` }}
          className={`stroke-brand-gold origin-center ${box} motion-safe:animate-[moment-pop_500ms_both]`}
        />
      ))}
    </>
  ),
  booked: (
    <>
      <path d="M20 122h130" strokeWidth={3} strokeLinecap="round" className={line} />
      <circle
        cx="85"
        cy="96"
        r="26"
        strokeWidth={3}
        className={`${solid} origin-center ${box} motion-safe:animate-[moment-grow_600ms_both]`}
      />
      <path
        d="M42 74v44M38 74v12M46 74v12"
        strokeWidth={3}
        strokeLinecap="round"
        className={`${line} motion-safe:animate-[moment-from-left_600ms_300ms_both]`}
      />
      <path
        d="M128 74c8 4 8 20 0 24v20"
        strokeWidth={3}
        strokeLinecap="round"
        className={`${line} motion-safe:animate-[moment-from-right_600ms_300ms_both]`}
      />
      <path d="M85 36v12" strokeWidth={2} className={line} />
      <path
        d="M85 22c-5 6-5 10 0 12 5-2 5-6 0-12z"
        className={`fill-brand-gold origin-bottom ${box} motion-safe:animate-[moment-flicker_500ms_ease-in-out_infinite]`}
      />
      <path
        d="M73 96l8 8 16-16"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="40"
        className="stroke-brand-gold fill-none motion-safe:animate-[moment-stroke_500ms_900ms_both]"
      />
    </>
  ),
  verifying: (
    <>
      <rect x="45" y="70" width="80" height="70" rx="8" strokeWidth={3} className={solid} />
      <rect x="57" y="82" width="56" height="20" rx="3" className="fill-brand-cream" />
      <g className="motion-safe:animate-[moment-drop_1s_cubic-bezier(0.16,1,0.3,1)_both]">
        <rect x="60" y="28" width="50" height="34" rx="4" className="fill-brand-gold" />
        <line x1="66" y1="40" x2="104" y2="40" strokeWidth={3} className="stroke-brand-charcoal" />
      </g>
      {[70, 85, 100].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy="122"
          r="4"
          style={{ animationDelay: `${i * 0.2}s` }}
          className="fill-brand-charcoal motion-safe:animate-[moment-dot_1.2s_ease-in-out_infinite]"
        />
      ))}
    </>
  ),
  paid: (
    <>
      <rect x="40" y="36" width="90" height="14" rx="7" className="fill-brand-charcoal" />
      <svg x="0" y="44" width="170" height="126" overflow="hidden">
        <g className="motion-safe:animate-[moment-print_1.2s_cubic-bezier(0.16,1,0.3,1)_both]">
          <path
            d="M52 0h66v86l-8-6-8 6-8-6-8 6-8-6-8 6-8-6-10 6z"
            strokeWidth={2.5}
            className={solid}
          />
          <path d="M62 22h46M62 36h34" strokeWidth={2} className={line} />
          <path
            d="M70 60l10 10 20-20"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="44"
            className="stroke-brand-gold fill-none motion-safe:animate-[moment-stroke_500ms_1s_both]"
          />
        </g>
      </svg>
    </>
  ),
  failed: (
    <>
      <g className="motion-safe:animate-[moment-shake_450ms_200ms_both]">
        <rect x="40" y="56" width="90" height="60" rx="8" strokeWidth={3} className={solid} />
        <line x1="40" y1="74" x2="130" y2="74" strokeWidth={8} className="stroke-brand-charcoal" />
      </g>
      <g className={`origin-center ${box} motion-safe:animate-[moment-pop_400ms_600ms_both]`}>
        <circle cx="126" cy="58" r="10" className="fill-brand-red" />
        <path
          d="M126 53v6M126 63v.1"
          strokeWidth={3}
          strokeLinecap="round"
          className="stroke-white"
        />
      </g>
    </>
  ),
  empty: (
    <>
      <g
        className={`origin-bottom ${box} motion-safe:animate-[moment-wobble_1s_200ms_ease-in-out_both]`}
      >
        <ellipse cx="85" cy="104" rx="56" ry="22" strokeWidth={3} className={solid} />
        <ellipse
          cx="85"
          cy="102"
          rx="36"
          ry="12"
          strokeWidth={2}
          className="stroke-brand-gold fill-none"
        />
      </g>
      <path
        d="M30 70v40M140 70c8 4 8 20 0 24v16"
        strokeWidth={3}
        strokeLinecap="round"
        className={line}
      />
    </>
  ),
  loading: (
    <>
      {steam(70, 0)}
      {steam(85, 0.5)}
      {steam(100, 1)}
      <path d="M40 92h90a45 30 0 0 1-90 0z" strokeWidth={3} className={solid} />
      <path d="M66 128h38" strokeWidth={3} strokeLinecap="round" className={line} />
      <path d="M50 98h70" strokeWidth={2} className="stroke-brand-gold" />
    </>
  ),
  lost: (
    <>
      <path d="M25 140h120" strokeWidth={3} strokeLinecap="round" className={line} />
      <g className="origin-[60px_140px] motion-safe:animate-[moment-tip_900ms_200ms_cubic-bezier(0.5,0,0.75,0)_both]">
        <ellipse cx="60" cy="58" rx="14" ry="20" strokeWidth={3} className={solid} />
        <path d="M60 78v62" strokeWidth={4} strokeLinecap="round" className={line} />
      </g>
      <ellipse
        cx="118"
        cy="128"
        rx="24"
        ry="8"
        strokeWidth={2}
        className="stroke-brand-gold fill-none"
      />
    </>
  ),
}

export default function Moment({
  kind,
  label,
  className = 'size-36',
}: {
  kind: MomentKind
  label?: string
  className?: string
}) {
  return (
    <svg
      key={kind}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      viewBox="0 0 170 170"
      className={`shrink-0 motion-safe:animate-[moment-in_250ms_ease-out] ${className}`}
    >
      {scenes[kind]}
    </svg>
  )
}
