<template>
  <div class="cron-demo">
    <cron-input />
    <cron-description />

    <div class="options">
      <timezone-input />
    </div>
  </div>
</template>

<script>
import cronInput from '../../../components/cronInput'
import cronDescription from '../../../components/cronDescription'
import timezoneInput from '../../../components/timezoneInput'

export default {
  components: { cronInput, cronDescription, timezoneInput },
  data() {
    return {
    }
  },
  computed: {
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
</style>
