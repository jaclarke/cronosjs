const { CronosExpression } = require('../lib/expression')

test('@hourly', () => {
  expect(
    CronosExpression.parse('@hourly')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 21, 12, 0, 0),
    new Date(2019, 3, 21, 13, 0, 0),
    new Date(2019, 3, 21, 14, 0, 0),
    new Date(2019, 3, 21, 15, 0, 0),
    new Date(2019, 3, 21, 16, 0, 0)
  ])
})

test('@midnight', () => {
  expect(
    CronosExpression.parse('@midnight')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 22, 0, 0, 0),
    new Date(2019, 3, 23, 0, 0, 0),
    new Date(2019, 3, 24, 0, 0, 0),
    new Date(2019, 3, 25, 0, 0, 0),
    new Date(2019, 3, 26, 0, 0, 0)
  ])
})

test('@daily', () => {
  expect(
    CronosExpression.parse('@daily')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 22, 0, 0, 0),
    new Date(2019, 3, 23, 0, 0, 0),
    new Date(2019, 3, 24, 0, 0, 0),
    new Date(2019, 3, 25, 0, 0, 0),
    new Date(2019, 3, 26, 0, 0, 0)
  ])
})

test('@weekly', () => {
  expect(
    CronosExpression.parse('@weekly')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 3, 28, 0, 0, 0),
    new Date(2019, 4, 5, 0, 0, 0),
    new Date(2019, 4, 12, 0, 0, 0),
    new Date(2019, 4, 19, 0, 0, 0),
    new Date(2019, 4, 26, 0, 0, 0),
  ])
})

test('@monthly', () => {
  expect(
    CronosExpression.parse('@monthly')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2019, 4, 1, 0, 0, 0),
    new Date(2019, 5, 1, 0, 0, 0),
    new Date(2019, 6, 1, 0, 0, 0),
    new Date(2019, 7, 1, 0, 0, 0),
    new Date(2019, 8, 1, 0, 0, 0)
  ])
})

test('@annually', () => {
  expect(
    CronosExpression.parse('@annually')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2020, 0, 1, 0, 0, 0),
    new Date(2021, 0, 1, 0, 0, 0),
    new Date(2022, 0, 1, 0, 0, 0),
    new Date(2023, 0, 1, 0, 0, 0),
    new Date(2024, 0, 1, 0, 0, 0)
  ])
})

test('@yearly', () => {
  expect(
    CronosExpression.parse('@yearly')
      .nextNDates(new Date(2019, 3, 21, 11, 23, 45), 5)
  ).toEqual([
    new Date(2020, 0, 1, 0, 0, 0),
    new Date(2021, 0, 1, 0, 0, 0),
    new Date(2022, 0, 1, 0, 0, 0),
    new Date(2023, 0, 1, 0, 0, 0),
    new Date(2024, 0, 1, 0, 0, 0)
  ])
})
