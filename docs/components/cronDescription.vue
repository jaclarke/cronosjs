<template>
  <div class="description">
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

  &-highlighted
    font-weight: 600
</style>
