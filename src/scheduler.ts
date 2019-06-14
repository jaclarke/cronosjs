import { CronosExpression } from './expression'

const maxTimeout = Math.pow(2, 31) - 1
const scheduledTasks: CronosTask[] = []

let runningTimer: number | null = null

function addTask(task: CronosTask) {
  if (task['_timestamp']) {
    const insertIndex = scheduledTasks.findIndex(t => (t['_timestamp'] || 0) < (task['_timestamp'] || 0))
    if (insertIndex >= 0) scheduledTasks.splice(insertIndex + 1, 0, task)
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

function runScheduledTasks() {
  if (runningTimer) clearTimeout(runningTimer)

  const now = Date.now()

  const removeIndex = scheduledTasks.findIndex(task => (task['_timestamp'] || 0) <= now)
  const tasksToRun = removeIndex >= 0 ? scheduledTasks.splice(removeIndex) : []

  for (let task of tasksToRun) {
    task['_runTask']()
    task['_updateTimestamp']()
    addTask(task)
  }

  const nextTask = scheduledTasks[scheduledTasks.length - 1]
  if (nextTask) {
    runningTimer = setTimeout(runScheduledTasks,
      Math.min((nextTask['_timestamp'] || 0) - Date.now(), maxTimeout))
  } else runningTimer = null
}

type CronosTaskListeners = {
  'started': () => void
  'stopped': () => void
  'run':     (timestamp: number) => void
  'ended':   () => void
}

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
  private _expression: CronosExpression

  constructor(
    expression: CronosExpression,
  ) {
    this._expression = expression
  }

  start() {
    this._updateTimestamp()
    addTask(this)
    runScheduledTasks()
    if (this._timestamp) this._emit('started')
    return this
  }

  stop() {
    this._timestamp = undefined
    removeTask(this)
    this._emit('stopped')
    return this
  }

  get nextRun() {
    return this._timestamp ? new Date(this._timestamp) : undefined
  }

  get isRunning() {
    return !!this._timestamp
  }

  private _runTask() {
    this._emit('run', this._timestamp)
  }

  private _updateTimestamp() {
    const nextDate = this._expression.nextDate(
      this._timestamp ? new Date(this._timestamp) : new Date()
    )
    this._timestamp = nextDate ? nextDate.getTime() : undefined
    if (!this._timestamp) this._emit('ended')
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
