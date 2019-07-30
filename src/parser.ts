import { CronosExpression } from './expression'
import { sortAsc } from './utils'

const predefinedCronStrings: {
  [key: string]: string
} = {
  '@yearly':   '0 0 0 1 1 * *',
  '@annually': '0 0 0 1 1 * *',
  '@monthly':  '0 0 0 1 * * *',
  '@weekly':   '0 0 0 * * 0 *',
  '@daily':    '0 0 0 * * * *',
  '@midnight': '0 0 0 * * * *',
  '@hourly':   '0 0 * * * * *',
}

const monthReplacements = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const monthReplacementRegex = new RegExp(monthReplacements.join('|'), 'g')

const dayOfWeekReplacements = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const dayOfWeekReplacementRegex = new RegExp(dayOfWeekReplacements.join('|'), 'g')

export function _parse(cronstring: string) {
  let expr = cronstring.trim().toLowerCase();

  if (predefinedCronStrings[expr]) {
    expr = predefinedCronStrings[expr]
  }

  const fields = expr.split(/\s+/g)

  if (fields.length < 5 || fields.length > 7) {
    throw new Error('Expression must have at least 5 fields, and no more than 7 fields')
  }

  switch (fields.length) {
    case 5:
      fields.unshift('0')
    case 6:
      fields.push('*')
  }

  return new CronosExpression(
    cronstring,
    secondsOrMinutesParser(fields[0]),
    secondsOrMinutesParser(fields[1]),
    hoursParser(fields[2]),
    daysParser(fields[3], fields[5]),
    monthsParser(fields[4]),
    yearsParser(fields[6])
  )
}

function expandFieldItem(item: string, first: number, last: number, allowCyclicRange = false, transformer?: (n: number) => number): number[] {
  let start: number = first,
      end: number = last,
      every: number = 1
  const [match, all, startFrom, range, step] = (item.match(/^(?:(\*)|([0-9]+)|([0-9]+-[0-9]+))(?:\/([1-9][0-9]*))?$/) || []) as string[]

  if (!match) throw new Error('Field item invalid')

  if (startFrom) {
    start = parseInt(startFrom, 10)
    start = transformer ? transformer(start) : start
    if (start < first || start > last) throw new Error('Field item start from value invalid')
    end = step ? last : start
  } else if (range) {
    const [rangeStart, rangeEnd] = range.split('-').map(x => {
      const n = parseInt(x, 10)
      return transformer ? transformer(n) : n
    })
    if (
      rangeStart < first || rangeStart > last || rangeEnd < first || rangeEnd > last ||
      (rangeEnd < rangeStart && !allowCyclicRange)
    ) {
      throw new Error('Field item range invalid')
    }
    start = rangeStart
    end = rangeEnd
  }

  if (step) {
    every = parseInt(step, 10)
  }

  const rangeLength = (end < start) ? ((last - start) + (end - first) + 1) : (end - start)
  return Array(Math.floor(rangeLength / every) + 1)
    .fill(0)
    .map((_, i) => first + ((start - first + (every*i)) % (last - first + 1)))
}

function secondsOrMinutesParser(field: string): number[] {
  const allowed: Set<number> = new Set()

  for (const item of field.split(',')) {
    for (const n of expandFieldItem(item, 0, 59, true)) {
      allowed.add(n)
    }
  }

  return Array.from(allowed).sort(sortAsc)
}

function hoursParser(field: string): number[] {
  const allowed: Set<number> = new Set()

  for (const item of field.split(',')) {
    for (const n of expandFieldItem(item, 0, 23, true)) {
      allowed.add(n)
    }
  }

  return Array.from(allowed).sort(sortAsc)
}

export type CronosDaysExpression = {
  include: number[]
  last: boolean
  lastWeekday: boolean
  nearestWeekdays: number[]
  daysOfWeek: number[]
  lastDaysOfWeek: number[]
  nthDaysOfWeek: [number, number][]
}
function daysParser(daysOfMonthField: string, daysOfWeekField: string): CronosDaysExpression {
  const expr: CronosDaysExpression = {
    include: [],
    last: false,
    lastWeekday: false,
    nearestWeekdays: [],
    daysOfWeek: [],
    lastDaysOfWeek: [],
    nthDaysOfWeek: []
  }

  const include: Set<number> = new Set(),
        nearestWeekdays: Set<number> = new Set(),
        daysOfWeek: Set<number> = new Set(),
        lastDaysOfWeek: Set<number> = new Set(),
        nthDaysOfWeek: Set<string> = new Set()

  // days of month      
  let anyDay = true

  for (let item of daysOfMonthField.split(',')) {
    let weekday = false

    if (item === '*') continue

    anyDay = false
    if (item === 'l') {
      expr.last = true
      continue
    }
    if (item === 'lw') {
      expr.lastWeekday = true
      continue
    }

    if (item.endsWith('w')) {
      weekday = true
      item = item.slice(0, -1)
    }

    for (const n of expandFieldItem(item, 1, 31)) {
      weekday ? nearestWeekdays.add(n) : include.add(n)
    }
  }

  // days of week
  const normalisedDaysOfWeekField = daysOfWeekField.replace(
    dayOfWeekReplacementRegex,
    match => dayOfWeekReplacements.indexOf(match) + ''
  )

  let anyDaysOfWeek = true

  for (let item of normalisedDaysOfWeekField.split(',')) {
    let last = false
    let nth = 0

    if (item === '*') continue

    anyDaysOfWeek = false

    if (item.endsWith('l')) {
      last = true
      item = item.slice(0, -1)
    } else if (item.includes('#')) {
      let match = item.match(/^.+#([1-5])$/)
      if (!match) throw new Error('Field item nth of month (#) invalid')
      nth = parseInt(match[1], 10)
      item = item.slice(0, item.indexOf('#'))
    }

    let days = expandFieldItem(item, 0, 6, true, n => n === 7 ? 0 : n)

    if (nth) {
      for (const n of days) {
        const hash = n+'/'+nth
        if (!nthDaysOfWeek.has(hash)) {
          nthDaysOfWeek.add(hash)
          expr.nthDaysOfWeek.push([n, nth])
        }
      }
      continue
    }

    const set = last ? lastDaysOfWeek : daysOfWeek
    for (const n of days) {
      set.add(n)
    }
  }

  expr.include = (anyDay && anyDaysOfWeek) ?
    expandFieldItem('*', 1, 31) :
    Array.from(include).sort(sortAsc)

  expr.nearestWeekdays = Array.from(nearestWeekdays).sort(sortAsc)
  expr.daysOfWeek = Array.from(daysOfWeek).sort(sortAsc)
  expr.lastDaysOfWeek = Array.from(lastDaysOfWeek).sort(sortAsc)

  return expr
}

function monthsParser(field: string): number[] {
  const allowed: Set<number> = new Set()

  const normalisedField = field.replace(monthReplacementRegex, match => {
    return monthReplacements.indexOf(match) + 1 + ''
  })

  for (const item of normalisedField.split(',')) {
    for (const n of expandFieldItem(item, 1, 12, true)) {
      allowed.add(n)
    }
  }

  return Array.from(allowed).sort(sortAsc)
}

function yearsParser(field: string): number[] {
  const allowed: Set<number> = new Set()

  for (const item of field.split(',')) {
    for (const n of expandFieldItem(item, 1970, 2099)) {
      allowed.add(n)
    }
  }

  return Array.from(allowed).sort(sortAsc)
}
