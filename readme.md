# CronosJS

![license](https://img.shields.io/npm/l/cronosjs.svg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/cronosjs.svg)
[![Build Status](https://travis-ci.com/jaclarke/cronosjs.svg?branch=master)](https://travis-ci.com/jaclarke/cronosjs)
[![Coverage Status](https://coveralls.io/repos/github/jaclarke/cronosjs/badge.svg?branch=master)](https://coveralls.io/github/jaclarke/cronosjs?branch=master)

A cron based task scheduler for node and the browser, with extended syntax and timezone support.

Features:
 - Extended cron syntax support, including [last day](#last-day--l-) (`L`), [nearest weekday](#nearest-weekday--w-) (`W`), [nth of month](#nth-of-month---) (`#`), optional second and year fields, and [predefined expressions](#predefined-expressions)
 - Fixed offset and IANA [timezone support](#timezone-support), via `Intl` api
 - Configurable [daylight saving](#daylight-savings-behaviour) handling
 - Zero dependencies


## Install / Usage

```bash
npm i cronosjs
```

```js
import { scheduleTask, validate, CronosExpression } from 'cronosjs'

// schedule task every 10 minutes
scheduleTask('*/10 * * * *', (timestamp) => {
  console.log(`Task triggered at ${timestamp}`)
})

// schedule task at 16:10, on the 4th and last day of July, 2035 in the EST timezone
scheduleTask('0 10 16 4,L Jul * 2035', (timestamp) => {
  console.log(`Task triggered at ${timestamp}`)
}, {
  timezone: 'America/New_York'
})

// offset tasks occurring in daylight savings missing hour
scheduleTask('5/20 1 * Mar SunL', (timestamp) => {
  console.log(`Task triggered at ${timestamp}`)
}, {
  timezone: 'Europe/London',
  missingHour: 'offset'
})

// validate cron string
validate('* * 5 smarch *') // false

validate('0 1/120 * * * *', {
  strict: true
}) // false

// get next cron date
CronosExpression.parse('* * 2/5 Jan *').nextDate()

// get next 7 cron dates after 09:17, 12th Mar 2019
CronosExpression.parse('* * 2/5 Jan *').nextNDates(
  new Date('2019-03-12T09:17:00.000Z'), 7)

// advanced usage
const expression = CronosExpression.parse('0 10 16 4,L Jul * 2035', {
  timezone: 'America/New_York'
})
const task = new CronosTask(expression)

task
  .on('run', (timestamp) => {
    console.log(`Task triggered at ${timestamp}`)
  })
  .on('ended', () => {
    console.log(`No more dates matching expression`)
  })
  .start()

// strict mode / warnings
CronosExpression.parse('0 1/120 * * * *', {
  strict: true
}) // Error: Strict mode: Parsing failed with 1 warnings

const strictExpr = CronosExpression.parse('0 1/120 * * * *')

console.log(strictExpr.warnings)
// [{
//   type: 'IncrementLargerThanRange',
//   message: "Increment (120) is larger than range (58) for expression '1/120'"
// }]

// schedule tasks from a list of dates
const taskFromDates = new CronosTask([
  new Date(2020, 7, 23, 9, 45, 0),
  1555847845000,
  '5 Oct 2019 17:32',
])

taskFromDates
  .on('run', (timestamp) => {
    console.log(`Task triggered at ${timestamp}`)
  })
  .on('ended', () => {
    console.log(`No more dates in list`)
  })
  .start()
```


## Supported expression syntax

```
*  *  *  *  *  *  *    Field              Allowed values    Special symbols
|  |  |  |  |  |  |    -----------------  ---------------   ---------------
`--|--|--|--|--|--|->  Second (optional)  0-59              * / , -
   `--|--|--|--|--|->  Minute             0-59              * / , -
      `--|--|--|--|->  Hour               0-23              * / , -
         `--|--|--|->  Day of Month       1-31              * / , - ? L W
            `--|--|->  Month              1-12 or JAN-DEC   * / , -
               `--|->  Day of Week        0-7 or SUN-SAT    * / , - ? L #
                  `->  Year (optional)    0-275759          * / , -
```

A cron expression is defined by between 5 and 7 fields separated by whitespace, as detailed above. Each field can contain an integer value in the allowed values range for that field, a three letter abbreviation (case insensitive) for the *Day of Week* and *Month* fields, or an expression containing a symbol.

A [predefined expression](#predefined-expressions) can also be given.

For the *Day of Week* field, `0` and `7` are equivalent to `Sun` , `1 = Mon` , ... , `5 = Fri` , `6 = Sat`.

> **Note** If only 5 fields are given, both the optional *second* and *year* fields will be given their default values of `0` and `*` respectively.  
> If 6 fields are given, the first field is assumed to be the *second* field, and the *year* field given its default value.

> **Why the 0 to 275759 allowed year range?**  
> The JS Date object supports dates 8,640,000,000,000,000 milliseconds either side of the 1st Jan, 1970 UTC ([ECMAScript 2019 Specification](https://www.ecma-international.org/ecma-262/10.0/index.html#sec-time-values-and-time-range)), giving a maximum valid date of 13th Sep, 275760. Therefore the largest full year representable as a JS Date is 275759.  
> The year 0 is chosen as the minimum, disallowing negative years, to avoid confusion with the range symbol (`-`).

---

The following symbols are valid for any field:

### All / Any values (`*`)
Selects all allowed values in the *second*, *minute*, *hour*, *month* and *year* fields. If part of a list of expressions in any of those fields, `*` will effectively override any other expression in that field.  
Can also be used as part of an expression containing the special symbols `/`, `L`, `W` or `#` as detailed below, where it similarly acts as a range of all valid values for that field, eg. in the *hour* field acts as `0-23`.

In the *Day of Month* and *Day of Week* fields, `*` on its own acts as a placeholder, matching any day (sometimes referred to as "no specific value"), and is overridden by any other expression listed in either *"Day of ..."* field. Only if both fields are '`*`', will the symbol have an effect, selecting every day of the month.  
If part of another expression, it acts as above.

The `?` symbol can be used as an alias for '`*`' (on its own) in the *Day of Month* and *Day of Week* fields.

### List (`,`)
Separates a list of expressions for a field.

The separated expressions can contain any of the allowed values and symbols for that field; however while valid, some lists may not make sense, eg. in `6-14,*`, the `6-14` part is made redundant by the `*` part.

### Range (`-`)
Defines a range of values, inclusive. eg. `16-39` in the seconds field means the 16th second and every second after up to and including the 39th second.

For fields with a cyclic nature (ie. *Second*, *Minute*, *Hour*, *Month* and *Day of Week*), wrap-around ranges are supported, eg. `Fri-Mon` will select `Fri, Sat, Sun and Mon`. Otherwise for non-cyclic fields (ie. *Day of Month* and *Year*) the second value is required to be greater than the first value.

> **Note** Wrap-around ranges are purely 'syntactic sugar' to primarily make *day of week* and *month* ranges simpler to write, and do not alter the underlying behaviour of this cron library. The parser effectively translates wrap-around expressions such as `Fri-Mon` to the standard form, as though it were written as `Fri-Sat,Sun-Mon` (`5-1` and `5-6,0-1` respectively in numerical form), meaning any range expression is still able to be written in a form compatible with other cron implementations.  
>  
> It is for this reason *Day of Month* is considered non-cyclic, since the number of days in a month differs between months, leading to possibly unexpected behaviour when a wraparound range is used with an increment.  
> eg. The *Day of Month* expression `27-5/2` would select the days `27, 29, 31, 2, 4`, regardless of the number of days in the month, so in a month with only 30 days the actual scheduled days would become `27, 29, 2, 4`, creating a 3 day increment between the 29th and the 2nd. Correctly handling increments across the wraparound would create behaviour incompatible with other cron implementations, such that simple translation to a non wrap-around form would not be possible.

### Increments (`/`)
Defines increments of a range. Can be used in three ways:
 - The full range can be given, eg. `4-38/3` in the minutes field means the 4th minute and every 3rd minute after upto the 38th minute, ie. [4, 7, 10, ..., 31, 34, 37]
 - The start of the range can be given, eg. `4/3`, in which case the end of the range will be the maximum allowed value for that field
 - Or can be used with the `*` symbol, eg. `*/3`, which will use the full range allowed for that field, ie. equivalent to `0-59/3` for the minutes field

---

The following symbols are valid only for the *Day of Month* and/or *Day of Week* fields, and can be combined with any valid expression above (unless specified otherwise):

### No Specific Value (`?`)
An alias for '`*`' in the *Day of Month* and *Day of Week* fields.

> **Note** Is not valid as part of another expression, eg. `?/2`, `?W` and `?#3` are invalid.

### Last day (`L`)
When used in the *Day of Month* field, must be on its own, and means the last day of that month.

When used in the *Day of Week* field, must be used as a suffix on another expression, and means the last specified day(s) of week of that month.

Examples:
 - `WedL` selects the last Wednesday of the month
 - `*L` selects the whole last week of the month
 - `Mon-WedL` selects the last Monday, Tuesday and Wednesday of the month

### Nearest weekday (`W`)
The `W` symbol is only valid as a suffix for the *Day of Month* field, and will select the nearest weekday(s) (Mon-Fri) to the given day(s) if that day is a Saturday or Sunday, otherwise will select the given day.

Examples:
 - `14W` selects the nearest weekday to the 14th of the month
 - `*W` selects every weekday of the month (same as writing `Mon-Fri` in the *Day of Week* field)
 - `5-12W` selects the nearest weekdays to everyday from the 5th to the 12th of the month
 - `18/3W` selects the nearest weekdays to the 18th, 21st, 24th, 27th and 30th of the month

> **Note** If the given day is the start or end of the month, the nearest weekday will not be selected if it is in another month, instead the next nearest weekday in the same month will be selected.
>
> For example given the expression `* * 1W * *`, on a month starting on Saturday, the selected day would be the 3rd on the following Monday, not the Friday on the last day of the previous month:
> ```
> Wed Thu Fri | Sat Sun Mon
> 29  30  31  |  1   2   3
>          x     ^       ✓
> ```

Last day and nearest weekday can be combined, ie. `LW`, to select the last weekday of month.

### Nth of month (`#`)
The `#` symbol is only valid as a suffix for the *Day of Week* field expression, and must be followed by a number `1-5`

Examples:
 - `Tue#3` selects the 3rd Tuesday of the month
 - `*#2` selects the whole 2nd week of the month
 - `Thu-Mon/2#4` selects the 4th Thu, Sat and Mon of the month


## Timezone support
The timezone option supports either a string containing an [IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (eg. `'America/New_York'`), or a fixed offset from UTC as either a string in the format `(+|-)hh[:]mm`, or an integer number of minutes.

IANA timezone support is dependent on the `Intl.DateTimeFormat` api being supported by the browser/Node.js. The `Intl` api is supported by most [modern browsers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat#Browser_compatibility) and [versions of Node.js](http://kangax.github.io/compat-table/esintl/#test-DateTimeFormat).

If no timezone is specified the system's local  timezone is used.


## Daylight savings behaviour
If the configured timezone observes daylight savings how the missing hour when the daylight savings starts, and the repeated hour when it ends are handled can be specified by the `missingHour` and `skipRepeatedHour` options.

### `missingHour` option
The `missingHour` option allows three options: `'skip'`, `'offset'` and `'insert'`. (Defaults to `'insert'`)

For example in `'Europe/London'` timezone, with the cron expression `5/20 1 * * *` :

```
31st March 2019
GMT(+00:00) -> BST(+01:00)

UTC                 o x     x     x
  |-----------------|-----------------|-----------------|-----------------|
00:00             01:00             02:00             03:00             04:00

GMT(+00:00)           x     x     x
  |-----------------+.................
00:00            (01:00)

                  BST(+01:00)
                    |-----------------|-----------------|-----------------|
                  02:00             03:00             04:00             05:00

```
 - `'skip'` - all the marked times are skipped
 - `'offset'` - the the times that would have occurred in the missing 01:00:00 - 01:59:59 (local time) period are offset by an hour to the 02:00 hour, ie. the three times marked `x`
 - `'insert'` - if any times occur in the missing hour, a time is inserted at the instant where offset changes, ie. the time marked `o`

> **Note** The task is only run at most once per second, so if multiple times end up occurring at the same time the task is only run once

### `skipRepeatedHour` option
The `skipRepeatedHour` option is a boolean option, that specifies whether or not a task should be scheduled for a second time in a repeated hour. (Default to `true`)

For example in `'Europe/London'` timezone, with the cron expression `*/20 1 * * *` :

```
27th October 2019
BST(+01:00) -> GMT(+00:00)

UTC                 o     o     o     x     x     x
  |-----------------|-----------------|-----------------|-----------------|
23:00             00:00             01:00             02:00             03:00

BST(+01:00)         o     o     o
  |-----------------|-----------------+
00:00             01:00            (02:00)

                         GMT(+00:00)  x     x     x
                                      |-----------------|-----------------|
                                    01:00             02:00             03:00

```
If `skipRepeatedHour: true` only the times marked `o` are scheduled, otherwise all times marked `o` and `x` are scheduled.


## API
```js
import {
  scheduleTask, validate,
  CronosExpression, CronosTask,
  CronosTimezone 
} from 'cronosjs'
```

### scheduleTask
```function scheduleTask(cronString, task, options?)```

 - `cronString: string`  
  The cron expression defining the schedule on which to run the task. [Allowed syntax](#supported-expression-syntax)

 - `task: (timestamp: number) => void`  
  The function to run on each execution of the task. Is called with the timestamp of when the task was scheduled to run.

 - `options: { timezone?, skipRepeatedHour?, missingHour?, strict? }` (optional)
    - `timezone: CronosTimezone | string | number` (optional)  
    Timezone in which to schedule the tasks, can be either a `CronosTimezone` object, or any IANA timezone or offset accepted by the [`CronosTimezone` constructor](#cronostimezone)
    - `skipRepeatedHour: boolean` (optional)  
    Should tasks be scheduled in the repeated hour when DST ends. [Further details](#skiprepeatedhour-option)
    - `missingHour: 'insert' | 'offset' | 'skip'` (optional)  
    How tasks should be scheduled in the missing hour when DST starts. [Further details](#missinghour-option)
    - `strict: boolean | {<WarningType>: boolean, ...}` (optional)  
    Should an error be thrown if warnings occur during parsing. If `true`, will throw for all `WarningType`'s, alternatively an object can be provided with `WarningType`'s as the keys and boolean values to individually select which `WarningType`'s trigger an error to be thown. `WarningTypes`'s are listed in the [`CronosExpression.warnings`](#cronosexpression) documentation.

 - **Returns**  [`CronosTask`](#cronostask)


### validate
```function validate(cronString, options?)```

 - `cronString: string`  
  Cron string to validate
 - `options: { strict? }`  
  Same as `strict` option documented in [`scheduleTask`](#scheduletask)

 - **Returns** `boolean`  
  Is cron string syntax valid


### CronosExpression
```class CronosExpression```

#### Properties
 - `cronString: string` (readonly)  
  Original cron string passed to `CronosExpression.parse`
 - `warnings: Warning[]` (readonly)  
  A list of warnings that occurred during parsing the expression.
  ```typescript
  interface Warning {
    type: WarningType
    message: string
  }

  type WarningType = 'IncrementLargerThanRange'
  ```

#### Static Methods
 - `CronosExpression.parse(cronString, options)`  
  Parameters `cronString` and `options` same as for [`scheduleTask`](#scheduletask), returns `CronosExpression` instance

#### Methods
 - `nextDate(afterDate?)`  
   - `afterDate: Date` (optional)  
   The date after which to find the next date matching the cron expression, if not specified defaults to current date `new Date()`  
    - **Returns** `Date`  
    The next date matching the cron expression after the given date. May return null if no further matching dates exist (eg. if `year` field is specified in expression)

 - `nextNDates(afterDate?, n?)`
   - `afterDate: Date` (optional)  
   As above in `nextDate` method
   - `n: number` (optional)  
   Number of dates to generate, defaults to 5
   - **Returns** `[Date]`  
   An array of the next `n` dates after the given date. May return fewer dates than specified if no further dates exist


### CronosTask
```class CronosTask```

#### Constructor (3 overloads)
 - ```new CronosTask(sequence)```
    - `sequence: DateSequence`  
      Either an instance of [CronosExpression](#cronosexpression) or any other object that implements the `DateSequence` interface
      ```typescript
      interface DateSequence {
        nextDate: (afterDate: Date) => Date | null
      }
      ```
 - ```new CronosTask(date)```
    - `date: Date | string | number`  
      Either a `Date`, a timestamp, or a string repesenting a valid date, parsable by `new Date()`
 - ```new CronosTask(dates)```
    - `dates: (Date | string | number)[]`  
      An array of dates accepted valid in above constructor

#### Properties
 - `nextRun: Date | null` (readonly)  
  Date when task is next scheduled to run
 - `isRunning: boolean` (readonly)  
  Is the task scheduled to run

#### Methods
 - `start()`  
  Starts scheduling executions of the task as defined by the cron expression
 - `stop()`  
  Removes any scheduled executions and stops any further executions of the task
 - `on(event: string, listener: Function)`  
  Adds a listener for an event
 - `off(event: string, listener: Function)`  
  Removes a listener for an event

#### Events
 - `'started': () => void`  
  Listeners called when `start()` is called on task
 - `'stopped': () => void`  
  Listeners called when `stop()` is called on task
 - `'run': (timestamp: number) => void`  
  Listeners called on each date matching the cron expression. Listener is passed the timestamp when the execution was scheduled to start
 - `'ended': () => void`  
  Listeners called when there are no further matching dates


### CronosTimezone
```class CronosTimezone```

#### Constructor
```new CronosTimezone(IANANameOrOffset)```
 - `IANANameOrOffset: string | number`  
  IANA zone or fixed offset as detailed under [Timezone Support](#timezone-support)


## Predefined expressions

| Expression               | Description                                  | Equivalent to... |
| -------------------------| -------------------------------------------- | ---------------- |
| `@yearly` or `@annually` | Once a year at midnight on 1st January       | `0 0 1 1 *`      |
| `@monthly`               | Once a month at midnight on 1st of the month | `0 0 1 * *`      |
| `@weekly`                | Once a week at midnight on Sunday            | `0 0 * * 0`      |
| `@daily` or `@midnight`  | Once a day at midnight                       | `0 0 * * *`      |
| `@hourly`                | Once an hour at the beginning of each hour   | `0 * * * *`      |
