<template>
  <div class="cron-demo">
    <cron-input />
    <cron-description />
    <timezone-input />
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
</style>
