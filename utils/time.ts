import { Duration } from 'luxon'
import pluralize from 'pluralize'

export function formatTimeLeft(messagesLeft: number) {
  const estimatedLeft = Duration.fromMillis((messagesLeft / 50) * 1250)

  const years = estimatedLeft.as('years')
  if (years > 1) {
    return pluralize('year', Math.round(years), true)
  }

  const months = estimatedLeft.as('months')
  if (months > 1) {
    return pluralize('month', Math.round(months), true)
  }

  const days = estimatedLeft.as('days')
  if (days > 1) {
    return pluralize('day', Math.round(days), true)
  }

  const hours = estimatedLeft.as('hours')
  if (hours > 1) {
    return pluralize('hour', Math.round(hours), true)
  }

  const minutes = estimatedLeft.as('minutes')
  if (minutes > 1) {
    return pluralize('minute', Math.round(minutes), true)
  }

  const seconds = estimatedLeft.as('seconds')
  return pluralize('second', Math.round(seconds), true)
}
