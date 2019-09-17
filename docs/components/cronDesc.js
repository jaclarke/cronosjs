function addOrdinalSuffix(n) {
  const lastDigit = n % 10,
        secondLastDigit = Math.floor(n / 10) % 10
        
  if (secondLastDigit === 1) return n+'<sup>th</sup>'

  if (lastDigit === 1) return n+'<sup>st</sup>'
  if (lastDigit === 2) return n+'<sup>nd</sup>'
  if (lastDigit === 3) return n+'<sup>rd</sup>'

  return n+'<sup>th</sup>'
}

function andJoin(arr) {
  if (arr.length <= 1) return arr[0] || ''
  return arr.slice(0, -1).join(', ')+' and '+arr[arr.length-1]
}

function getTimePartDesc(field, suffix, index, firstPart, lastPart) {
  const parts = []

  if (field.some(s => s.any)) {
    parts.push({s: `every ${suffix()}`, i: [index]})
    if (!lastPart) parts.push({s: ' of '})
  } else {
    const singleParts = field
        .filter(s => s.single)
        .map((s, i, a) => suffix(s.range.from, i === (a.length-1))),
      otherParts = field
        .filter(s => !s.single)
        .map(s => {
          let str = `every ${s.step > 1 ? s.step+' '+suffix()+'s' : suffix()}`
          if (s.range) str += ` from ${suffix(s.range.from, !s.range.to)}`
          if (s.range && s.range.to) str += ` to ${suffix(s.range.to, true)}`
          return str
        })
    if (firstPart && singleParts.length) parts.push({s: 'at '})
    const desc = andJoin([
      ...(singleParts.length ? [andJoin(singleParts)] : []),
      ...otherParts,
    ])
    parts.push( {s: desc, i: [index]} )
    if (!lastPart) parts.push( {s: ' past '} )
  }

  return parts
}

function getTimeDescription(seconds, minutes, hours, showSeconds) {
  if (
    seconds.length === 1 && seconds[0].single &&
    minutes.length === 1 && minutes[0].single &&
    hours.length === 1 && hours[0].single
  ) {
    return [
      {s: 'at '},
      {s: hours[0].range.from.toString().padStart(2, '0'), i: [2]},
      {s: ':'},
      {s: minutes[0].range.from.toString().padStart(2, '0'), i: [1]},
      ...(
        showSeconds ? [
          {s: ':'},
          {s: seconds[0].range.from.toString().padStart(2, '0'), i: [0]}
        ] : []
      )
    ]
  }

  return [
    ...(
      showSeconds ? getTimePartDesc(seconds, (n, final) => {
        if (n === undefined) return 'second'
        return `${n}${final ? ' second'+(n===1?'':'s') : ''}`
      }, 0, true, false) : []
    ),
    ...getTimePartDesc(minutes, (n, final) => {
        if (n === undefined) return 'minute'
        return `${n}${final ? ' minute'+(n===1?'':'s') : ''}`
      }, 1, !showSeconds, false),
    ...getTimePartDesc(hours, (n, final) => {
        if (n === undefined) return 'hour'
        return `${n.toString().padStart(2, '0')}:00`
      }, 2, false, true)
  ]
}

function getPartsDesc(fieldItems, transform, fieldName) {
  const singleParts = fieldItems
      .filter(p => p.single)
      .map((p, i) => transform(p.range.from, i === 0)),
    otherParts = fieldItems
      .filter(p => !p.single)
      .map(p => {
        let str = `every ${p.step > 1 ? p.step+' '+fieldName+'s' : fieldName}`
        if (p.range) str += ` from ${transform(p.range.from, true)}`
        if (p.range && p.range.to) str += ` to ${transform(p.range.to, true)}`
        return str
      })
  return { singleParts, otherParts }
}

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function getWeekdays(items) {
  return items.map(n => weekdays[n])
}

function getDayDescription(field, values) {
  if (field.allDays) {
    return [
      {s: 'every day', i: [3, 5]}
    ]
  }

  let daysDescParts = []
  const daysItems = field.daysItems.filter(item => !item.any)
  if (daysItems.length) {
    const {singleParts, otherParts} = getPartsDesc(daysItems, (n, prefix) => `${prefix?'the ':''}${addOrdinalSuffix(n)}`, 'day')
    daysDescParts.push(andJoin(singleParts), ...otherParts)
  }
  if (field.lastDay) daysDescParts.push('the last day')
  if (field.nearestWeekdayItems.some(item => item.any)) daysDescParts.push('every weekday')
  else {
    const nearestWeekdayItems = field.nearestWeekdayItems.filter(item => !item.any)
    if (nearestWeekdayItems.length) {
      const {singleParts, otherParts} = getPartsDesc(nearestWeekdayItems, (n, prefix) => `${prefix?'the ':''}${addOrdinalSuffix(n)}`, 'day')
      if (singleParts.length) daysDescParts.push(`the nearest weekday${singleParts.length > 1 ? 's' : ''} to ${andJoin(singleParts)}`)
      daysDescParts.push(...otherParts.map(s => 'the nearest weekdays to '+s))
    }
    if (field.lastWeekday) daysDescParts.push('the last weekday')
  }
  daysDescParts = daysDescParts.filter(s => s)

  const weeksDescParts = []
  if (values.daysOfWeek.length) {
    weeksDescParts.push('every '+andJoin(getWeekdays(values.daysOfWeek)))
  }
  field.nthDaysOfWeekItems.reduce((nth, item) => {
    nth[item.nth-1].push(item.item)
    return nth
  }, [[],[],[],[],[]]).forEach((items, i) => {
    if (items.some(item => item.any)) weeksDescParts.push(`the ${addOrdinalSuffix(i+1)} week`)
    else {
      const days = values.nthDaysOfWeek.filter(day => day[1] === i+1).map(day => day[0])
      if (days.length) weeksDescParts.push(`the ${addOrdinalSuffix(i+1)} ${andJoin(getWeekdays(days))}`)
    }
  })
  if (field.lastDaysOfWeekItems.some(item => item.any)) weeksDescParts.push('the last week')
  else if (values.lastDaysOfWeek.length) {
    weeksDescParts.push('the last '+andJoin(getWeekdays(values.lastDaysOfWeek)))
  }
  
  const daysDesc = !weeksDescParts.length ? andJoin(daysDescParts) : daysDescParts.join(', ')
  const weeksDesc = andJoin(weeksDescParts)

  const desc = []
  if (daysDesc) desc.push({s: daysDesc, i: [3]})
  if (daysDesc && weeksDesc) desc.push({
      s: (weeksDescParts.length === 1) ? ' and ' : ', '
    })
  if (weeksDesc) desc.push({s: weeksDesc, i: [5]})
  if (desc[0] && desc[0].s.startsWith('the')) desc.unshift({s: 'on '})

  return desc
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function getMonthDescription(fieldItems) {
  if (fieldItems.some(item => item.any)) {
    return {s: 'every month', i: [4]}
  }

  const {singleParts, otherParts} = getPartsDesc(fieldItems, n => `${months[n-1]}`, 'month')

  return {s: andJoin([andJoin(singleParts), ...otherParts].filter(s => s)), i: [4]}
}

function getYearDescription(fieldItems) {
  if (fieldItems.length === 1 && fieldItems[0].single) {
    return {s: `only in ${fieldItems[0].range.from}`, i: [6]}
  }
  if (fieldItems.some(item => item.any)) {
    return {s: 'every year', i: [6]}
  }

  const {singleParts, otherParts} = getPartsDesc(fieldItems, n => n, 'year')

  return {
    s: (singleParts.length ? 'in ' : '') +
       andJoin([andJoin(singleParts), ...otherParts].filter(s => s)),
    i: [6]
  }
}

export function getDescriptionParts({
  secondsField,
  yearsField,
  secondsParsed,
  minutesParsed,
  hoursParsed,
  daysAndWeeksParsed,
  daysAndWeeksValues,
  monthsParsed,
  yearsParsed
}) {
  const showSeconds = !!secondsField,
        showYears = !!yearsField

  const desc = [
    ...getTimeDescription(secondsParsed.items, minutesParsed.items, hoursParsed.items, showSeconds),
    {s: ', '},
    ...getDayDescription(daysAndWeeksParsed, daysAndWeeksValues),
    {s: ', of '},
    getMonthDescription(monthsParsed.items),
    ...(showYears ? [{s: ', '}, getYearDescription(yearsParsed.items)] : [])
  ]

  if (desc[0]) desc[0].s = desc[0].s[0].toUpperCase() + desc[0].s.slice(1)

  return desc
}
