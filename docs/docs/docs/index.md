---
sidebar: auto
---

# Docs

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
validate('* * 5 smarch *') // === false

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
```


## Supported expression syntax

```
*  *  *  *  *  *  *    Field              Allowed values    Special symbols
|  |  |  |  |  |  |    -----------------  ---------------   ---------------
`--|--|--|--|--|--|->  Second (optional)  0-59              * / , -
   `--|--|--|--|--|->  Minute             0-59              * / , -
      `--|--|--|--|->  Hour               0-23              * / , -
         `--|--|--|->  Day of Month       1-31              * / , - L W
            `--|--|->  Month              1-12 or JAN-DEC   * / , -
               `--|->  Day of Week        0-7 or SUN-SAT    * / , - L #
                  `->  Year (optional)    1970-2099         * / , -
```

A cron expression is defined by between 5 and 7 fields separated by whitespace, as detailed above. Each field can contain an integer value in the allowed values range for that field, a three letter abbreviation (case insensitive) for the *Day of Week* and *Month* fields, or an expression containing a symbol.

A [predefined expression](#predefined-expressions) can also be given.

For the *Day of Week* field, `0` and `7` are equivalent to `Sun` , `1 = Mon` , ... , `5 = Fri` , `6 = Sat`.

> **Note** If only 5 fields are given, both the optional *second* and *year* fields will be given their default values of `0` and `*` respectively.  
> If 6 fields are given, the first field is assumed to be the *second* field, and the *year* field given its default value.

---

The following symbols are valid for any field:

### All values (`*`)
Selects all allowed values in the *second*, *minute*, *hour*, *month* and *year* fields.

In the *Day of Month* and *Day of Week* fields, if both fields have an `*` all days will be selected, otherwise if only one field has an `*` it will not select anything for that field, effectively acting as an empty placeholder.

### List (`,`)
Separates a list of expressions for a field.

The separated expressions can contain any of the allowed values and symbols for that field; however while valid, some lists may not make sense, eg. in `6-14,*`, the `6-14` part is made redundant by the `*` part.

### Range (`-`)
Defines a range of values, inclusive. eg. `16-39` in the seconds field means the 16th second and every second after up to and including the 39th second.

The second value is required to be greater than the first value to be a valid range.

### Increments (`/`)
Defines increments of a range. Can be used in three ways:
 - The full range can be given, eg. `4-38/3` in the minutes field means the 4th minute and every 3rd minute after upto the 38th minute, ie. [4, 7, 10, ..., 31, 34, 37]
 - The start of the range can be given, eg. `4/3`, in which case the end of the range will be the maximum allowed value for that field
 - Or can be used with the `*` symbol, eg. `*/3`, which will use the full range allowed for that field, ie. equivalent to `0-59/3` for the minutes field

---

The following symbols are valid only for the *Day of Month* and/or *Day of Week* fields:

### Last day (`L`)
When used in the *Day of Month* field, means the last day of that month.

When used in the *Day of Week* field, means the last specified day of week of that month, eg. `WedL` selects the last Wednesday of the month.

### Nearest weekday (`W`)
The `W` symbol is only valid for the *Day of Month* field, and will select the nearest weekday (Mon-Fri) to the given day. 

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
The `#` symbol is only valid for the *Day of Week* field, and must be followed by a number `1-5`, eg. `Tue#3` meaning the 3rd Tuesday of the month.


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

## Predefined expressions

| Expression               | Description                                  | Equivalent to... |
| -------------------------| -------------------------------------------- | ---------------- |
| `@yearly` or `@annually` | Once a year at midnight on 1st January       | `0 0 1 1 *`      |
| `@monthly`               | Once a month at midnight on 1st of the month | `0 0 1 * *`      |
| `@weekly`                | Once a week at midnight on Sunday            | `0 0 * * 0`      |
| `@daily` or `@midnight`  | Once a day at midnight                       | `0 0 * * *`      |
| `@hourly`                | Once an hour at the beginning of each hour   | `0 * * * *`      |
