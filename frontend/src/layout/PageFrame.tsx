export function PageFrame({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">{title}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-ink-950">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
