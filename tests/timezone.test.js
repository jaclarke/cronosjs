const { CronosExpression, CronosTimezone } = require('../pkg/dist-node')

test('5:17 every Tue (EST/EDT)', () => {
  expect(
    CronosExpression.parse('17 5 * * Tue', {timezone: 'America/New_York'})
      .nextNDates(new Date('2019-03-02T16:23:45.000Z'), 5) // 11:23:45 02/03/2019 EST
  ).toEqual([
    new Date('2019-03-05T10:17:00.000Z'), // 5:17:00 05/03/2019 EST
    new Date('2019-03-12T09:17:00.000Z'), // 5:17:00 12/03/2019 EDT
    new Date('2019-03-19T09:17:00.000Z'), // 5:17:00 19/03/2019 EDT
    new Date('2019-03-26T09:17:00.000Z'), // 5:17:00 26/03/2019 EDT
    new Date('2019-04-02T09:17:00.000Z')  // 5:17:00 02/04/2019 EDT
  ])
})

test('Midnight at start of every month (Europe/Warsaw)', () => {
  expect(
    CronosExpression.parse('0 0 0 1 * ? *', {timezone: 'Europe/Warsaw'})
      .nextNDates(new Date('2021-02-01T22:00:00Z'), 5)
  ).toEqual([
    new Date('2021-02-28T23:00:00.000Z'),
    new Date('2021-03-31T22:00:00.000Z'),
    new Date('2021-04-30T22:00:00.000Z'),
    new Date('2021-05-31T22:00:00.000Z'),
    new Date('2021-06-30T22:00:00.000Z'),
  ])
})

test('5:17 every Tue (EST/EDT) (from DTF string format)', () => {
  const RealFormatToParts = Intl.DateTimeFormat.prototype.formatToParts
  Intl.DateTimeFormat.prototype.formatToParts = undefined

  expect(
    CronosExpression.parse('17 5 * * Tue', {timezone: 'America/New_York'})
      .nextNDates(new Date('2019-03-02T16:23:45.000Z'), 5) // 11:23:45 02/03/2019 EST
  ).toEqual([
    new Date('2019-03-05T10:17:00.000Z'), // 5:17:00 05/03/2019 EST
    new Date('2019-03-12T09:17:00.000Z'), // 5:17:00 12/03/2019 EDT
    new Date('2019-03-19T09:17:00.000Z'), // 5:17:00 19/03/2019 EDT
    new Date('2019-03-26T09:17:00.000Z'), // 5:17:00 26/03/2019 EDT
    new Date('2019-04-02T09:17:00.000Z')  // 5:17:00 02/04/2019 EDT
  ])

  Intl.DateTimeFormat.prototype.formatToParts = RealFormatToParts
})

test('Midnight at start of every month (Europe/Warsaw) (from DTF string format)', () => {
  const RealFormatToParts = Intl.DateTimeFormat.prototype.formatToParts
  Intl.DateTimeFormat.prototype.formatToParts = undefined

  expect(
    CronosExpression.parse('0 0 0 1 * ? *', {timezone: 'Europe/Warsaw'})
      .nextNDates(new Date('2021-02-01T22:00:00Z'), 5)
  ).toEqual([
    new Date('2021-02-28T23:00:00.000Z'),
    new Date('2021-03-31T22:00:00.000Z'),
    new Date('2021-04-30T22:00:00.000Z'),
    new Date('2021-05-31T22:00:00.000Z'),
    new Date('2021-06-30T22:00:00.000Z'),
  ])

  Intl.DateTimeFormat.prototype.formatToParts = RealFormatToParts
})

describe('CronosTimezone parsing', () => {
  test('Fixed offset number', () => {
    expect(
      new CronosTimezone(-120).fixedOffset
    ).toEqual(-120)
  })

  test('Invalid fixed offset number', () => {
    expect(
      () => new CronosTimezone(850)
    ).toThrow()
  })

  test('Fixed offset string (\'09:30\')', () => {
    expect(
      new CronosTimezone('09:30').fixedOffset
    ).toEqual(570)
  })

  test('Fixed offset string (\'-0300\')', () => {
    expect(
      new CronosTimezone('-0300').fixedOffset
    ).toEqual(-180)
  })

  test('Invalid IANA string', () => {
    expect(
      () => new CronosTimezone('Invalid/Timezone')
    ).toThrow()
  })
})

describe('Daylight savings options', () => {
  // skip missing
  test('Missing hour skip, 1am', () => {
    expect(
      CronosExpression.parse('5/20 1 * * *', {
        missingHour: 'skip'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-04-01T00:05:00.000Z'),
      new Date('2019-04-01T00:25:00.000Z'),
      new Date('2019-04-01T00:45:00.000Z'),
      new Date('2019-04-02T00:05:00.000Z'),
      new Date('2019-04-02T00:25:00.000Z'),
    ])
  })

  test('Missing hour skip, 2am', () => {
    expect(
      CronosExpression.parse('5/20 2 * * *', {
        missingHour: 'skip'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:05:00.000Z'),
      new Date('2019-03-31T01:25:00.000Z'),
      new Date('2019-03-31T01:45:00.000Z'),
      new Date('2019-04-01T01:05:00.000Z'),
      new Date('2019-04-01T01:25:00.000Z'),
    ])
  })

  test('Missing hour skip, 1 and 2am', () => {
    expect(
      CronosExpression.parse('5/20 1,2 * * *', {
        missingHour: 'skip'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:05:00.000Z'),
      new Date('2019-03-31T01:25:00.000Z'),
      new Date('2019-03-31T01:45:00.000Z'),
      new Date('2019-04-01T00:05:00.000Z'),
      new Date('2019-04-01T00:25:00.000Z'),
    ])
  })

  // offset missing
  test('Missing hour offset, 1am', () => {
    expect(
      CronosExpression.parse('5/20 1 * * *', {
        missingHour: 'offset'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:05:00.000Z'),
      new Date('2019-03-31T01:25:00.000Z'),
      new Date('2019-03-31T01:45:00.000Z'),
      new Date('2019-04-01T00:05:00.000Z'),
      new Date('2019-04-01T00:25:00.000Z'),
    ])
  })

  test('Missing hour offset, 2am', () => {
    expect(
      CronosExpression.parse('5/20 2 * * *', {
        missingHour: 'offset'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:05:00.000Z'),
      new Date('2019-03-31T01:25:00.000Z'),
      new Date('2019-03-31T01:45:00.000Z'),
      new Date('2019-04-01T01:05:00.000Z'),
      new Date('2019-04-01T01:25:00.000Z'),
    ])
  })

  test('Missing hour offset, 1 and 2am', () => {
    expect(
      CronosExpression.parse('5/20 1,2 * * *', {
        missingHour: 'offset'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:05:00.000Z'),
      new Date('2019-03-31T01:25:00.000Z'),
      new Date('2019-03-31T01:45:00.000Z'),
      new Date('2019-04-01T00:05:00.000Z'),
      new Date('2019-04-01T00:25:00.000Z'),
    ])
  })

  // insert missing
  test('Missing hour insert, 1am', () => {
    expect(
      CronosExpression.parse('5/20 1 * * *', {
        missingHour: 'insert'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:00:00.000Z'),
      new Date('2019-04-01T00:05:00.000Z'),
      new Date('2019-04-01T00:25:00.000Z'),
      new Date('2019-04-01T00:45:00.000Z'),
      new Date('2019-04-02T00:05:00.000Z'),
    ])
  })

  test('Missing hour insert, 2am', () => {
    expect(
      CronosExpression.parse('5/20 2 * * *', {
        missingHour: 'insert'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:05:00.000Z'),
      new Date('2019-03-31T01:25:00.000Z'),
      new Date('2019-03-31T01:45:00.000Z'),
      new Date('2019-04-01T01:05:00.000Z'),
      new Date('2019-04-01T01:25:00.000Z'),
    ])
  })

  test('Missing hour insert, 1 and 2am', () => {
    expect(
      CronosExpression.parse('5/20 1,2 * * *', {
        missingHour: 'insert'
      }).nextNDates(new Date('2019-03-30T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-03-31T01:00:00.000Z'),
      new Date('2019-03-31T01:05:00.000Z'),
      new Date('2019-03-31T01:25:00.000Z'),
      new Date('2019-03-31T01:45:00.000Z'),
      new Date('2019-04-01T00:05:00.000Z'),
    ])
  })

  // repeated skip
  test('Repeated hour skipped, from 00:00 BST', () => {
    expect(
      CronosExpression.parse('*/20 1 * * *', {
        skipRepeatedHour: true
      }).nextNDates(new Date('2019-10-26T23:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-10-27T00:00:00.000Z'),
      new Date('2019-10-27T00:20:00.000Z'),
      new Date('2019-10-27T00:40:00.000Z'),
      new Date('2019-10-28T01:00:00.000Z'),
      new Date('2019-10-28T01:20:00.000Z'),
    ])
  })

  test('Repeated hour skipped, from 01:00 GMT', () => {
    expect(
      CronosExpression.parse('*/20 1 * * *', {
        skipRepeatedHour: true
      }).nextNDates(new Date('2019-10-27T01:00:00.000Z'), 5)
    ).toEqual([
      new Date('2019-10-28T01:00:00.000Z'),
      new Date('2019-10-28T01:20:00.000Z'),
      new Date('2019-10-28T01:40:00.000Z'),
      new Date('2019-10-29T01:00:00.000Z'),
      new Date('2019-10-29T01:20:00.000Z'),
    ])
  })

  // repeated hour not skipped
  test('Repeated hour not skipped, from 00:00 BST', () => {
    expect(
      CronosExpression.parse('*/20 1 * * *', {
        skipRepeatedHour: false
      }).nextNDates(new Date('2019-10-26T23:00:00.000Z'), 10)
    ).toEqual([
      new Date('2019-10-27T00:00:00.000Z'),
      new Date('2019-10-27T00:20:00.000Z'),
      new Date('2019-10-27T00:40:00.000Z'),
      new Date('2019-10-27T01:00:00.000Z'),
      new Date('2019-10-27T01:20:00.000Z'),
      new Date('2019-10-27T01:40:00.000Z'),
      new Date('2019-10-28T01:00:00.000Z'),
      new Date('2019-10-28T01:20:00.000Z'),
      new Date('2019-10-28T01:40:00.000Z'),
      new Date('2019-10-29T01:00:00.000Z'),
    ])
  })

  test('Repeated hour not skipped, from 01:00 GMT', () => {
    expect(
      CronosExpression.parse('*/20 1 * * *', {
        skipRepeatedHour: false
      }).nextNDates(new Date('2019-10-27T01:00:00.000Z'), 10)
    ).toEqual([
      new Date('2019-10-27T01:20:00.000Z'),
      new Date('2019-10-27T01:40:00.000Z'),
      new Date('2019-10-28T01:00:00.000Z'),
      new Date('2019-10-28T01:20:00.000Z'),
      new Date('2019-10-28T01:40:00.000Z'),
      new Date('2019-10-29T01:00:00.000Z'),
      new Date('2019-10-29T01:20:00.000Z'),
      new Date('2019-10-29T01:40:00.000Z'),
      new Date('2019-10-30T01:00:00.000Z'),
      new Date('2019-10-30T01:20:00.000Z'),
    ])
  })

})
