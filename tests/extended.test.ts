import { test, expect, describe } from "vitest";
import { CronosExpression } from "../src/index.js";

test("6 stars (* * * * * *)", () => {
  expect(
    CronosExpression.parse("* * * * * *").nextNDates(
      new Date(2019, 3, 21, 11, 23, 45),
      5
    )
  ).toEqual([
    new Date(2019, 3, 21, 11, 23, 46),
    new Date(2019, 3, 21, 11, 23, 47),
    new Date(2019, 3, 21, 11, 23, 48),
    new Date(2019, 3, 21, 11, 23, 49),
    new Date(2019, 3, 21, 11, 23, 50),
  ]);
});

test("? symbol", () => {
  expect(() => CronosExpression.parse("? * * * *")).toThrow();
  expect(() => CronosExpression.parse("* ? * * *")).toThrow();
  expect(() => CronosExpression.parse("* * ? * *")).not.toThrow();
  expect(() => CronosExpression.parse("* * * ? *")).toThrow();
  expect(() => CronosExpression.parse("* * * * ?")).not.toThrow();
  expect(() => CronosExpression.parse("* * ?/3 * *")).toThrow();
  expect(() => CronosExpression.parse("* * * * ?#3")).toThrow();

  const now = new Date();
  expect(CronosExpression.parse("0 0 ? Jan ?").nextNDates(now)).toEqual(
    CronosExpression.parse("0 0 * Jan *").nextNDates(now)
  );
});

describe("Last day (L)", () => {
  test("Last day of month", () => {
    expect(
      CronosExpression.parse("0 0 L * *").nextNDates(
        new Date(2019, 0, 21, 11, 23, 45),
        5
      )
    ).toEqual([
      new Date(2019, 0, 31, 0, 0, 0),
      new Date(2019, 1, 28, 0, 0, 0),
      new Date(2019, 2, 31, 0, 0, 0),
      new Date(2019, 3, 30, 0, 0, 0),
      new Date(2019, 4, 31, 0, 0, 0),
    ]);
  });

  test("Last wednesday of month", () => {
    expect(
      CronosExpression.parse("0 0 * * WedL").nextNDates(
        new Date(2019, 0, 21, 11, 23, 45),
        5
      )
    ).toEqual([
      new Date(2019, 0, 30, 0, 0, 0),
      new Date(2019, 1, 27, 0, 0, 0),
      new Date(2019, 2, 27, 0, 0, 0),
      new Date(2019, 3, 24, 0, 0, 0),
      new Date(2019, 4, 29, 0, 0, 0),
    ]);
  });
});

describe("Nearest weekday (W)", () => {
  test("Nearest weekday to 1st", () => {
    expect(
      CronosExpression.parse("0 0 1W * *").nextNDates(
        new Date(2019, 0, 21, 11, 23, 45),
        5
      )
    ).toEqual([
      new Date(2019, 1, 1, 0, 0, 0),
      new Date(2019, 2, 1, 0, 0, 0),
      new Date(2019, 3, 1, 0, 0, 0),
      new Date(2019, 4, 1, 0, 0, 0),
      new Date(2019, 5, 3, 0, 0, 0),
    ]);
  });

  test("Nearest weekday to 30th", () => {
    expect(
      CronosExpression.parse("0 0 30W * *").nextNDates(
        new Date(2019, 1, 21, 11, 23, 45),
        5
      )
    ).toEqual([
      new Date(2019, 1, 28, 0, 0, 0),
      new Date(2019, 2, 29, 0, 0, 0),
      new Date(2019, 3, 30, 0, 0, 0),
      new Date(2019, 4, 30, 0, 0, 0),
      new Date(2019, 5, 28, 0, 0, 0),
    ]);
  });

  test("Last weekday of month", () => {
    expect(
      CronosExpression.parse("0 0 LW * *").nextNDates(
        new Date(2019, 0, 21, 11, 23, 45),
        5
      )
    ).toEqual([
      new Date(2019, 0, 31, 0, 0, 0),
      new Date(2019, 1, 28, 0, 0, 0),
      new Date(2019, 2, 29, 0, 0, 0),
      new Date(2019, 3, 30, 0, 0, 0),
      new Date(2019, 4, 31, 0, 0, 0),
    ]);
  });
});

describe("Nth of month (#)", () => {
  test("2st Fri of month", () => {
    expect(
      CronosExpression.parse("0 0 * * Fri#2").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45),
        5
      )
    ).toEqual([
      new Date(2019, 4, 10, 0, 0, 0),
      new Date(2019, 5, 14, 0, 0, 0),
      new Date(2019, 6, 12, 0, 0, 0),
      new Date(2019, 7, 9, 0, 0, 0),
      new Date(2019, 8, 13, 0, 0, 0),
    ]);
  });

  test("5th Thu of month", () => {
    expect(
      CronosExpression.parse("0 0 * * Thu#5").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45),
        5
      )
    ).toEqual([
      new Date(2019, 4, 30, 0, 0, 0),
      new Date(2019, 7, 29, 0, 0, 0),
      new Date(2019, 9, 31, 0, 0, 0),
      new Date(2020, 0, 30, 0, 0, 0),
      new Date(2020, 3, 30, 0, 0, 0),
    ]);
  });

  test("0th Tue of month is invalid", () => {
    expect(() => CronosExpression.parse("0 0 * * Tue#0")).toThrow();
  });

  test("6th Mon of month is invalid", () => {
    expect(() => CronosExpression.parse("0 0 * * Mon#6")).toThrow();
  });

  test("3.5th Tue of month is invalid", () => {
    expect(() => CronosExpression.parse("0 0 * * Tue#3.5")).toThrow();
  });

  test('"fourth" Mon of month is invalid', () => {
    expect(() => CronosExpression.parse("0 0 * * Mon#fourth")).toThrow();
  });
});

describe("Year field", () => {
  test("16:10, 4th and last of Jun, 2035", () => {
    expect(
      CronosExpression.parse("0 10 16 4,L Jun * 2035").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45)
      )
    ).toEqual([
      new Date(2035, 5, 4, 16, 10, 0),
      new Date(2035, 5, 30, 16, 10, 0),
    ]);
  });

  test("16:10, last day of Feb, 2035 to 2045", () => {
    expect(
      CronosExpression.parse("0 10 16 L Feb * 2035-2045").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45),
        15
      )
    ).toEqual([
      new Date(2035, 1, 28, 16, 10, 0),
      new Date(2036, 1, 29, 16, 10, 0),
      new Date(2037, 1, 28, 16, 10, 0),
      new Date(2038, 1, 28, 16, 10, 0),
      new Date(2039, 1, 28, 16, 10, 0),
      new Date(2040, 1, 29, 16, 10, 0),
      new Date(2041, 1, 28, 16, 10, 0),
      new Date(2042, 1, 28, 16, 10, 0),
      new Date(2043, 1, 28, 16, 10, 0),
      new Date(2044, 1, 29, 16, 10, 0),
      new Date(2045, 1, 28, 16, 10, 0),
    ]);
  });

  test("16:10, 1st Jan, every 3 years", () => {
    expect(
      CronosExpression.parse("0 10 16 1 1 * */3").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45)
      )
    ).toEqual([
      new Date(2021, 0, 1, 16, 10, 0),
      new Date(2024, 0, 1, 16, 10, 0),
      new Date(2027, 0, 1, 16, 10, 0),
      new Date(2030, 0, 1, 16, 10, 0),
      new Date(2033, 0, 1, 16, 10, 0),
    ]);
  });

  test("16:10, 1st Jan, 2022 onwards", () => {
    expect(
      CronosExpression.parse("0 10 16 1 1 * 2022/1").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45)
      )
    ).toEqual([
      new Date(2022, 0, 1, 16, 10, 0),
      new Date(2023, 0, 1, 16, 10, 0),
      new Date(2024, 0, 1, 16, 10, 0),
      new Date(2025, 0, 1, 16, 10, 0),
      new Date(2026, 0, 1, 16, 10, 0),
    ]);
  });

  test("16:10, 1st Jan, every 3 years from 2012 to 2030", () => {
    expect(
      CronosExpression.parse("0 10 16 1 1 * 2012-2030/3").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45)
      )
    ).toEqual([
      new Date(2021, 0, 1, 16, 10, 0),
      new Date(2024, 0, 1, 16, 10, 0),
      new Date(2027, 0, 1, 16, 10, 0),
      new Date(2030, 0, 1, 16, 10, 0),
    ]);
  });

  test("16:10, 1st Jan, every other year 275750 onwards (near year limit)", () => {
    expect(
      CronosExpression.parse("0 10 16 1 1 * 275750/2").nextNDates(
        new Date(2019, 3, 21, 11, 23, 45),
        10
      )
    ).toEqual([
      new Date(275750, 0, 1, 16, 10, 0),
      new Date(275752, 0, 1, 16, 10, 0),
      new Date(275754, 0, 1, 16, 10, 0),
      new Date(275756, 0, 1, 16, 10, 0),
      new Date(275758, 0, 1, 16, 10, 0),
    ]);
  });
});
