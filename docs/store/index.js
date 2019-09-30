import Vuex from 'vuex'
import { sync } from 'vuex-router-sync'

import {
  SecondsOrMinutesField,
  HoursField,
  DaysField,
  MonthsField,
  YearsField,
} from '../../pkg/dist-src/parser'

const urlCharMapping = {
  ' ': '_',
  '/': '!',
  '#': '~',
  '@': '\''
}
Object.keys(urlCharMapping).forEach(
  key => urlCharMapping[urlCharMapping[key]] = key
)

const fieldNames = ['seconds', 'minutes', 'hours', 'days', 'months', 'weeks', 'years', 'daysAndWeeks']

const mapToObj = (array, iter) => array.reduce(
  (obj, key, i) => {
    obj[key] = iter(key, i)
    return obj
  }, {}
)

const parsers = [
  ({secondsField}) => new SecondsOrMinutesField(secondsField || '0'),
  ({minutesField}) => new SecondsOrMinutesField(minutesField),
  ({hoursField}) => new HoursField(hoursField),
  ({daysField}) => new DaysField(daysField, '*'),
  ({monthsField}) => new MonthsField(monthsField),
  ({weeksField}) => new DaysField('*', weeksField),
  ({yearsField}) => new YearsField(yearsField || '*'),
  ({daysField, weeksField}) => new DaysField(daysField, weeksField),
]

export function createStore(router) {
  const store = new Vuex.Store({
    state: {
      cursorIndex: null
    },
    getters: {
      cronString(state) {
        return (state.route.query.cron || '').replace(/_|!|~|'/g, char => urlCharMapping[char])
      },
      timezone(state) {
        return state.route.query.timezone
      },
      fieldIndexes(state, {cronString}) {
        const regex = /\S+/g,
              indexes = []
        let result
        while ((result = regex.exec(cronString)) !== null && indexes.length < 7) {
          indexes.push([result.index, regex.lastIndex])
        }
        if (indexes.length < 7 && (!cronString || /\s$/.test(cronString))) {
          indexes.push([cronString.length, cronString.length])
        }
        if (indexes.length <= 5) {
          indexes.unshift([-1, -1])
        }
        return indexes
      },
      ...mapToObj(fieldNames.map(name => name+'Field'),
        (key, i) => (_, { cronString, fieldIndexes }) => {
          const fieldIndex = fieldIndexes[i]
          return fieldIndex ? cronString.slice(fieldIndex[0], fieldIndex[1]).toLowerCase() : ''
        }
      ),
      ...mapToObj(fieldNames.map(name => name+'Parsed'),
        (key, i) => (_, getters) => {
          try {
            return parsers[i](getters)
          } catch {
            return false
          }
        }
      ),
      ...mapToObj(fieldNames.map(name => name+'Values'),
        (key, i) => {
          const parsed = fieldNames[i]+'Parsed'
          return (_, getters) => {
            try {
              return getters[parsed] && getters[parsed].values
            } catch {
              return false
            }
          }
        }
      ),
      ...mapToObj(fieldNames.map(name => name+'Valid'),
        (key, i) => {
          const values = fieldNames[i]+'Values'
          return (_, getters) => !!getters[values]
        }
      ),
      allFieldsValid(_, getters) {
        const fieldsCount = getters.cronString.trim().split(/\s+/g).length
        if (fieldsCount < 5 || fieldsCount > 7) return false

        return fieldNames.every(key => getters[key+'Valid'])
      },
      highlightedField({cursorIndex}, {fieldIndexes}) {
        if (cursorIndex === null) return null
        for (let field of fieldIndexes) {
          if (cursorIndex >= field[0] && cursorIndex <= field[1]) return field
        }
        return null
      },
      highlightedFieldIndex(_, {fieldIndexes, highlightedField}) {
        return fieldIndexes.indexOf(highlightedField)
      },
    },
    actions: {
      updateCronString({state}, val) {
        router.replace({query: {
          ...state.route.query,
          cron: val.replace(/\s|\/|#|@/g, char => urlCharMapping[char])
        }})
      },
      updateTimezone({state}, val) {
        router.replace({query: {
          ...state.route.query,
          timezone: val || undefined
        }})
      },
    },
    mutations: {
      updateCursorIndex(state, index) {
        state.cursorIndex = index
      }
    },
  })
  sync(store, router)

  return store
}
