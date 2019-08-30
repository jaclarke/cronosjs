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

/*
"The actual range of times supported by ECMAScript Date objects is slightly smaller:
  exactly –100,000,000 days to 100,000,000 days measured relative to midnight at the
  beginning of 01 January, 1970 UTC. This gives a range of 8,640,000,000,000,000
  milliseconds to either side of 01 January, 1970 UTC."
http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1

new Date(8640000000000000) => 00:00:00 13th Sep 275760
Largest full year valid as JS date = 275759
*/
const maxValidYear = 275759

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
    new SecondsOrMinutesField(fields[0]).values,
    new SecondsOrMinutesField(fields[1]).values,
    new HoursField(fields[2]).values,
    new DaysField(fields[3], fields[5]).values,
    new MonthsField(fields[4]).values,
    new YearsField(fields[6])
  )
}


abstract class Field {
  abstract first: number
  abstract last: number

  constructor(protected field: string) {}

  protected parse() {
    return this.field.split(',')
      .map(item => FieldItem.parse(item, this.first, this.last, true))
  }

  private _items?: FieldItem[]
  protected get items() {
    if (!this._items) this._items = this.parse()
    return this._items
  }

  get values() {
    return Field.getValues(this.items, this.first, this.last)
  }

  static getValues(items: FieldItem[], first: number, last: number) {
    return Array.from(new Set(
      items.reduce<number[]>((values, item) => {
        values.push(...item.values(first, last))
        return values
      }, [])
    )).sort(sortAsc)
  }
}

class FieldItem {
  range?: {
    from: number
    to?: number
  }
  step: number = 1

  values(first: number, last: number) {
    const start = this.range ? this.range.from : first,
            end = (this.range && this.range.to !== undefined) ? this.range.to : last,
    rangeLength = (end < start) ? ((last - start) + (end - first) + 1) : (end - start)

    return Array(Math.floor(rangeLength / this.step) + 1)
      .fill(0)
      .map((_, i) => first + ((start - first + (this.step*i)) % (last - first + 1)))
  }

  get any() {
    return this.range === undefined && this.step === 1
  }

  get single() {
    return !!this.range && this.range.from === this.range.to
  }

  static parse(item: string, first: number, last: number, allowCyclicRange = false, transformer?: (n: number) => number) {
    const fieldItem = new FieldItem()

    const [match, all, startFrom, range, step] = (item.match(/^(?:(\*)|([0-9]+)|([0-9]+-[0-9]+))(?:\/([1-9][0-9]*))?$/) || []) as string[]

    if (!match) throw new Error('Field item invalid format')

    if (step) {
      fieldItem.step = parseInt(step, 10)
    }

    if (startFrom) {
      let start = parseInt(startFrom, 10)
      start = transformer ? transformer(start) : start
      if (start < first || start > last) throw new Error('Field item out of valid value range')

      fieldItem.range = {
        from: start,
        to: step ? undefined : start
      }
    } else if (range) {
      const [rangeStart, rangeEnd] = range.split('-').map(x => {
        const n = parseInt(x, 10)
        return transformer ? transformer(n) : n
      })

      if (
        rangeStart < first || rangeStart > last || rangeEnd < first || rangeEnd > last ||
        (rangeEnd < rangeStart && !allowCyclicRange)
      ) {
        throw new Error('Field item range invalid, either value out of valid range or start greater than end in non wraparound field')
      }

      fieldItem.range = {
        from: rangeStart,
        to: rangeEnd
      }
    }

    return fieldItem
  }
}

export class SecondsOrMinutesField extends Field {
  readonly first = 0
  readonly last = 59
}

export class HoursField extends Field {
  readonly first = 0
  readonly last = 23
}

export class DaysField {
  lastDay = false
  lastWeekday = false
  daysItems: FieldItem[] = []
  nearestWeekdayItems: FieldItem[] = []
  daysOfWeekItems: FieldItem[] = []
  lastDaysOfWeekItems: FieldItem[] = []
  nthDaysOfWeekItems: {item: FieldItem, nth: number}[] = []

  constructor(daysOfMonthField: string, daysOfWeekField: string) {
    for (let item of daysOfMonthField.split(',')) {
      if (item === 'l') {
        this.lastDay = true
      }
      else if (item === 'lw') {
        this.lastWeekday = true
      }
      else if (item.endsWith('w')) {
        this.nearestWeekdayItems.push(
          FieldItem.parse(item.slice(0, -1), 1, 31)
        )
      }
      else {
        this.daysItems.push(FieldItem.parse(item, 1, 31))
      }
    }

    const normalisedDaysOfWeekField = daysOfWeekField.replace(
      dayOfWeekReplacementRegex,
      match => dayOfWeekReplacements.indexOf(match) + ''
    )
    const parseDayOfWeek = (item: string) => FieldItem.parse(item, 0, 6, true, n => n === 7 ? 0 : n)

    for (let item of normalisedDaysOfWeekField.split(',')) {
      const nthIndex = item.lastIndexOf('#')
      if (item.endsWith('l')) {
        this.lastDaysOfWeekItems.push(parseDayOfWeek(item.slice(0, -1)))
      }
      else if (nthIndex !== -1) {
        const nth = item.slice(nthIndex+1)
        if (!/^[1-5]$/.test(nth)) throw new Error('Field item nth of month (#) invalid')
        this.nthDaysOfWeekItems.push({
          item: parseDayOfWeek(item.slice(0, nthIndex)),
          nth: parseInt(nth, 10)
        }) 
      }
      else {
        this.daysOfWeekItems.push(parseDayOfWeek(item))
      }
    }
  }

  get values() {
    return DaysFieldValues.fromField(this)
  }

  get allDays() {
    return (
      !this.lastDay &&
      !this.lastWeekday &&
      !this.nearestWeekdayItems.length &&
      !this.lastDaysOfWeekItems.length &&
      !this.nthDaysOfWeekItems.length &&
      this.daysItems.length === 1 && this.daysItems[0].any &&
      this.daysOfWeekItems.length === 1 && this.daysOfWeekItems[0].any
    )
  }
}

export class DaysFieldValues {
  lastDay = false
  lastWeekday = false
  days: number[] = []
  nearestWeekday: number[] = []
  daysOfWeek: number[] = []
  lastDaysOfWeek: number[] = []
  nthDaysOfWeek: [number, number][] = []

  static fromField(field: DaysField) {
    const values = new DaysFieldValues()

    const filterAnyItems = (items: FieldItem[]) => items.filter(item => !item.any)
    values.lastDay = field.lastDay
    values.lastWeekday = field.lastWeekday
    values.days = Field.getValues(
      field.allDays ? [new FieldItem()] : filterAnyItems(field.daysItems),
      1, 31)
    values.nearestWeekday = Field.getValues(field.nearestWeekdayItems, 1, 31)
    values.daysOfWeek = Field.getValues(filterAnyItems(field.daysOfWeekItems), 0, 6)
    values.lastDaysOfWeek = Field.getValues(field.lastDaysOfWeekItems, 0, 6)

    const nthDaysHashes = new Set<number>()
    for (let item of field.nthDaysOfWeekItems) {
      for (let n of item.item.values(0, 6)) {
        let hash = n*10+item.nth
        if (!nthDaysHashes.has(hash)) {
          nthDaysHashes.add(hash)
          values.nthDaysOfWeek.push([n, item.nth])
        }
      }
    }

    return values
  }

  getDays(year: number, month: number): number[] {
    const days: Set<number> = new Set(this.days)

    const lastDateOfMonth = new Date(year, month, 0).getDate()
    const firstDayOfWeek = new Date(year, month-1, 1).getDay()

    const getNearestWeekday = (day: number) => {
      if (day > lastDateOfMonth) day = lastDateOfMonth
      const dayOfWeek = (day + firstDayOfWeek - 1) % 7
      let weekday = day + (dayOfWeek === 0 ? 1 : (dayOfWeek === 6 ? -1 : 0))
      return weekday + (weekday < 1 ? 3 : (weekday > lastDateOfMonth ? -3 : 0))
    }

    if (this.lastDay) {
      days.add(lastDateOfMonth)
    }
    if (this.lastWeekday) {
      days.add( getNearestWeekday(lastDateOfMonth) )
    }
    for (const day of this.nearestWeekday) {
      days.add( getNearestWeekday(day) )
    }

    if (this.daysOfWeek.length ||
        this.lastDaysOfWeek.length ||
        this.nthDaysOfWeek.length
    ) {
      const daysOfWeek: number[][] = Array(7).fill(0).map(() => ([]))
      for (let day = 1; day < 36; day++) {
        daysOfWeek[(day + firstDayOfWeek - 1) % 7].push(day)
      }

      for (const dayOfWeek of this.daysOfWeek) {
        for (const day of daysOfWeek[dayOfWeek]) {
          days.add(day)
        }
      }
      for (const dayOfWeek of this.lastDaysOfWeek) {
        for (let i = daysOfWeek[dayOfWeek].length-1; i >= 0; i--) {
          if (daysOfWeek[dayOfWeek][i] <= lastDateOfMonth) {
            days.add(daysOfWeek[dayOfWeek][i])
            break
          }
        }
      }
      for (const [dayOfWeek, nthOfMonth] of this.nthDaysOfWeek) {
        days.add(daysOfWeek[dayOfWeek][nthOfMonth-1])
      }
    }

    return Array.from(days).filter(day => day <= lastDateOfMonth).sort(sortAsc)
  }
}

export class MonthsField extends Field {
  readonly first = 1
  readonly last = 12

  constructor(field: string) {
    super(
      field.replace(monthReplacementRegex, match => {
        return monthReplacements.indexOf(match) + 1 + ''
      })
    )
  }
}

export class YearsField extends Field {
  readonly first = 1970
  readonly last = 2099

  constructor(field: string) {
    super(field)
    this.items
  }

  protected parse() {
    return this.field.split(',')
      .map(item => FieldItem.parse(item, 0, maxValidYear))
  }

  nextYear(fromYear: number) {
    return this.items.reduce<number[]>((years, item) => {
      if (item.any) years.push(fromYear)
      else if (item.single) {
        const year = (item.range as {from: number}).from
        if (year >= fromYear) years.push(year)
      }
      else {
        const start = item.range && item.range.from || this.first
        if (start > fromYear) years.push(start)
        else {
          const nextYear = start + Math.ceil((fromYear - start) / item.step) * item.step
          if (nextYear <= (item.range && item.range.to || maxValidYear)) years.push(nextYear)
        }
      }
      return years
    }, []).sort(sortAsc)[0] || null
  }
}
