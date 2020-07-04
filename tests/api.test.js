const { scheduleTask, CronosExpression, CronosTask, validate } = require('../pkg/dist-node')

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

function getTimestamp(dateStr) {
  return new Date(dateStr).getTime()
}

describe('CronosExpression.nextDate() defaults', () => {
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

describe('Scheduling tests', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    global.Date = RealDate
  })

  test('scheduleTask()', () => {
    const callback = jest.fn()

    const fromDate = '2019-04-21T11:23:45Z'
    mockDate(fromDate)

    const task = scheduleTask('23 18/3 * * Wed', callback, {
      timezone: 'Europe/London'
    })

    expect(task).toBeInstanceOf(CronosTask)
    expect(callback).not.toBeCalled()

    const nextExpectedDate = '2019-04-24T17:23:00Z'

    mockDate(nextExpectedDate)
    jest.advanceTimersByTime( getTimestamp(nextExpectedDate) - getTimestamp(fromDate) )

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith( getTimestamp(nextExpectedDate) )

    task.stop()
  })

  test('CronosTask', () => {
    const startedCallback = jest.fn()
    const runCallback = jest.fn()
    const endedCallback = jest.fn()

    const fromDate = '2019-04-21T11:23:45Z'
    mockDate(fromDate)

    const task = new CronosTask(
      CronosExpression.parse('0 23 18/3 * Apr Tue 2019', {
        timezone: 0
      })
    )

    task
      .on('started', startedCallback)
      .on('run', runCallback)
      .on('ended', endedCallback)

    expect(startedCallback).not.toBeCalled()

    task.start()

    expect(startedCallback).toBeCalled()

    while (task.isRunning) {
      mockDate(task.nextRun)
      jest.runOnlyPendingTimers()
    }

    expect(runCallback).toHaveBeenCalledTimes(4)
    expect(runCallback).toHaveBeenLastCalledWith( getTimestamp('2019-04-30T21:23:00Z') )

    expect(endedCallback).toBeCalled()

    task.off('run', runCallback)
  })

  test('Stopping task in run callback', () => {
    const runCallback = jest.fn()
    const stoppedCallback = jest.fn()

    const fromDate = '2019-04-21T11:23:45Z'
    mockDate(fromDate)

    const task = new CronosTask(
      CronosExpression.parse('0 23 18/3 * Apr Tue 2019', {
        timezone: 0
      })
    )

    task
      .on('run', () => {
        runCallback()
        task.stop()
      })
      .on('stopped', stoppedCallback)
      .start()

    mockDate(task.nextRun)
    jest.runOnlyPendingTimers()

    expect(runCallback).toHaveBeenCalledTimes(1)

    expect(stoppedCallback).toBeCalled()

    expect(task.isRunning).toEqual(false)
  })

  test('Calling .start() while task running', () => {
    const runCallback = jest.fn()
    const startedCallback = jest.fn()
    const stoppedCallback = jest.fn()

    const fromDate = '2020-07-04T12:00:00Z'
    mockDate(fromDate)

    const task = new CronosTask(
      CronosExpression.parse('0/5 * * * * *', {
        timezone: 0
      })
    )

    task
      .on('started', startedCallback)
      .on('run', runCallback)
      .on('stopped', stoppedCallback)
      .start()

    for (let i = 1; i <= 6; i++) {
      mockDate(task.nextRun)
      jest.runOnlyPendingTimers()

      expect(runCallback).toHaveBeenLastCalledWith(
        1593864000000 + (i*5000)
      )
    }
    
    expect(runCallback).toHaveBeenCalledTimes(6)

    // second start call
    task.start()

    for (let i = 1; i <= 6; i++) {
      mockDate(task.nextRun)
      jest.runOnlyPendingTimers()

      expect(runCallback).toHaveBeenLastCalledWith(
        1593864030000 + (i*5000)
      )
    }
    
    expect(runCallback).toHaveBeenCalledTimes(12)

    expect(startedCallback).toHaveBeenCalledTimes(1)
    expect(stoppedCallback).toHaveBeenCalledTimes(0)

    task.stop()
    task.stop()

    expect(stoppedCallback).toHaveBeenCalledTimes(1)
  })

  test('CronosTask with array of dates', () => {
    const startedCallback = jest.fn()
    const runCallback = jest.fn()

    const fromDate = '2019-04-21T11:23:45Z'
    mockDate(fromDate)

    const task = new CronosTask(
      [new Date(2020, 7, 23, 9, 45, 0), 1555847845000, '5 Oct 2019 17:32']
    )

    task
      .on('started', startedCallback)
      .on('run', runCallback)

    expect(startedCallback).not.toBeCalled()

    task.start()

    expect(startedCallback).toBeCalled()

    mockDate('2019-04-21T11:57:25Z')
    jest.runOnlyPendingTimers()

    expect(runCallback).toHaveBeenCalledTimes(1)
    expect(runCallback).toHaveBeenLastCalledWith( getTimestamp('2019-04-21T11:57:25Z') )

    task.off('run', runCallback)
  })

  test('CronosTask with invalid date', () => {
    expect(
      () => new CronosTask('invalid')
    ).toThrow()
  })

})

describe('CronosExpression.cronString and .toString()', () => {
  test('Local timezone', () => {
    const expr = CronosExpression.parse('0 10 16 4,L Jun * 2035')

    expect(expr.cronString).toEqual('0 10 16 4,L Jun * 2035')
    expect(expr.toString()).toEqual('0 10 16 4,L Jun * 2035 (tz: Local, skipRepeatedHour: true, missingHour: insert)')
  })

  test('IANA timezone', () => {
    expect(CronosExpression.parse('0 10 16 4,L Jun * 2035', {
      timezone: 'America/New_York',
      missingHour: 'offset'
    }).toString()).toEqual('0 10 16 4,L Jun * 2035 (tz: America/New_York, skipRepeatedHour: true, missingHour: offset)')
  })

  test('Fixed offset', () => {
    expect(CronosExpression.parse('0 10 16 4,L Jun * 2035', {
      timezone: -270,
    }).toString()).toEqual('0 10 16 4,L Jun * 2035 (tz: -0430)')
  })
})
