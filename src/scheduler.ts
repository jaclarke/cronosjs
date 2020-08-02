const maxTimeout = Math.pow(2, 31) - 1
const scheduledTasks: CronosTask[] = []

let runningTimer: number | null = null

function addTask(task: CronosTask) {
  if (task['_timestamp'] !== undefined) {
    const insertIndex = scheduledTasks.findIndex(t => t['_timestamp']! < task['_timestamp']!)
    if (insertIndex >= 0) scheduledTasks.splice(insertIndex, 0, task)
    else scheduledTasks.push(task)
  }
}

function removeTask(task: CronosTask) {
  const removeIndex = scheduledTasks.indexOf(task)
  if (removeIndex >= 0) scheduledTasks.splice(removeIndex, 1)

  if (scheduledTasks.length === 0 && runningTimer) {
    clearTimeout(runningTimer)
    runningTimer = null
  }
}

function runScheduledTasks(skipRun = false) {
  if (runningTimer) clearTimeout(runningTimer)

  const now = Date.now()

  const removeIndex = scheduledTasks.findIndex(task => task['_timestamp']! <= now)
  const tasksToRun = removeIndex >= 0 ? scheduledTasks.splice(removeIndex) : []

  for (let task of tasksToRun) {
    if (!skipRun) task['_runTask']()
    if (task.isRunning) {
      task['_updateTimestamp']()
      addTask(task)
    }
  }

  const nextTask = scheduledTasks[scheduledTasks.length - 1]
  if (nextTask) {
    runningTimer = setTimeout(runScheduledTasks,
      Math.min(nextTask['_timestamp']! - Date.now(), maxTimeout))
  } else runningTimer = null
}

export function refreshSchedulerTimer() {
  for (const task of scheduledTasks) {
    task['_updateTimestamp']()
    if (!task.isRunning) removeTask(task)
  }
  scheduledTasks.sort((a, b) => b['_timestamp']! - a['_timestamp']!)
  runScheduledTasks(true)
}

export interface DateSequence {
  nextDate: (afterDate: Date) => Date | null
}

class DateArraySequence implements DateSequence {
  private _dates: Date[]

  constructor(dateLikes: DateLike[]) {
    this._dates = dateLikes.map(dateLike => {
      const date = new Date(dateLike)
      if (isNaN(date.getTime())) throw new Error('Invalid date')
      return date
    }).sort((a, b) => a.getTime() - b.getTime())
  }

  nextDate(afterDate: Date) {
    const nextIndex = this._dates.findIndex(d => d > afterDate)
    return nextIndex === -1 ? null : this._dates[nextIndex]
  }
}

type CronosTaskListeners = {
  'started': () => void
  'stopped': () => void
  'run':     (timestamp: number) => void
  'ended':   () => void
}

type DateLike = Date | string | number

export class CronosTask {
  private _listeners: {
    [K in keyof CronosTaskListeners]: Set<CronosTaskListeners[K]>
  } = {
    'started': new Set(),
    'stopped': new Set(),
    'run': new Set(),
    'ended': new Set(),
  }
  private _timestamp?: number
  private _sequence: DateSequence

  constructor(sequence: DateSequence)
  constructor(dates: DateLike[])
  constructor(date: DateLike)
  constructor(
    sequenceOrDates: DateSequence | DateLike[] | DateLike,
  ) {
    if (Array.isArray(sequenceOrDates)) this._sequence = new DateArraySequence(sequenceOrDates)
    else if (
      typeof sequenceOrDates === 'string' || 
      typeof sequenceOrDates === 'number' ||
      sequenceOrDates instanceof Date
    ) this._sequence = new DateArraySequence([sequenceOrDates])
    else this._sequence = sequenceOrDates
  }

  start() {
    if (!this.isRunning) {
      this._updateTimestamp()
      addTask(this)
      runScheduledTasks()
      if (this.isRunning) this._emit('started')
    }
    return this
  }

  stop() {
    if (this.isRunning) {
      this._timestamp = undefined
      removeTask(this)
      this._emit('stopped')
    }
    return this
  }

  get nextRun() {
    return this.isRunning ? new Date(this._timestamp!) : undefined
  }

  get isRunning() {
    return this._timestamp !== undefined
  }

  private _runTask() {
    this._emit('run', this._timestamp)
  }

  private _updateTimestamp() {
    const nextDate = this._sequence.nextDate(new Date())

    this._timestamp = nextDate ? nextDate.getTime() : undefined

    if (!this.isRunning) this._emit('ended')
  }

  on<K extends keyof CronosTaskListeners>(event: K, listener: CronosTaskListeners[K]) {
    this._listeners[event].add(listener as any)
    return this
  }

  off<K extends keyof CronosTaskListeners>(event: K, listener: CronosTaskListeners[K]) {
    this._listeners[event].delete(listener as any)
    return this
  }

  private _emit<K extends keyof CronosTaskListeners>(event: K, ...args: any[]) {
    this._listeners[event].forEach((listener: Function) => {
      listener.call(this, ...args)
    })
  }
}
