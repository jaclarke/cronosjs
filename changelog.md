# Changelog

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
