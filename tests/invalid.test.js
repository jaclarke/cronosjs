const { CronosExpression } = require('../lib/expression')

test('Too few fields', () => {
  expect(
    () => CronosExpression.parse('* * * *')
  ).toThrow()
})

test('Too many fields', () => {
  expect(
    () => CronosExpression.parse('* * * * * * * *')
  ).toThrow()
})

test('Range start greater than range end', () => {
  expect(
    () => CronosExpression.parse('32-8 * * * *')
  ).toThrow()
})

test('Range start too small', () => {
  expect(
    () => CronosExpression.parse('* * * 0-4 *')
  ).toThrow()
})

test('Range end too large', () => {
  expect(
    () => CronosExpression.parse('* 17-27 * * *')
  ).toThrow()
})

describe('Invalid second field', () => {

  test('Too small value', () => {
    expect(
      () => CronosExpression.parse('-1 * * * * *')
    ).toThrow()
  })

  test('Min valid value', () => {
    expect(
      () => CronosExpression.parse('0 * * * * *')
    ).not.toThrow()
  })

  test('Max valid value', () => {
    expect(
      () => CronosExpression.parse('59 * * * * *')
    ).not.toThrow()
  })

  test('Too large value', () => {
    expect(
      () => CronosExpression.parse('60 * * * * *')
    ).toThrow()
  })

  test('Invalid symbol L', () => {
    expect(
      () => CronosExpression.parse('L * * * * *')
    ).toThrow()
  })

  test('Invalid symbol W', () => {
    expect(
      () => CronosExpression.parse('W * * * * *')
    ).toThrow()
  })

  test('Invalid symbol #', () => {
    expect(
      () => CronosExpression.parse('# * * * * *')
    ).toThrow()
  })

})

describe('Invalid minute field', () => {

  test('Too small value', () => {
    expect(
      () => CronosExpression.parse('-1 * * * *')
    ).toThrow()
  })

  test('Min valid value', () => {
    expect(
      () => CronosExpression.parse('0 * * * *')
    ).not.toThrow()
  })

  test('Max valid value', () => {
    expect(
      () => CronosExpression.parse('59 * * * *')
    ).not.toThrow()
  })

  test('Too large value', () => {
    expect(
      () => CronosExpression.parse('60 * * * *')
    ).toThrow()
  })

  test('Invalid symbol L', () => {
    expect(
      () => CronosExpression.parse('L * * * *')
    ).toThrow()
  })

  test('Invalid symbol W', () => {
    expect(
      () => CronosExpression.parse('W * * * *')
    ).toThrow()
  })

  test('Invalid symbol #', () => {
    expect(
      () => CronosExpression.parse('# * * * *')
    ).toThrow()
  })

})

describe('Invalid hour field', () => {

  test('Too small value', () => {
    expect(
      () => CronosExpression.parse('* -1 * * *')
    ).toThrow()
  })

  test('Min valid value', () => {
    expect(
      () => CronosExpression.parse('* 0 * * *')
    ).not.toThrow()
  })

  test('Max valid value', () => {
    expect(
      () => CronosExpression.parse('* 23 * * *')
    ).not.toThrow()
  })

  test('Too large value', () => {
    expect(
      () => CronosExpression.parse('* 24 * * *')
    ).toThrow()
  })

  test('Invalid symbol L', () => {
    expect(
      () => CronosExpression.parse('* L * * *')
    ).toThrow()
  })

  test('Invalid symbol W', () => {
    expect(
      () => CronosExpression.parse('* W * * *')
    ).toThrow()
  })

  test('Invalid symbol #', () => {
    expect(
      () => CronosExpression.parse('* # * * *')
    ).toThrow()
  })

})

describe('Invalid day of month field', () => {

  test('Too small value', () => {
    expect(
      () => CronosExpression.parse('* * 0 * *')
    ).toThrow()
  })

  test('Min valid value', () => {
    expect(
      () => CronosExpression.parse('* * 1 * *')
    ).not.toThrow()
  })

  test('Max valid value', () => {
    expect(
      () => CronosExpression.parse('* * 31 * *')
    ).not.toThrow()
  })

  test('Too large value', () => {
    expect(
      () => CronosExpression.parse('* * 32 * *')
    ).toThrow()
  })

  test('Invalid symbol #', () => {
    expect(
      () => CronosExpression.parse('* * # * *')
    ).toThrow()
  })

  test('Invalid day and last symbol', () => {
    expect(
      () => CronosExpression.parse('* * 7L * *')
    ).toThrow()
  })

})

describe('Invalid month field', () => {

  test('Too small value', () => {
    expect(
      () => CronosExpression.parse('* * * 0 *')
    ).toThrow()
  })

  test('Min valid value', () => {
    expect(
      () => CronosExpression.parse('* * * 1 *')
    ).not.toThrow()
  })

  test('Max valid value', () => {
    expect(
      () => CronosExpression.parse('* * * 12 *')
    ).not.toThrow()
  })

  test('Too large value', () => {
    expect(
      () => CronosExpression.parse('* * * 13 *')
    ).toThrow()
  })

  test('Invalid symbol L', () => {
    expect(
      () => CronosExpression.parse('* * * L *')
    ).toThrow()
  })

  test('Invalid symbol W', () => {
    expect(
      () => CronosExpression.parse('* * * W *')
    ).toThrow()
  })

  test('Invalid symbol #', () => {
    expect(
      () => CronosExpression.parse('* * * # *')
    ).toThrow()
  })

})

describe('Invalid day of week field', () => {

  test('Too small value', () => {
    expect(
      () => CronosExpression.parse('* * * * -1')
    ).toThrow()
  })

  test('Min valid value', () => {
    expect(
      () => CronosExpression.parse('* * * * 0')
    ).not.toThrow()
  })

  test('Max valid value', () => {
    expect(
      () => CronosExpression.parse('* * * * 7')
    ).not.toThrow()
  })

  test('Too large value', () => {
    expect(
      () => CronosExpression.parse('* * * * 8')
    ).toThrow()
  })

  test('Invalid symbol W', () => {
    expect(
      () => CronosExpression.parse('* * * * W')
    ).toThrow()
  })

})

describe('Invalid year field', () => {

  test('Too small value', () => {
    expect(
      () => CronosExpression.parse('* * * * * * 1969')
    ).toThrow()
  })

  test('Min valid value', () => {
    expect(
      () => CronosExpression.parse('* * * * * * 1970')
    ).not.toThrow()
  })

  test('Max valid value', () => {
    expect(
      () => CronosExpression.parse('* * * * * * 2099')
    ).not.toThrow()
  })

  test('Too large value', () => {
    expect(
      () => CronosExpression.parse('* * * * * * 2100')
    ).toThrow()
  })

  test('Invalid symbol L', () => {
    expect(
      () => CronosExpression.parse('* * * * * * L')
    ).toThrow()
  })

  test('Invalid symbol W', () => {
    expect(
      () => CronosExpression.parse('* * * * * * W')
    ).toThrow()
  })

  test('Invalid symbol #', () => {
    expect(
      () => CronosExpression.parse('* * * * * * #')
    ).toThrow()
  })

})
