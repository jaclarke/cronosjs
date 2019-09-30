<template>
  <div class="description" :class="{'show-marks': descriptionParts.length}">
    <span v-for="part of descriptionParts"
      :class="{'description-highlighted': part.i && part.i.includes(highlightedFieldIndex)}"
      v-html="part.s" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { getDescriptionParts } from './cronDesc.js'

export default {
  data() {
    return {
      
    }
  },
  computed: {
    descriptionParts() {
      return this.allFieldsValid ? getDescriptionParts(this.$store.getters) : []
    },
    ...mapGetters(['highlightedField', 'highlightedFieldIndex', 'allFieldsValid'])
  },
  methods: {

  },
}
</script>

<style lang="stylus" scoped>
.description
  color: #2a3764
  font-size: 1.2em
  margin-top: 1.5em
  text-align: center

  &-highlighted
    font-weight: 600

  &.show-marks
    &:before, &:after
      content: '“'
      position: relative
      display: inline-block
      line-height: 0
      width: 0
      font-family: 'Montserrat', sans-serif
      font-size: 4em
      top: 0.4em
      left: -0.2em
      color: rgba(255,255,255,0.3)
      z-index: -1

    &:after
      content: '”'
      top: 0.45em
</style>
