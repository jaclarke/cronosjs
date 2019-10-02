<template>
  <dropdown-select ref="select" zeroItem
    :items="zones" v-model="model"
    class="timezone-input"
    @opened="onOpened" @closed="onClosed"
    :itemClass="(zone) => ({'zone-alias': zone.alias})"
    :class="{'zones-filtered': zonesFiltered}"
  >

    <template #selected>
      <template v-if="model">{{ model }}</template>
      <template v-else>
        <span class="system-zone-label">System Zone</span> {{ defaultZone }}
      </template>
    </template>

    <template #extra="{selectedIndex, highlightedIndex}">
      <div class="item default-zone" :class="{
        'item-selected': selectedIndex === 0,
        'item-highlighted': highlightedIndex === 0
      }" @mouseenter="$refs.select.highlightItem(0)" @click="$refs.select.selectItem(0)">
        <span class="system-zone-label">System Zone</span> {{ defaultZone }}
      </div>
      <div class="search">
        <input v-model="searchValue" ref="search" length="32" placeholder="Search zone name or country code" />
      </div>
    </template>

    <template #item="{item: zone, group: region}">
      <span class="zone-flag">{{zone.flag}}</span>
      <template v-if="!zonesFiltered">
        <span v-if="zone.region" :class="{'zone-region': !zone.alias || zone.region === region.name}">{{zone.region}}/</span>
        {{zone.zoneName}}
      </template>
      <template v-else>
        <span v-html="zone.nameMarked" />
        <span v-if="zone.countryCode" class="zone-cc" v-html="zone.countryCodeMarked" />
      </template>
    </template>

  </dropdown-select>
</template>

<script>
import dropdownSelect from './dropdownSelect'
import Fuse from 'fuse.js'
import zones from '../zones.json'

function toFlagUnicode(countryCode) {
  return (countryCode && String.fromCodePoint(
    ...countryCode.split('').map(c => c.charCodeAt(0)+127397)
  )) || ''
}

const zonesData = zones.map(region => ({
  name: region.region,
  items: region.zones.reduce((zones, zone) => {
    zones.push(...[zone, ...(zone.aliases||[])].map((zone, i) => {
      const sepIndex = zone.name.indexOf('/')
      return {
        ...zone,
        alias: !!i,
        aliases: undefined,
        region: sepIndex !== -1 ? zone.name.slice(0, sepIndex) : '',
        zoneName: sepIndex !== -1 ? zone.name.slice(sepIndex+1) : zone.name,
        flag: toFlagUnicode(zone.countryCode)
      }
    }))
    return zones
  }, [])
}))

const zonesList = zonesData.reduce((allZones, region) => {
  allZones.push(...region.items)
  return allZones
}, [])

const fuse = new Fuse(zonesList, {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 2,
  keys: [
    "name",
    "countryCode"
  ]
})

function markString(str, indices) {
  let i = 0, markedStr = ''
  for (let indice of indices) {
    markedStr += `${str.slice(i, indice[0])}<mark>${str.slice(indice[0], indice[1]+1)}</mark>`
    i = indice[1]+1
  }
  markedStr += str.slice(i)
  return markedStr
}

export default {
  components: { dropdownSelect },
  data() {
    return {
      searchValue: '',
    }
  },
  computed: {
    model: {
      get() {
        return this.$store.getters.timezone || ''
      },
      set(val) {
        return this.$store.dispatch('updateTimezone', val)
      },
    },
    defaultZone() {
      return (Intl && Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || false
    },
    zonesFiltered() {
      return this.searchValue
    },
    zones() {
      if (!this.zonesFiltered) return zonesData
      return [{
        name: '',
        items: fuse.search(this.searchValue).map(result => {
          const zone = {
            ...result.item,
            nameMarked: result.item.name,
            countryCodeMarked: result.item.countryCode
          }
          result.matches.forEach(match => {
            zone[match.key+'Marked'] = markString(match.value, match.indices)
          })
          return zone
        })
      }]
    },
  },
  methods: {
    onOpened() {
      this.$refs.search.focus()
    },
    onClosed() {
      this.searchValue = ''
    },
  },
}
</script>

<style lang="stylus" scoped>
.search
  flex-shrink: 0
  padding: 0.7em
  display: flex

  input
    background-color: #eee
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' %3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E")
    background-repeat: no-repeat
    background-position: 0.5em center
    background-size: 1.1em
    border-radius: 5px
    border: none
    width: 100%
    font-family: inherit
    padding: 0.4em 0.8em 0.4em 2em
    font-size: 1rem

.zone
  &-flag
    width: 1.5em
    font-size: 1.15em
    font-family: "twemoji mozilla"

  &-region
    opacity: 0.5

  &-cc
    margin-left: 0.7em
    font-size: 0.9em

.timezone-input
  >>> .dropdown
    width: 24em

  >>> .zone-alias
    margin-left: 1.5em
    color: #6b7886

  .default-zone
    margin: 0.7em
    margin-bottom: 0
    padding-top: 0.4em
    padding-bottom: 0.4em

  >>> .items-list
    padding-top: 0

  >>> .group
    padding: 0 1em

    &:last-child
      margin-bottom: 1em

  >>> mark
    background: rgba(124, 138, 193, 0.5)
    border-radius: 3px

.system-zone-label
  margin-right: 0.5em
  font-weight: 600

.zones-filtered
  >>> .zone-alias
    margin-left: inherit
</style>
