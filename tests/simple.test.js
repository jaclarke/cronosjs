const { CronosExpression } = require('../pkg/dist-node')

test('Every minute (* * * * *)', () => {
  expect(
    CronosExpression.parse('* * * * *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 11, 24, 0),
    new Date(2019, 3, 21, 11, 25, 0),
    new Date(2019, 3, 21, 11, 26, 0),
    new Date(2019, 3, 21, 11, 27, 0),
    new Date(2019, 3, 21, 11, 28, 0)
  ])
})

test('17th minute of every hour (17 * * * *)', () => {
  expect(
    CronosExpression.parse('17 * * * *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 12, 17, 0),
    new Date(2019, 3, 21, 13, 17, 0),
    new Date(2019, 3, 21, 14, 17, 0),
    new Date(2019, 3, 21, 15, 17, 0),
    new Date(2019, 3, 21, 16, 17, 0)
  ])
})

test('5:17 every day (17 5 * * *)', () => {
  expect(
    CronosExpression.parse('17 5 * * *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 22, 5, 17, 0),
    new Date(2019, 3, 23, 5, 17, 0),
    new Date(2019, 3, 24, 5, 17, 0),
    new Date(2019, 3, 25, 5, 17, 0),
    new Date(2019, 3, 26, 5, 17, 0)
  ])
})

test('Every minute of 5th hour (* 5 * * *)', () => {
  expect(
    CronosExpression.parse('* 5 * * *')
      .nextNDates(new Date(2019, 3, 21, 5, 56, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 5, 57, 0),
    new Date(2019, 3, 21, 5, 58, 0),
    new Date(2019, 3, 21, 5, 59, 0),
    new Date(2019, 3, 22, 5, 0, 0),
    new Date(2019, 3, 22, 5, 1, 0)
  ])
})

test('5:17 every 31st of month (17 5 31 * *)', () => {
  expect(
    CronosExpression.parse('17 5 31 * *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 4, 31, 5, 17, 0),
    new Date(2019, 6, 31, 5, 17, 0),
    new Date(2019, 7, 31, 5, 17, 0),
    new Date(2019, 9, 31, 5, 17, 0),
    new Date(2019, 11, 31, 5, 17, 0)
  ])
})

test('5:17 29 Feb (17 5 29 Feb *)', () => {
  expect(
    CronosExpression.parse('17 5 29 Feb *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2020, 1, 29, 5, 17, 0),
    new Date(2024, 1, 29, 5, 17, 0),
    new Date(2028, 1, 29, 5, 17, 0),
    new Date(2032, 1, 29, 5, 17, 0),
    new Date(2036, 1, 29, 5, 17, 0)
  ])
})

test('5:17 every Tue (17 5 * * Tue)', () => {
  expect(
    CronosExpression.parse('17 5 * * Tue')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 23, 5, 17, 0),
    new Date(2019, 3, 30, 5, 17, 0),
    new Date(2019, 4, 7, 5, 17, 0),
    new Date(2019, 4, 14, 5, 17, 0),
    new Date(2019, 4, 21, 5, 17, 0)
  ])
})

test('5:17 every 3rd and Tue of month (17 5 3 * Tue)', () => {
  expect(
    CronosExpression.parse('17 5 3 * Tue')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 23, 5, 17, 0),
    new Date(2019, 3, 30, 5, 17, 0),
    new Date(2019, 4, 3, 5, 17, 0),
    new Date(2019, 4, 7, 5, 17, 0),
    new Date(2019, 4, 14, 5, 17, 0),
  ])
})

test('Every 4th hour after the 7th hour (0 7/5 * * *)', () => {
  expect(
    CronosExpression.parse('0 7/5 * * *')
      .nextNDates(new Date(2019, 3, 21, 5, 56, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 7, 0, 0),
    new Date(2019, 3, 21, 12, 0, 0),
    new Date(2019, 3, 21, 17, 0, 0),
    new Date(2019, 3, 21, 22, 0, 0),
    new Date(2019, 3, 22, 7, 0, 0)
  ])
})

test('Every 3rd hour between the 8th and 18th hour (0 8-18/3 * * *)', () => {
  expect(
    CronosExpression.parse('0 8-18/3 * * *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 14, 0, 0),
    new Date(2019, 3, 21, 17, 0, 0),
    new Date(2019, 3, 22, 8, 0, 0),
    new Date(2019, 3, 22, 11, 0, 0),
    new Date(2019, 3, 22, 14, 0, 0)
  ])
})

test('Every 3rd hour (0 */3 * * *)', () => {
  expect(
    CronosExpression.parse('0 */3 * * *')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 12, 0, 0),
    new Date(2019, 3, 21, 15, 0, 0),
    new Date(2019, 3, 21, 18, 0, 0),
    new Date(2019, 3, 21, 21, 0, 0),
    new Date(2019, 3, 22, 0, 0, 0)
  ])
})
