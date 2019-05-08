import { CronosDaysExpression, _parse } from './parser'
import { CronosDate, CronosTimezone } from './date'
import { sortAsc } from './utils'

const hourinms = 60 * 60 * 1000
const findFirstFrom = (from: number, list: number[]) => list.findIndex(n => n >= from)

export class CronosExpression {
  private timezone?: CronosTimezone
  private skipRepeatedHour = true
  private missingHour: 'insert' | 'offset' | 'skip' = 'insert'

  constructor(
    private readonly seconds: number[],
    private readonly minutes: number[],
    private readonly hours: number[],
    private readonly days: CronosDaysExpression,
    private readonly months: number[],
    private readonly years: number[]
  ) {}

  static parse(cronstring: string, options: {
    timezone?: string | number | CronosTimezone
    skipRepeatedHour?: boolean
    missingHour?: CronosExpression['missingHour']
  } = {}) {
    const expr = _parse(cronstring)
    
    expr.timezone = options.timezone instanceof CronosTimezone ? options.timezone :
      (options.timezone !== undefined ? new CronosTimezone(options.timezone) : undefined)
    expr.skipRepeatedHour = options.skipRepeatedHour !== undefined ? options.skipRepeatedHour : expr.skipRepeatedHour
    expr.missingHour = options.missingHour || expr.missingHour

    return expr
  }

  nextDate(afterDate: Date = new Date()): Date | null {
    const fromCronosDate = CronosDate.fromDate(afterDate, this.timezone)

    if (this.timezone && this.timezone.fixedOffset !== undefined) {
      return this._next(fromCronosDate).date
    }

    const fromTimestamp = afterDate.getTime(),
          fromLocalTimestamp = fromCronosDate['toUTCTimestamp'](),
          prevHourLocalTimestamp = CronosDate.fromDate( new Date(fromTimestamp - hourinms),
                                     this.timezone )['toUTCTimestamp'](),
          nextHourLocalTimestamp = CronosDate.fromDate( new Date(fromTimestamp + hourinms),
                                     this.timezone )['toUTCTimestamp'](),
          nextHourRepeated = nextHourLocalTimestamp - fromLocalTimestamp === 0,
          thisHourRepeated = fromLocalTimestamp - prevHourLocalTimestamp === 0,
          thisHourMissing = fromLocalTimestamp - prevHourLocalTimestamp === hourinms * 2

    if (this.skipRepeatedHour && thisHourRepeated) {
      return this._next(fromCronosDate.copyWith({ minute: 59, second: 60 }), false).date
    }
    if (this.missingHour === 'offset' && thisHourMissing) {
      const nextDate = this._next(fromCronosDate.copyWith({ hour: fromCronosDate.hour - 1 })).date
      if (!nextDate || nextDate.getTime() > fromTimestamp) return nextDate
    }

    let {date: nextDate, cronosDate: nextCronosDate} = this._next(fromCronosDate)

    if (this.missingHour !== 'offset' && nextCronosDate && nextDate) {
      const nextDateNextHourTimestamp = nextCronosDate.copyWith({hour: nextCronosDate.hour + 1}).toDate(this.timezone).getTime() 
      if (nextDateNextHourTimestamp === nextDate.getTime()) {
        if (this.missingHour === 'insert') {
          return nextCronosDate.copyWith({minute: 0, second: 0}).toDate(this.timezone)
        }
        // this.missingHour === 'skip'
        return this._next( nextCronosDate.copyWith({minute: 59, second: 59}) ).date
      }
    }

    if (!this.skipRepeatedHour) {
      if ( nextHourRepeated && (!nextDate || (nextDate.getTime() > fromTimestamp + hourinms)) ) {
        nextDate = this._next(fromCronosDate.copyWith({ minute: 0, second: 0 }), false).date
      }
      if ( nextDate && nextDate < afterDate ) {
        nextDate = new Date(nextDate.getTime() + hourinms)
      }
    }

    return nextDate
  }

  private _next(date: CronosDate, after = true) {
    const nextDate = this._nextYear(
      after ? date.copyWith({second: date.second + 1}) : date
    )

    return {
      cronosDate: nextDate,
      date: nextDate ? nextDate.toDate(this.timezone) : null
    }
  }

  nextNDates(afterDate: Date = new Date(), n: number = 5) {
    const dates = []

    let lastDate = afterDate
    for (let i = 0; i < n; i++) {
      const date = this.nextDate(lastDate)
      if (!date) break;
      lastDate = date
      dates.push(date)
    }

    return dates
  }

  private _nextYear(fromDate: CronosDate): CronosDate | null {
    let nextYearIndex = findFirstFrom(fromDate.year, this.years)

    let nextDate = null

    while (!nextDate) {
      const nextYear = this.years[nextYearIndex]
      if (nextYear === undefined) return null

      nextDate = this._nextMonth(
        (nextYear === fromDate.year) ? fromDate : new CronosDate(nextYear)
      )

      nextYearIndex++
    }

    return nextDate
  }

  private _nextMonth(fromDate: CronosDate): CronosDate | null {
    let nextMonthIndex = findFirstFrom(fromDate.month, this.months)

    let nextDate = null

    while (!nextDate) {
      const nextMonth = this.months[nextMonthIndex]
      if (nextMonth === undefined) return null

      nextDate = this._nextDay(
        (nextMonth === fromDate.month) ? fromDate : new CronosDate(fromDate.year, nextMonth)
      )

      nextMonthIndex++
    }

    return nextDate
  }

  private _nextDay(fromDate: CronosDate): CronosDate | null {
    const days = this._resolveDays(fromDate.year, fromDate.month)

    let nextDayIndex = findFirstFrom(fromDate.day, days)

    let nextDate = null

    while (!nextDate) {
      const nextDay = days[nextDayIndex]
      if (nextDay === undefined) return null

      nextDate = this._nextHour(
        (nextDay === fromDate.day) ? fromDate : new CronosDate(fromDate.year, fromDate.month, nextDay)
      )

      nextDayIndex++
    }

    return nextDate
  }

  private _resolveDays(year: number, month: number): number[] {
    const days: Set<number> = new Set(this.days.include)

    const lastDateOfMonth = new Date(year, month, 0).getDate()
    const firstDayOfWeek = new Date(year, month-1, 1).getDay()

    const getNearestWeekday = (day: number) => {
      if (day > lastDateOfMonth) day = lastDateOfMonth
      const dayOfWeek = (day + firstDayOfWeek - 1) % 7
      let weekday = day + (dayOfWeek === 0 ? 1 : (dayOfWeek === 6 ? -1 : 0))
      return weekday + (weekday < 1 ? 3 : (weekday > lastDateOfMonth ? -3 : 0))
    }

    if (this.days.last) {
      days.add(lastDateOfMonth)
    }
    if (this.days.lastWeekday) {
      days.add( getNearestWeekday(lastDateOfMonth) )
    }
    for (const day of this.days.nearestWeekdays) {
      days.add( getNearestWeekday(day) )
    }

    if (this.days.daysOfWeek.length ||
        this.days.lastDaysOfWeek.length ||
        this.days.nthDaysOfWeek.length
    ) {
      const daysOfWeek: number[][] = Array(7).fill(0).map(() => ([]))
      for (let day = 1; day < 36; day++) {
        daysOfWeek[(day + firstDayOfWeek - 1) % 7].push(day)
      }

      for (const dayOfWeek of this.days.daysOfWeek) {
        for (const day of daysOfWeek[dayOfWeek]) {
          days.add(day)
        }
      }
      for (const dayOfWeek of this.days.lastDaysOfWeek) {
        for (let i = daysOfWeek[dayOfWeek].length-1; i >= 0; i--) {
          if (daysOfWeek[dayOfWeek][i] <= lastDateOfMonth) {
            days.add(daysOfWeek[dayOfWeek][i])
            break
          }
        }
      }
      for (const [dayOfWeek, nthOfMonth] of this.days.nthDaysOfWeek) {
        days.add(daysOfWeek[dayOfWeek][nthOfMonth-1])
      }
    }

    return Array.from(days).filter(day => day <= lastDateOfMonth).sort(sortAsc)
  }

  private _nextHour(fromDate: CronosDate): CronosDate | null {
    let nextHourIndex = findFirstFrom(fromDate.hour, this.hours)

    let nextDate = null

    while (!nextDate) {
      const nextHour = this.hours[nextHourIndex]
      if (nextHour === undefined) return null

      nextDate = this._nextMinute(
        (nextHour === fromDate.hour) ? fromDate :
          new CronosDate(fromDate.year, fromDate.month, fromDate.day, nextHour)
      )

      nextHourIndex++
    }

    return nextDate
  }

  private _nextMinute(fromDate: CronosDate): CronosDate | null {
    let nextMinuteIndex = findFirstFrom(fromDate.minute, this.minutes)

    let nextDate = null

    while (!nextDate) {
      const nextMinute = this.minutes[nextMinuteIndex]
      if (nextMinute === undefined) return null

      nextDate = this._nextSecond(
        (nextMinute === fromDate.minute) ? fromDate :
          new CronosDate(fromDate.year, fromDate.month, fromDate.day, fromDate.hour, nextMinute)
      )

      nextMinuteIndex++
    }

    return nextDate
  }

  private _nextSecond(fromDate: CronosDate): CronosDate | null {
    let nextSecond = this.seconds.find(n => n >= fromDate.second)

    if (nextSecond === undefined) return null

    return fromDate.copyWith({second: nextSecond})
  }
}