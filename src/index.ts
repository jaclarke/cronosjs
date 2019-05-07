import { CronosExpression } from './expression'
import { CronosTask } from './scheduler'
import { CronosDate, CronosTimezone } from './date'

export function scheduleTask(
  cronString: string,
  task: (timestamp: number) => void,
  options?: {
    timezone?: string | number
    skipRepeatedHour?: boolean
    missingHour?: 'insert' | 'offset' | 'skip'
  }
) {
  const expression = CronosExpression.parse(cronString, options)

  return new CronosTask(expression)
    .on('run', task)
    .start()
}

export function validate(cronString: string) {
  try {
    CronosExpression.parse(cronString)
  } catch {
    return false
  }

  return true
}

export { CronosExpression, CronosTask, CronosDate, CronosTimezone }
