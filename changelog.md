# Changelog

## [1.7.1] - 01 Apr 2021
### Fixed
 - Fix bug where `.nextDate` was returning incorrect dates, causing tasks to run continuously without delays, when running on Node.js v14.0.0 or greater. Bug was caused by the `Intl.DateTimeFormat` API returning '24:00:00' instead of '00:00:00' on Node.js > v14.0.0.

## [1.7.0] - 02 Aug 2020
### Added
 - Added `refreshSchedulerTimer()` function, to update the next execution time of all tasks and refresh the scheduler timer. Should be called when the system time is changed to ensure tasks are run at the correct times

## [1.6.1] - 04 Jul 2020
### Fixed
 - Fix bug when `task.start()` is called on a running task

## [1.6.0] - 17 Apr 2020
### Added
 - `CronosExpression` now has `warnings` property that lists possible errors in the expression. Currently supports detecting cases where increment value is larger than the valid (or supplied) range for a field
 - `scheduleTask`, `CronosExpression.parse()` and `validate` now support strict option, which when enabled will throw an error if warnings were generated during parsing

## [1.5.0] - 01 Nov 2019
### Added
 - Support for the `?` symbol as a alias to `*` in the *Day of Month* and *Day of Week* fields
### Changed
 - Larger year range (now 0-275759, previously 1970-2099) allowed in year field
 - Improved documentation on cron expression syntax

## [1.4.0] - 07 Aug 2019
### Added
 - Support for providing a date, array of dates, or a custom date sequence to `new CronosTask()` instead of a `CronosExpression` object

## [1.3.0] - 30 Jul 2019
### Added
 - Support wrap-around ranges for cyclic type fields (ie. *Second*, *Minute*, *Hour*, *Month* and *Day of Week*)
### Fixed
 - Fix bug causing task to continue to run if `task.stop()` is called in the `run` callback 

## [1.2.1] - 22 Jul 2019
### Fixed
 - Fix bug where when multiple tasks are scheduled, they are inserted into the task queue in the wrong order, causing the jobs to not fire at the correct times

## [1.2.0] - 22 Jul 2019
### Added
 - Original cron string passed to `CronosExpression.parse()` accessable on `CronosExpression.cronString` property
 - `.toString()` returns more useful information on `CronosExpression` and `CronosTimezone`
### Fixed
 - Added workaround for bug when `Array.prototype.find` is incorrectly polyfilled
 - Added check to ensure tasks only run at most once a second

## [1.1.0] - 23 Jun 2019
### Changed
 - Switched to [@pika/pack](https://github.com/pikapkg/pack) for building, adding builds optimised for node, browsers and modern ES module support (eg. Webpack, modern browsers)
 - Improved test coverage

## [1.0.0] - 8 May 2019
First release of CronosJS, featuring:
 - Extended cron syntax support, including last day (`L`), nearest weekday (`W`), nth of month (`#`), optional second and year fields, and predefined expressions
 - Fixed offset and IANA timezone support, via `Intl` api
 - Configurable daylight saving handling
 - Zero dependencies
