export class CronosDate {
  constructor(    
    public year: number,
    public month: number = 1,
    public day: number = 1,
    public hour: number = 0,
    public minute: number = 0,
    public second: number = 0
  ) {}

  static fromDate(date: Date, timezone?: CronosTimezone) {
    if (!timezone) {
      return new CronosDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
      )
    }
    return timezone['nativeDateToCronosDate'](date)
  }

  toDate(timezone?: CronosTimezone) {
    if (!timezone) {
      return new Date(this.year, this.month-1, this.day, this.hour, this.minute, this.second)
    }
    return timezone['cronosDateToNativeDate'](this)
  }

  private static fromUTCTimestamp(timestamp: number) {
    const date = new Date(timestamp)
    return new CronosDate(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    )
  }

  private toUTCTimestamp() {
    return Date.UTC(this.year, this.month-1, this.day, this.hour, this.minute, this.second)
  }

  copyWith({
    year = this.year,
    month = this.month,
    day = this.day,
    hour = this.hour,
    minute = this.minute,
    second = this.second
  } = {}) {
    return new CronosDate(year, month, day, hour, minute, second)
  }
}

// Adapted from Intl.DateTimeFormat timezone handling in https://github.com/moment/luxon

const ZoneCache: Map<string, CronosTimezone> = new Map()

export class CronosTimezone {
  zoneName?: string
  fixedOffset?: number

  private dateTimeFormat?: Intl.DateTimeFormat
  private winterOffset? : number
  private summerOffset? : number

  constructor(IANANameOrOffset: string | number) {
    if (typeof IANANameOrOffset === 'number') {
      if (IANANameOrOffset > 840 || IANANameOrOffset < -840) throw new Error('Invalid offset')
      this.fixedOffset = IANANameOrOffset
      return this
    }
    const offsetMatch = IANANameOrOffset.match(/^([+-]?)(0[1-9]|1[0-4])(?::?([0-5][0-9]))?$/)
    if (offsetMatch) {
      this.fixedOffset = (offsetMatch[1] === '-' ? -1 : 1) * (
        (parseInt(offsetMatch[2], 10) * 60) + (parseInt(offsetMatch[3], 10) || 0)
      )
      return this
    }
    if (ZoneCache.has(IANANameOrOffset)) {
      return ZoneCache.get(IANANameOrOffset) as CronosTimezone
    }

    try {
      this.dateTimeFormat = new Intl.DateTimeFormat("en-US", {
        hour12: false,
        timeZone: IANANameOrOffset,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    } catch (err) {
      throw new Error('Invalid IANA name or offset')
    }

    this.zoneName = IANANameOrOffset
    
    const currentYear = new Date().getUTCFullYear()
    this.winterOffset = this.offset(Date.UTC(currentYear, 0, 1))
    this.summerOffset = this.offset(Date.UTC(currentYear, 5, 1))

    ZoneCache.set(IANANameOrOffset, this)
  }

  toString() {
    if (this.fixedOffset) {
      const absOffset = Math.abs(this.fixedOffset)
      return [
        this.fixedOffset < 0 ? '-' : '+',
        Math.floor(absOffset / 60).toString().padStart(2, '0'),
        (absOffset % 60).toString().padStart(2, '0')
      ].join('')
    }
    return this.zoneName
  }

  private offset(ts: number) {
    if (!this.dateTimeFormat) return this.fixedOffset || 0

    const date = new Date(ts)
    const {year, month, day, hour, minute, second} = this.nativeDateToCronosDate(date)
        
    const asUTC = Date.UTC(year, month-1, day, hour, minute, second),
          asTS = ts - (ts % 1000)
    return (asUTC - asTS) / 60000
  }

  private nativeDateToCronosDate(date: Date) {
    if (!this.dateTimeFormat) {
      return CronosDate['fromUTCTimestamp'](
        date.getTime() + (this.fixedOffset || 0) * 60000
      )
    }
    return this.dateTimeFormat.formatToParts
      ? partsOffset(this.dateTimeFormat, date)
      : hackyOffset(this.dateTimeFormat, date)
  }

  private cronosDateToNativeDate(date: CronosDate) {
    if (!this.dateTimeFormat) {
      return new Date(
        date['toUTCTimestamp']() - (this.fixedOffset || 0) * 60000
      )
    }

    const provisionalOffset = ((date.month > 3 || date.month < 11) ? this.summerOffset : this.winterOffset) || 0

    const UTCTimestamp = date['toUTCTimestamp']()

    // Find the right offset a given local time.
    // Our UTC time is just a guess because our offset is just a guess
    let utcGuess = UTCTimestamp - provisionalOffset * 60000

    // Test whether the zone matches the offset for this ts
    const o2 = this.offset(utcGuess)

    // If so, offset didn't change and we're done
    if (provisionalOffset === o2) return new Date(utcGuess)

    // If not, change the ts by the difference in the offset
    utcGuess -= (o2 - provisionalOffset) * 60000

    // If that gives us the local time we want, we're done
    const o3 = this.offset(utcGuess)
    if (o2 === o3) return new Date(utcGuess)

    // If it's different, we're in a hole time. The offset has changed, but the we don't adjust the time
    return new Date(UTCTimestamp - Math.min(o2, o3) * 60000)
  }
}

function hackyOffset(dtf: Intl.DateTimeFormat, date: Date) {
  const formatted = dtf.format(date).replace(/\u200E/g, ""),
        parsed = formatted.match(/(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/),
        [, month, day, year, hour, minute, second] = (parsed || []).map(n => parseInt(n, 10))
  return new CronosDate(year, month, day, hour, minute, second)
}

function partsOffset(dtf: Intl.DateTimeFormat, date: Date) {
  const formatted = dtf.formatToParts(date)
  return new CronosDate(
    parseInt(formatted[4].value, 10),
    parseInt(formatted[0].value, 10),
    parseInt(formatted[2].value, 10),
    parseInt(formatted[6].value, 10),
    parseInt(formatted[8].value, 10),
    parseInt(formatted[10].value, 10)
  )
}
