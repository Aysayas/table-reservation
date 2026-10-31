import type { ReactNode } from 'react'

type Props = { title: string; intro?: ReactNode; children: ReactNode }

export default function AccountCard({ title, intro, children }: Props) {
  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 pt-6 pb-12 md:py-12">
      <div className="md:mx-auto md:max-w-md">
        <h1 className="text-brand-charcoal font-serif text-3xl md:text-4xl">{title}</h1>
        {intro && <p className="text-brand-ink/75 mt-3 text-sm">{intro}</p>}
        <div className="border-brand-line mt-6 rounded-lg border bg-white p-5 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
