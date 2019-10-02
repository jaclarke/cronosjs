<template>
  <div style="position: relative" ref="select" tabIndex="0" @keypress.enter.self="openDropdown()">
    <div class="select-input" @click="openDropdown">
      <slot name="selected">
        <span class="capitalize">{{ model }}</span>
      </slot>
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
        @keydown.up.down.prevent="arrowKeyPress" @keypress.enter="selectItem()"
        @keydown.escape="closeDropdown"
      >
        <slot name="extra" v-bind="{selectedIndex, highlightedIndex}" />
        <div class="items-list" ref="itemsList" @mousemove="preventMouseHighlight = false">
          <template v-for="group in itemGroups">
            <div class="group">
              <div class="group-header" v-if="group.name">{{ group.name }}</div>
              <div v-for="item in group.items" class="item" ref="item" :class="{
                'item-selected': selectedIndex === item.index,
                'item-highlighted': highlightedIndex === item.index,
                ...itemClass(item, group)
              }" @mouseenter="highlightItem(item.index)" @click="selectItem(item.index)">
                <slot name="item" v-bind="{item, group}">
                  <span class="capitalize">{{ item.name }}</span>
                </slot>
              </div>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
const itemsCache = new WeakMap()

export default {
  data() {
    return {
      open: false,
      highlightedIndex: 0,
      preventMouseHighlight: false,
      dropdownOffsets: {},
    }
  },
  props: {
    value: String,
    items: {
      type: Array,
      default: () => ([])
    },
    itemClass: {
      type: Function,
      default: () => () => ({})
    },
    zeroItem: Boolean,
  },
  computed: {
    model: {
      get() {
        return this.value || ''
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    itemGroups() {
      if (itemsCache.has(this.items)) return itemsCache.get(this.items)

      let items = (this.items[0] && this.items[0].items) ? this.items : [{
        name: '',
        items: Array.isArray(this.items) ? this.items.map(name => ({name})) : this.items
      }],
          i = 1
      const itemGroups = Object.freeze(items.map(group => ({
        ...group,
        items: group.items.map(item => ({
          ...item,
          index: i++
        }))
      })))
      itemsCache.set(this.items, itemGroups)
      return itemGroups
    },
    itemsList() {
      if (itemsCache.has(this.itemGroups)) return itemsCache.get(this.itemGroups)

      const itemsList = Object.freeze(this.itemGroups.reduce((allItems, group) => {
        allItems.push(...group.items)
        return allItems
      }, []))
      itemsCache.set(this.itemGroups, itemsList)
      return itemsList
    },
    selectedIndex() {
      if (!this.model) return 0
      const index = this.itemsList.findIndex(item => item.name === this.model)
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

      this.$refs.dropdown.focus()
      this.highlightedIndex = this.selectedIndex
      this.scrollHighlightedIntoView(true)

      this.$emit('opened')
    },
    closeDropdown(e) {
      document.removeEventListener('click', this._closeListener, {capture: true})
      document.removeEventListener('scroll', this._closeListener)
      this.open = false
      this.dropdownOffsets = {}
      this.$refs.select.focus()

      this.$emit('closed')
    },
    arrowKeyPress(e) {
      let index = this.highlightedIndex
      if (e.key === 'ArrowUp') index -= 1
      else if (e.key === 'ArrowDown') index += 1
      if (index < (this.zeroItem?0:1)) index = this.itemsList.length
      else if (index > this.itemsList.length) index = this.zeroItem?0:1
      this.highlightedIndex = index
      this.scrollHighlightedIntoView()
    },
    selectItem(index = this.highlightedIndex) {
      this.model = index ? this.itemsList[index-1].name : ''
      this.closeDropdown()
    },
    highlightItem(index) {
      if (!this.preventMouseHighlight) this.highlightedIndex = index
    },
    scrollHighlightedIntoView(center) {
      if (this.highlightedIndex < 1) return
      const itemEl = this.$refs.item[this.highlightedIndex-1],
            listEl = this.$refs.itemsList,
            listOffset = listEl.offsetTop,
            listHeight = listEl.offsetHeight,
            listScroll = listEl.scrollTop,
            itemTopMargin = !this.itemGroups[0].name ? 5 : 40,
            itemTop = itemEl.offsetTop - listOffset - itemTopMargin,
            itemBottom = itemTop + itemEl.offsetHeight + itemTopMargin + 10

      this.preventMouseHighlight = true
      if (center) {
        listEl.scrollTop = itemBottom - (listHeight/2)
      }
      else if (itemTop < listScroll) {
        listEl.scrollTop = itemTop
      }
      else if (itemBottom > listScroll + listHeight) {
        listEl.scrollTop = itemBottom - listHeight
      }
    },
  },
  watch: {
    async items() {
      if (!this.open) return;
      if (this.selectedIndex > 0) {
        this.highlightedIndex = this.selectedIndex
        await this.$nextTick()
        this.scrollHighlightedIntoView(true)
      } else {
        this.highlightedIndex = 1
        this.$refs.itemsList.scrollTop = 0
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
  min-width: 100%
  box-shadow: 0px 3px 10px rgba(0, 0, 0, 0.2)
  z-index: 1

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

.items-list
  overflow: hidden auto
  padding-top: 0.5em

.group
  padding: 0 0.5em

  &:last-child
    margin-bottom: 0.5em

  &-header
    font-weight: 600
    position: sticky
    top: 0
    padding: 0.7em 0 0.8em 0.3em
    background: linear-gradient(0deg, transparent 0px, #fff 0.8em, #fff 100%)
    margin-bottom: -0.3em
    z-index: 1

.dropdown >>> .item
  position: relative
  margin: 0.1em 0 0.1em 0em
  display: flex
  align-items: center
  border-radius: 4px
  padding: 0.3em 0.6em
  cursor: pointer

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

.capitalize
  text-transform: capitalize
</style>
