import { test, expect } from "vitest";
import { CronosExpression } from "../src/index.js";

test("No warnings", () => {
  expect(CronosExpression.parse("0 0 ? * ?").warnings).toEqual([]);
});

test.each([
  ["*/72 0 0 * * *", 1],
  ["0 25/60 0 * * *", 1],
  ["0 30/30 0 * * *", 1],
  ["0 30/29 0 * * *", 0],
  ["0 0 3-14/4 * * *", 0],
  ["0 0 3-14/12 * * *", 1],
  ["0 0 0 7/25 * *", 1],
  ["0 0 0 7/24 * *", 0],
  ["0 0 0 */31 * *", 1],
  ["0 0 0 5-12/7W * *", 0],
  ["0 0 0 5-12/8W * *", 1],
  ["0 0 0 ? Sep-Apr/7 *", 0],
  ["0 0 0 ? Sep-Apr/8 *", 1],
  ["0 0 0 ? Sep-Aug/12 *", 1],
  ["0 0 0 ? Sep-Aug/11 *", 0],
  ["0 0 0 ? * mon/6", 1],
  ["0 0 0 ? * */7#2", 1],
  ["0 0 0 ? * fri-sun/2", 0],
  ["0 0 0 ? * fri-sun/3", 1],
  ["0 0 0 ? * fri-sun/3L", 1],
  ["0 0 0 * * ? */1000000", 1],
  ["0 0 0 * * ? */273790", 1],
  ["0 0 0 * * ? */273789", 0],
  ["0 0 0 * * ? 2020-2025/5", 0],
  ["0 0 0 * * ? 2020-2025/6", 1],
  ["0 0 0 * * ? 2020/273739", 0],
  ["0 0 0 * * ? 2020/273740", 1],
  ["*/72 30/30 3-14/4 ? * mon/6,*/7#2,fri-sun/2 *", 4],
])("IncrementLargerThanRange (%s)", (cronString, warningCount) => {
  const expr = CronosExpression.parse(cronString);

  expect(expr.warnings).toHaveLength(warningCount);

  for (let warning of expr.warnings) {
    expect(warning.type).toEqual("IncrementLargerThanRange");
  }

  if (warningCount) {
    expect(() =>
      CronosExpression.parse(cronString, { strict: true })
    ).toThrow();
  } else {
    expect(() =>
      CronosExpression.parse(cronString, { strict: true })
    ).not.toThrow();
  }
});
