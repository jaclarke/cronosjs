const { CronosExpression, validate } = require('../lib')
const { CronosDate } = require('../lib/date')

describe('CronosExpression.nextDate() defaults', () => {
  const RealDate = Date

  function mockDate (isoDate) {
    global.Date = class extends RealDate {
      constructor(...theArgs) {
        if (theArgs.length) {
          return new RealDate(...theArgs);
        }
        return new RealDate(isoDate);
      }
    
      static now() {
        return new RealDate(isoDate).getTime();
      }
    }
  }

  afterEach(() => {
    global.Date = RealDate
  })

  test('', () => {
    mockDate('2019-04-21T11:23:45Z')
    expect(
      CronosExpression.parse('* * * * *').nextDate()
    ).toEqual(new Date('2019-04-21T11:24:00Z'))
  })

  test('', () => {
    mockDate('2019-04-21T11:23:45Z')
    expect(
      CronosExpression.parse('* * * * *').nextNDates()
    ).toEqual([
      new Date('2019-04-21T11:24:00Z'),
      new Date('2019-04-21T11:25:00Z'),
      new Date('2019-04-21T11:26:00Z'),
      new Date('2019-04-21T11:27:00Z'),
      new Date('2019-04-21T11:28:00Z')
    ])
  })
})

describe('Validate cron string', () => {
  test('Valid string', () => {
    expect(validate('0 10 16 4,L Jun * 2035')).toEqual(true)
  })

  test('Invalid string', () => {
    expect(validate('0 10W 16 4,L Jun * 2035')).toEqual(false)
  })
})

test('CronosDate.copyWith()', () => {
  const date = new CronosDate(2019, 4, 21, 11, 23, 45)

  expect(date.copyWith()).toEqual(date)

  expect(
    date.copyWith({
      year: 2020, month: 5, day: 22, hour: 12, minute: 24, second: 46
    })
  ).toEqual(new CronosDate(2020, 5, 22, 12, 24, 46))
})
