<template>
  <div class="dropdown">
    <div class="search">
      <input v-model="searchVal" length="32" placeholder="Search zone name or country code" />
    </div>
    <div class="zones-list" :class="{'zones-filtered': zonesFiltered}">
      <template v-for="region in zones">
        <div class="region">
          <div class="region-header">{{ region.region }}</div>
          <div v-for="zone in region.zones" class="zone" :class="{'zone-alias': zone.alias}">
            <span class="zone-flag">{{zone.flag}}</span>
            <template v-if="!zonesFiltered">
              <span v-if="zone.region" :class="{'zone-region': !zone.alias || zone.region === region.region}">{{zone.region}}/</span>
              {{zone.zoneName}}
            </template>
            <template v-else>
              <span v-html="zone.name" />
              <span v-if="zone.countryCode" class="zone-cc" v-html="zone.countryCode" />
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import Fuse from 'fuse.js'
import zones from '../zones.json'

function toFlagUnicode(countryCode) {
  return (countryCode && String.fromCodePoint(
    ...countryCode.split('').map(c => c.charCodeAt(0)+127397)
  )) || ''
}

const zonesData = Object.freeze(zones.map(region => ({
  ...region,
  zones: region.zones.reduce((zones, zone) => {
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
})))

const zonesList = zonesData.reduce((allZones, region) => {
  allZones.push(...region.zones)
  return allZones
}, [])

const fuse = new Fuse(zonesList, {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
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
  data() {
    return {
      searchVal: '',
    }
  },
  computed: {
    zonesFiltered() {
      return this.searchVal
    },
    zones() {
      if (!this.zonesFiltered) return zonesData
      return [{
        region: 'Search results',
        zones: Object.freeze(
          fuse.search(this.searchVal).map(result => {
            const zone = {...result.item}
            result.matches.forEach(match => {
              zone[match.key] = markString(match.value, match.indices)
            })
            return zone
          })
        )
      }]
    }
  },
  methods: {
    
  },
}
</script>

<style lang="stylus" scoped>
.dropdown
  background: #fff
  border-radius: 5px
  max-height: calc(100vh - 5rem)
  overflow: hidden
  display: flex
  flex-direction: column
  width: 24em

.search
  flex-shrink: 0
  padding: 0.6em 0.8em
  display: flex

  input
    background-color: #eee
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-search'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E")
    background-repeat: no-repeat
    background-position: 0.5em center
    background-size: 1.1em
    border-radius: 5px
    border: none
    width: 100%
    font-family: inherit
    padding: 0.4em 0.8em 0.4em 2em
    font-size: 1rem

.zones-list
  overflow: hidden scroll

.region
  padding: 0 1em

  &:last-child
    margin-bottom: 1em

  &-header
    font-weight: 600
    position: sticky
    top: 0
    padding: 0.5em 0 1em 0
    background: linear-gradient(0deg, transparent 0px, #fff 1em, #fff 100%)
    margin-bottom: -0.8em
    z-index: 1

.zone
  margin: 0.1em 0 0.1em 0em
  display: flex
  align-items: center
  border-radius: 4px
  padding: 0.3em 0.6em
  cursor: pointer

  &-flag
    width: 1.5em
    font-size: 1.15em
    font-family: "twemoji mozilla"

  &-region
    opacity: 0.5
  
  &-alias
    margin-left: 1.5em
    color: #6b7886

  &:hover
    background: #eee

  &-highlighted
    background: rgba(124, 138, 193, 0.2)

  &-cc
    margin-left: 0.7em
    font-size: 0.9em

.zones-filtered
  .region-header
    display: none

  .zone-alias
    margin-left: inherit

  mark
    background: rgba(124, 138, 193, 0.5)
    border-radius: 3px
</style>
