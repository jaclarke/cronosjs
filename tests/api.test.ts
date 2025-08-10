import { test, expect, describe, beforeEach, afterEach, vi } from "vitest";
import {
  scheduleTask,
  CronosExpression,
  CronosTask,
  validate,
} from "../src/index.js";

function getTimestamp(dateStr: string) {
  return new Date(dateStr).getTime();
}

describe("CronosExpression.nextDate() defaults", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("", () => {
    vi.setSystemTime("2019-04-21T11:23:45Z");
    expect(CronosExpression.parse("* * * * *").nextDate()).toEqual(
      new Date("2019-04-21T11:24:00Z")
    );
  });

  test("", () => {
    vi.setSystemTime("2019-04-21T11:23:45Z");
    expect(CronosExpression.parse("* * * * *").nextNDates()).toEqual([
      new Date("2019-04-21T11:24:00Z"),
      new Date("2019-04-21T11:25:00Z"),
      new Date("2019-04-21T11:26:00Z"),
      new Date("2019-04-21T11:27:00Z"),
      new Date("2019-04-21T11:28:00Z"),
    ]);
  });
});

describe("Validate cron string", () => {
  test("Valid string", () => {
    expect(validate("0 10 16 4,L Jun * 2035")).toEqual(true);
  });

  test("Invalid string", () => {
    expect(validate("0 10W 16 4,L Jun * 2035")).toEqual(false);
  });
});

describe("Scheduling tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("scheduleTask()", () => {
    const callback = vi.fn();

    const fromDate = "2019-04-21T11:23:45Z";
    vi.setSystemTime(fromDate);

    const task = scheduleTask("23 18/3 * * Wed", callback, {
      timezone: "Europe/London",
    });

    expect(task).toBeInstanceOf(CronosTask);
    expect(callback).not.toBeCalled();

    const nextExpectedDate = "2019-04-24T17:23:00Z";

    vi.setSystemTime(nextExpectedDate);
    vi.advanceTimersByTime(
      getTimestamp(nextExpectedDate) - getTimestamp(fromDate)
    );

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(getTimestamp(nextExpectedDate));

    task.stop();

    expect(() => {
      const task = scheduleTask("0 0 * * *", () => {});
      task.stop();
    }).not.toThrow();
  });

  test("CronosTask", () => {
    const startedCallback = vi.fn();
    const runCallback = vi.fn();
    const endedCallback = vi.fn();

    const fromDate = "2019-04-21T11:23:45Z";
    vi.setSystemTime(fromDate);

    const task = new CronosTask(
      CronosExpression.parse("0 23 18/3 * Apr Tue 2019", {
        timezone: 0,
      })
    );

    task
      .on("started", startedCallback)
      .on("run", runCallback)
      .on("ended", endedCallback);

    expect(startedCallback).not.toBeCalled();

    task.start();

    expect(startedCallback).toBeCalled();

    while (task.isRunning) {
      vi.advanceTimersToNextTimer();
    }

    expect(runCallback).toHaveBeenCalledTimes(4);
    expect(runCallback).toHaveBeenLastCalledWith(
      getTimestamp("2019-04-30T21:23:00Z")
    );

    expect(endedCallback).toBeCalled();

    task.off("run", runCallback);
  });

  test("Stopping task in run callback", () => {
    const runCallback = vi.fn();
    const stoppedCallback = vi.fn();

    const fromDate = "2019-04-21T11:23:45Z";
    vi.setSystemTime(fromDate);

    const task = new CronosTask(
      CronosExpression.parse("0 23 18/3 * Apr Tue 2019", {
        timezone: 0,
      })
    );

    task
      .on("run", () => {
        runCallback();
        task.stop();
      })
      .on("stopped", stoppedCallback)
      .start();

    vi.setSystemTime(task.nextRun!);
    vi.runOnlyPendingTimers();

    expect(runCallback).toHaveBeenCalledTimes(1);

    expect(stoppedCallback).toBeCalled();

    expect(task.isRunning).toEqual(false);
  });

  test("Calling .start() while task running", () => {
    const runCallback = vi.fn();
    const startedCallback = vi.fn();
    const stoppedCallback = vi.fn();

    const fromDate = "2020-07-04T12:00:00Z";
    vi.setSystemTime(fromDate);

    const task = new CronosTask(
      CronosExpression.parse("0/5 * * * * *", {
        timezone: 0,
      })
    );

    task
      .on("started", startedCallback)
      .on("run", runCallback)
      .on("stopped", stoppedCallback)
      .start();

    for (let i = 1; i <= 6; i++) {
      vi.advanceTimersToNextTimer();

      expect(runCallback).toHaveBeenLastCalledWith(1593864000000 + i * 5000);
    }

    expect(runCallback).toHaveBeenCalledTimes(6);

    // second start call
    task.start();

    for (let i = 1; i <= 6; i++) {
      vi.advanceTimersToNextTimer();

      expect(runCallback).toHaveBeenLastCalledWith(1593864030000 + i * 5000);
    }

    expect(runCallback).toHaveBeenCalledTimes(12);

    expect(startedCallback).toHaveBeenCalledTimes(1);
    expect(stoppedCallback).toHaveBeenCalledTimes(0);

    task.stop();
    task.stop();

    expect(stoppedCallback).toHaveBeenCalledTimes(1);
  });

  test("CronosTask with array of dates", () => {
    const startedCallback = vi.fn();
    const runCallback = vi.fn();

    const fromDate = "2019-04-21T11:23:45Z";
    vi.setSystemTime(fromDate);

    const task = new CronosTask([
      new Date(2020, 7, 23, 9, 45, 0),
      1555847845000,
      "5 Oct 2019 17:32",
    ]);

    task.on("started", startedCallback).on("run", runCallback);

    expect(startedCallback).not.toBeCalled();

    task.start();

    expect(startedCallback).toBeCalled();

    vi.setSystemTime("2019-04-21T11:57:25Z");
    vi.runOnlyPendingTimers();

    expect(runCallback).toHaveBeenCalledTimes(1);
    expect(runCallback).toHaveBeenLastCalledWith(
      getTimestamp("2019-04-21T11:57:25Z")
    );

    task.off("run", runCallback);
  });

  test("CronosTask with invalid date", () => {
    expect(() => new CronosTask("invalid")).toThrow();
  });
});

describe("CronosExpression.cronString and .toString()", () => {
  test("Local timezone", () => {
    const expr = CronosExpression.parse("0 10 16 4,L Jun * 2035");

    expect(expr.cronString).toEqual("0 10 16 4,L Jun * 2035");
    expect(expr.toString()).toEqual(
      "0 10 16 4,L Jun * 2035 (tz: Local, skipRepeatedHour: true, missingHour: insert)"
    );
  });

  test("IANA timezone", () => {
    expect(
      CronosExpression.parse("0 10 16 4,L Jun * 2035", {
        timezone: "America/New_York",
        missingHour: "offset",
      }).toString()
    ).toEqual(
      "0 10 16 4,L Jun * 2035 (tz: America/New_York, skipRepeatedHour: true, missingHour: offset)"
    );
  });

  test("Fixed offset", () => {
    expect(
      CronosExpression.parse("0 10 16 4,L Jun * 2035", {
        timezone: -270,
      }).toString()
    ).toEqual("0 10 16 4,L Jun * 2035 (tz: -0430)");
  });
});
