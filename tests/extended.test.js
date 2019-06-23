const { CronosExpression } = require('../pkg/dist-node')

test('6 stars (* * * * * *)', () => {
  expect(
    CronosExpression.parse('* * * * * *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 11, 23, 46),
    new Date(2019, 3, 21, 11, 23, 47),
    new Date(2019, 3, 21, 11, 23, 48),
    new Date(2019, 3, 21, 11, 23, 49),
    new Date(2019, 3, 21, 11, 23, 50)
  ])
})

describe('Last day (L)', () => {
  test('Last day of month', () => {
    expect(
      CronosExpression.parse('0 0 L * *')
        .nextNDates(new Date(2019, 0, 21, 11, 23, 45), 5)
    ).toEqual([
      new Date(2019, 0, 31, 0, 0, 0),
      new Date(2019, 1, 28, 0, 0, 0),
      new Date(2019, 2, 31, 0, 0, 0),
      new Date(2019, 3, 30, 0, 0, 0),
      new Date(2019, 4, 31, 0, 0, 0)
    ])
  })

  test('Last wednesday of month', () => {
    expect(
      CronosExpression.parse('0 0 * * WedL')
        .nextNDates(new Date(2019, 0, 21, 11, 23, 45), 5)
    ).toEqual([
      new Date(2019, 0, 30, 0, 0, 0),
      new Date(2019, 1, 27, 0, 0, 0),
      new Date(2019, 2, 27, 0, 0, 0),
      new Date(2019, 3, 24, 0, 0, 0),
      new Date(2019, 4, 29, 0, 0, 0)
    ])
  })
})

describe('Nearest weekday (W)', () => {
  test('Nearest weekday to 1st', () => {
    expect(
      CronosExpression.parse('0 0 1W * *')
        .nextNDates(new Date(2019, 0, 21, 11, 23, 45), 5)
    ).toEqual([
      new Date(2019, 1, 1, 0, 0, 0),
      new Date(2019, 2, 1, 0, 0, 0),
      new Date(2019, 3, 1, 0, 0, 0),
      new Date(2019, 4, 1, 0, 0, 0),
      new Date(2019, 5, 3, 0, 0, 0)
    ])
  })

  test('Nearest weekday to 30th', () => {
    expect(
      CronosExpression.parse('0 0 30W * *')
        .nextNDates(new Date(2019, 1, 21, 11, 23, 45), 5)
    ).toEqual([
      new Date(2019, 1, 28, 0, 0, 0),
      new Date(2019, 2, 29, 0, 0, 0),
      new Date(2019, 3, 30, 0, 0, 0),
      new Date(2019, 4, 30, 0, 0, 0),
      new Date(2019, 5, 28, 0, 0, 0),
    ])
  })

  test('Last weekday of month', () => {
    expect(
      CronosExpression.parse('0 0 LW * *')
        .nextNDates(new Date(2019, 0, 21, 11, 23, 45), 5)
    ).toEqual([
      new Date(2019, 0, 31, 0, 0, 0),
      new Date(2019, 1, 28, 0, 0, 0),
      new Date(2019, 2, 29, 0, 0, 0),
      new Date(2019, 3, 30, 0, 0, 0),
      new Date(2019, 4, 31, 0, 0, 0)
    ])
  })
})

describe('Nth of month (#)', () => {
  test('2st Fri of month', () => {
    expect(
      CronosExpression.parse('0 0 * * Fri#2')
        .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
    ).toEqual([
      new Date(2019, 4, 10, 0, 0, 0),
      new Date(2019, 5, 14, 0, 0, 0),
      new Date(2019, 6, 12, 0, 0, 0),
      new Date(2019, 7, 9, 0, 0, 0),
      new Date(2019, 8, 13, 0, 0, 0)
    ])
  })

  test('5th Thu of month', () => {
    expect(
      CronosExpression.parse('0 0 * * Thu#5')
        .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
    ).toEqual([
      new Date(2019, 4, 30, 0, 0, 0),
      new Date(2019, 7, 29, 0, 0, 0),
      new Date(2019, 9, 31, 0, 0, 0),
      new Date(2020, 0, 30, 0, 0, 0),
      new Date(2020, 3, 30, 0, 0, 0)
    ])
  })

  test('0th Tue of month is invalid', () => {
    expect(
      () => CronosExpression.parse('0 0 * * Tue#0')
    ).toThrow()
  })

  test('6th Mon of month is invalid', () => {
    expect(
      () => CronosExpression.parse('0 0 * * Mon#6')
    ).toThrow()
  })

  test('3.5th Tue of month is invalid', () => {
    expect(
      () => CronosExpression.parse('0 0 * * Tue#3.5')
    ).toThrow()
  })

  test('"fourth" Mon of month is invalid', () => {
    expect(
      () => CronosExpression.parse('0 0 * * Mon#fourth')
    ).toThrow()
  })

})

describe('Year field', () => {
  test('16:10, 4th and last of Jun, 2035', () => {
    expect(
      CronosExpression.parse('0 10 16 4,L Jun * 2035')
        .nextNDates(new Date(2019, 3, 21, 11, 23, 45))
    ).toEqual([
      new Date(2035, 5, 4, 16, 10, 0),
      new Date(2035, 5, 30, 16, 10, 0)
    ])
  })

})
