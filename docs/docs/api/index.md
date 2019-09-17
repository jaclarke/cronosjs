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

 - `options: { timezone?, skipRepeatedHour?, missingHour? }` (optional)
    - `timezone: CronosTimezone | string | number` (optional)  
    Timezone in which to schedule the tasks, can be either a `CronosTimezone` object, or any IANA timezone or offset accepted by the [`CronosTimezone` constructor](#cronostimezone)
    - `skipRepeatedHour: boolean` (optional)  
    Should tasks be scheduled in the repeated hour when DST ends. [Further details](#skiprepeatedhour-option)
    - `missingHour: 'insert' | 'offset' | 'skip'` (optional)  
    How tasks should be scheduled in the missing hour when DST starts. [Further details](#missinghour-option)

 - **Returns**  [`CronosTask`](#cronostask)


### validate
```function validate(cronString)```

 - `cronString: string`  
  Cron string to validate

 - **Returns** `boolean`  
  Is cron string syntax valid


### CronosExpression
```class CronosExpression```

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

#### Constructor
```new CronosTask(expression)```
 - `expression: CronosExpression`  
  An instance of [CronosExpression](#cronosexpression)

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
