export function toDatetimeLocalInput(value?: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function fromDatetimeLocalInput(value: string): string | null {
  if (!value.trim()) {
    return null
  }
  return new Date(value).toISOString()
}

export function formatDateTimeLabel(value?: string | null): string {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}