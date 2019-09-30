<template>
<div style="position: relative" ref="select" tabIndex="0" @keypress.enter.self="openDropdown()">
  <div class="select-input" @click="openDropdown">
    <template v-if="model">{{ model }}</template>
    <template v-else>
      <span class="system-zone-label">System Zone</span> {{ defaultZone }}
    </template>
  </div>
  <transition
    name="dropdown-transition"
    @enter="transitionEnter"
  >
  <div v-if="open" class="dropdown" tabIndex="0" ref="dropdown"
    :style="{
      top: -dropdownOffsets.top+'px',
      left: -dropdownOffsets.left+'px',
      '--clip-path': `inset(${dropdownOffsets.top}px ${dropdownOffsets.right}px ${dropdownOffsets.bottom}px ${dropdownOffsets.left}px round 5px)`
    }"
    @keydown.up.down.prevent="arrowKeyPress" @keypress.enter="selectZone()"
    @keydown.escape="closeDropdown">
    <div class="zone default-zone" :class="{
      'zone-selected': selectedIndex === 0,
      'zone-highlighted': highlightedIndex === 0
    }" @mouseenter="highlightedIndex = 0" @click="selectZone(0)">
      <span class="system-zone-label">System Zone</span> {{ defaultZone }}
    </div>
    <div class="search">
      <input v-model="searchValue" ref="search" length="32" placeholder="Search zone name or country code" />
    </div>
    <div class="zones-list" :class="{
      'zones-filtered': zonesFiltered,
    }" ref="zonesList" @mousemove="preventMouseHighlight = false">
      <template v-for="region in zones">
        <div class="region">
          <div class="region-header">{{ region.region }}</div>
          <div v-for="zone in region.zones" class="zone" ref="zone" :class="{
            'zone-alias': zone.alias,
            'zone-selected': selectedIndex === zone.index,
            'zone-highlighted': highlightedIndex === zone.index
          }" @mouseenter="highlightZone(zone.index)" @click="selectZone(zone.index)">
            <span class="zone-flag">{{zone.flag}}</span>
            <template v-if="!zonesFiltered">
              <span v-if="zone.region" :class="{'zone-region': !zone.alias || zone.region === region.region}">{{zone.region}}/</span>
              {{zone.zoneName}}
            </template>
            <template v-else>
              <span v-html="zone.nameMarked" />
              <span v-if="zone.countryCode" class="zone-cc" v-html="zone.countryCodeMarked" />
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
  </transition>
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

let zoneIndex = 1
const zonesData = Object.freeze(zones.map(region => ({
  ...region,
  zones: region.zones.reduce((zones, zone) => {
    zones.push(...[zone, ...(zone.aliases||[])].map((zone, i) => {
      const sepIndex = zone.name.indexOf('/')
      return {
        ...zone,
        index: zoneIndex++,
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

const zonesList = Object.freeze(zonesData.reduce((allZones, region) => {
  allZones.push(...region.zones)
  return allZones
}, []))

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
  data() {
    return {
      open: false,
      highlightedIndex: 0,
      searchValue: '',
      preventMouseHighlight: false,
      dropdownOffsets: {},
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
        region: 'Search results',
        zones: Object.freeze(
          fuse.search(this.searchValue).map((result, i) => {
            const zone = {
              ...result.item,
              index: i+1,
              nameMarked: result.item.name,
              countryCodeMarked: result.item.countryCode
            }
            result.matches.forEach(match => {
              zone[match.key+'Marked'] = markString(match.value, match.indices)
            })
            return zone
          })
        )
      }]
    },
    zonesList() {
      return this.zonesFiltered ? this.zones[0].zones : zonesList
    },
    selectedIndex() {
      if (!this.model) return 0
      const index = this.zonesList.findIndex(zone => zone.name === this.model)
      return index === -1 ? -1 : index+1
    },
  },
  methods: {
    transitionEnter: function (el) {
      const dropdown = el,
            select = this.$refs.select

      const dropdownRect = dropdown.getBoundingClientRect(),
            selectRect = select.getBoundingClientRect(),
            viewWidth = window.innerWidth || document.documentElement.clientWidth,
            viewHeight = window.innerHeight || document.documentElement.clientHeight

      let leftOffset = (selectRect.width - dropdownRect.width) / 2,
          topOffset = (selectRect.height - dropdownRect.height) / 2

      if (dropdownRect.bottom + topOffset > viewHeight - 24) {
        topOffset -= (dropdownRect.bottom + topOffset) - (viewHeight - 24)
      }
      if (dropdownRect.top + topOffset < 24) {
        topOffset += 24 - (dropdownRect.top + topOffset)
      }
      if (dropdownRect.right + leftOffset > viewWidth - 24) {
        leftOffset -= (dropdownRect.right + leftOffset) - (viewWidth - 24)
      }
      if (dropdownRect.left + leftOffset < 24) {
        leftOffset += 24 - (dropdownRect.left + leftOffset)
      }

      this.dropdownOffsets = {
        left: -leftOffset,
        top: -topOffset,
        right: dropdownRect.width + leftOffset - selectRect.width,
        bottom: dropdownRect.height + topOffset - selectRect.height,
      }
    },
    _closeListener(e) {
      if (!this.$refs.select.contains(e.target)) {
        this.closeDropdown()
      }
    },
    async openDropdown() {
      if (this.open) return;
      this.open = true
      document.addEventListener('click', this._closeListener, {capture: true})
      document.addEventListener('scroll', this._closeListener)

      await this.$nextTick()

      this.$refs.search.focus()

      this.highlightedIndex = this.selectedIndex
      this.scrollHighlightedIntoView(true)
    },
    closeDropdown(e) {
      document.removeEventListener('click', this._closeListener, {capture: true})
      document.removeEventListener('scroll', this._closeListener)
      this.open = false
      this.dropdownOffsets = {}
      this.searchValue = ''
      this.$refs.select.focus()
    },
    arrowKeyPress(e) {
      let index = this.highlightedIndex
      if (e.key === 'ArrowUp') index -= 1
      else if (e.key === 'ArrowDown') index += 1
      if (index < 0) index = this.zonesList.length
      else if (index > this.zonesList.length) index = 0
      this.highlightedIndex = index
      this.scrollHighlightedIntoView()
    },
    selectZone(index = this.highlightedIndex) {
      this.model = index ? this.zonesList[index-1].name : ''
      this.closeDropdown()
    },
    highlightZone(index) {
      if (!this.preventMouseHighlight) this.highlightedIndex = index
    },
    scrollHighlightedIntoView(center) {
      if (this.highlightedIndex < 1) return
      const zoneEl = this.$refs.zone[this.highlightedIndex-1],
            listEl = this.$refs.zonesList,
            listOffset = listEl.offsetTop,
            listHeight = listEl.offsetHeight,
            listScroll = listEl.scrollTop,
            zoneTopMargin = this.zonesFiltered ? 5 : 40,
            zoneTop = zoneEl.offsetTop - listOffset - zoneTopMargin,
            zoneBottom = zoneTop + zoneEl.offsetHeight + zoneTopMargin + 10

      this.preventMouseHighlight = true
      if (center) {
        listEl.scrollTop = zoneBottom - (listHeight/2)
      }
      else if (zoneTop < listScroll) {
        listEl.scrollTop = zoneTop
      }
      else if (zoneBottom > listScroll + listHeight) {
        listEl.scrollTop = zoneBottom - listHeight
      }
    },
  },
  watch: {
    async zones() {
      if (!this.open) return;
      if (this.zonesFiltered) {
        this.highlightedIndex = 1
        this.$refs.zonesList.scrollTop = 0
      }
      else {
        this.highlightedIndex = this.selectedIndex
        await this.$nextTick()
        this.scrollHighlightedIntoView(true)
      }
    },
  },
}
</script>

<style lang="stylus" scoped>
.select-input
  border: 2px solid rgba(255,255,255,0.7)
  padding: 0.5em 1em
  padding-right: 2.5em
  border-radius: 5px
  color: #fff
  cursor: pointer
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.9)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' %3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")
  background-repeat: no-repeat
  background-position: center right 0.5em
  background-size: 1.2em  

.dropdown
  position: absolute
  top: 0
  left: 0
  background: #fff
  border-radius: 5px
  max-height: calc(100vh - 3rem)
  overflow: hidden
  display: flex
  flex-direction: column
  width: 24em
  box-shadow: 0px 3px 10px rgba(0, 0, 0, 0.2)

.dropdown-transition
  &-enter-active
    transition: opacity 0.15s, clip-path 0.2s

    & > *
      transition: opacity 0.2s 0.15s
  
  &-leave-active
    transition: opacity 0.15s 0.05s, clip-path 0.2s

  &-enter, &-leave-to
    opacity: 0
    clip-path: var(--clip-path)

    & > *
      opacity: 0

  &-enter-to, &-leave
    opacity: 1
    clip-path: inset(0px round 5px)

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
    padding: 0.7em 0 0.8em 0.3em
    background: linear-gradient(0deg, transparent 0px, #fff 0.8em, #fff 100%)
    margin-bottom: -0.3em
    z-index: 1

.zone
  position: relative
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

  &-highlighted
    background: rgba(124, 138, 193, 0.3)

  &-selected:after
    content: ''
    position: absolute
    top: 0
    right: 0
    left: 0
    bottom: 0
    border: 2px solid rgb(124, 138, 193)
    border-radius: 4px

  &-cc
    margin-left: 0.7em
    font-size: 0.9em

.default-zone
  margin: 0.7em
  margin-bottom: 0
  padding-top: 0.4em
  padding-bottom: 0.4em

.system-zone-label
  margin-right: 0.5em
  font-weight: 600

.zones-filtered
  .region-header
    display: none

  .zone-alias
    margin-left: inherit

  >>> mark
    background: rgba(124, 138, 193, 0.5)
    border-radius: 3px
</style>
