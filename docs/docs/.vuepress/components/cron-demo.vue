<template>
  <div class="cron-demo">
    <cron-input />
    <cron-description />

    <div class="options">
      <timezone-input />

      <input type="checkbox" v-model="skipRepeatedHour">

      <div class="missing-hour">
        <dropdown-select :items="missingHourItems" v-model="missingHour" />
        <label>Missing hour</label>
      </div>
    </div>

    <cron-clock />
  </div>
</template>

<script>
import cronInput from '../../../components/cronInput'
import cronDescription from '../../../components/cronDescription'
import timezoneInput from '../../../components/timezoneInput'
import dropdownSelect from '../../../components/dropdownSelect'
import cronClock from '../../../components/cronClock'

export default {
  components: { cronInput, cronDescription, timezoneInput, dropdownSelect, cronClock },
  data() {
    return {
      missingHourItems: ['insert', 'skip', 'offset'],
    }
  },
  computed: {
    missingHour: {
      get() {
        return this.$store.getters.missingHour
      },
      set(val) {
        return this.$store.dispatch('updateMissingHour', val)
      },
    },
    skipRepeatedHour: {
      get() {
        return this.$store.getters.skipRepeatedHour
      },
      set(val) {
        return this.$store.dispatch('updateSkipRepeatedHour', val)
      },
    }
  },
}
</script>

<style lang="stylus" scoped>
.cron-demo
  display: flex
  flex-direction: column
  align-items: center
  text-align: start

.options
  display: flex
  align-self: stretch
  margin-top: 3em
  
  label
    color: #fff

.missing-hour
  margin-left: auto
  display: flex
  align-items: center

  label
    margin-left: 0.7em
</style>
