const { CronosExpression } = require('../lib/expression')

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
