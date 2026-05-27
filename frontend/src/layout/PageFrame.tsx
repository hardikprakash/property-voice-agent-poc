export function PageFrame({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-[1.95rem] font-semibold tracking-[-0.03em] text-ink-950 sm:text-[2.2rem]">{title}</h2>
          {subtitle ? <p className="max-w-2xl text-sm leading-6 text-ink-600 sm:text-[0.95rem]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
