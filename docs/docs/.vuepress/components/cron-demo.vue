<template>
  <div class="cron-demo">
    <cron-input />
    <cron-description />
  </div>
</template>

<script>
import cronInput from '../../../components/cronInput'
import cronDescription from '../../../components/cronDescription'

export default {
  components: { cronInput, cronDescription },
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
</style>
