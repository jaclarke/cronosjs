<template>
  <div class="input" :style="{
      fontSize: fontSize+'px',
    }">
    <div class="fields">
      <div v-for="field in fields" v-if="field.show"
        :style="{
          left: field.left + 'ch',
          width: field.width + 'ch',
        }"
      >
        <span :class="{highlighted: field.isHighlighted, invalid: !field.isValid}"
          >{{ field.name }}</span>
      </div>
    </div>
    <div class="input-container">
      <div class="input-highlight static invalid" v-for="field in fields" v-if="!field.isValid"
        :style="{
          left: field.left + 'ch',
          width: field.width + 'ch'
        }"
      ></div>
      <div class="input-highlight static invalid"
        v-if="model.length > lastFieldIndex + 1"
        :style="{
          left: lastFieldIndex + 1 + 'ch',
          width: model.length - lastFieldIndex + 'ch'
        }"
      ></div>
      <div class="input-highlight" v-if="highlightedField"
        :class="{invalid: !fields[highlightedFieldIndex].isValid}"
        :style="{
          left: highlightedField[0] + 'ch',
          width: highlightedField[1] - highlightedField[0] + 'ch',
        }"
      ></div>
      <input v-model="model" :style="{
          width: Math.max(model.length, 10)+'ch',
        }"
        @focus="updateCursorIndex"
        @keyup="updateCursorIndex"
        @mousedown="updateCursorIndex"
        @mouseup="updateCursorIndex"
        @touchstart="updateCursorIndex"
        @touchend="updateCursorIndex"
        @blur="updateCursorIndex()"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

const fieldNames = [
  { field: 'seconds',  short: 'sec', full: 'second' },
  { field: 'minutes', short: 'min', full: 'minute' },
  { field: 'hours',   short: 'hr',  full: 'hour' },
  { field: 'days',    short: 'day', full: 'day of month' },
  { field: 'months',  short: 'mo',  full: 'month' },
  { field: 'weeks',   short: 'wk',  full: 'day of week' },
  { field: 'years',   short: 'yr',  full: 'year' }
]

export default {
  data() {
    return {
      pageWidth: 800,
    }
  },
  computed: {
    model: {
      get() {
        return this.$store.getters.cronString
      },
      set(val) {
        return this.$store.dispatch('updateCronString', val)
      },
    },
    fontSize() {
      return Math.min(
        (this.pageWidth - 100) / (Math.max(this.model.length, 10) + 4) / 0.6,
        40
      )
    },
    fields() {
      return this.fieldIndexes.map((fieldIndex, i) => ({
        name: fieldIndex === this.highlightedField ? fieldNames[i].full : fieldNames[i].short,
        show: fieldIndex[0] !== -1,
        left: fieldIndex[0],
        width: fieldIndex[1] - fieldIndex[0],
        isHighlighted: fieldIndex === this.highlightedField,
        isValid: !this.$store.getters[fieldNames[i].field+'Field'] || this.$store.getters[fieldNames[i].field+'Valid'],
      }))
    },
    lastFieldIndex() {
      return this.fieldIndexes[this.fieldIndexes.length-1][1]
    },
    ...mapGetters(['fieldIndexes', 'highlightedField', 'highlightedFieldIndex'])
  },
  methods: {
    updatePageWidth() {
      this.pageWidth = document.documentElement.clientWidth
    },
    updateCursorIndex(e) {
      this.$store.commit('updateCursorIndex', e ? e.target.selectionStart : null)
    },
  },
  mounted() {
    this.updatePageWidth()
    window.addEventListener('resize', this.updatePageWidth)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updatePageWidth)
  },
}
</script>

<style lang="stylus" scoped>
@import url('https://fonts.googleapis.com/css?family=Roboto+Mono&display=swap')

.input
  font-family: 'Roboto Mono', monospace

.input-container
  position: relative
  background: rgba(255, 255, 255, 0.95)
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2)
  border-radius: 2em
  overflow: hidden

input
  position: relative
  border: 0
  padding: 0.35em 2ch
  min-height: 35px
  color: #303132
  background: transparent
  font-family: inherit
  font-style: normal
  font-weight: normal
  font-size: inherit

.input-highlight
  position: absolute
  height: 100%
  top: 0
  background: rgba(124, 138, 193, 0.2)
  margin-left: 1.5ch
  padding-right: 1ch
  transition: left 0.1s, width 0.1s
  
  &.invalid
    background: rgba(255, 0, 0, 0.2)

  &.static
    transition: none

.fields
  position: relative
  margin: 0 2ch
  height: 1em
  margin-bottom: 0.1em

  div
    position: absolute
    bottom: 0
    display: flex
    justify-content: center
    text-align: center

  span
    display: block
    position: relative
    font-family: 'Montserrat', sans-serif
    font-weight: normal
    font-size: 16px
    color: rgba(248, 249, 250, 0.7)
    transition: transform 0.1s

    &.highlighted
      font-weight: 600
      font-size: 18px
      color: rgba(248, 249, 250, 0.9)
      transform: translateY(-0.2em)

    &.invalid
      color: red

</style>
