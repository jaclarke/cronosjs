import { CronosExpression } from './expression'
import { CronosTask } from './scheduler'
import { CronosTimezone } from './date'

export function scheduleTask(
  cronString: string,
  task: (timestamp: number) => void,
  options: Parameters<typeof CronosExpression.parse>[1]
) {
  const expression = CronosExpression.parse(cronString, options)

  return new CronosTask(expression)
    .on('run', task)
    .start()
}

export function validate(
  cronString: string,
  options?: {
    strict: NonNullable<Parameters<typeof CronosExpression.parse>[1]>['strict']
  }
) {
  try {
    CronosExpression.parse(cronString, options)
  } catch {
    return false
  }

  return true
}

export { CronosExpression, CronosTask, CronosTimezone }
