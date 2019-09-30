<template>
  <div>
    <div class="home--hero">
      <div class="home--nav">
        <SearchBox />
        <NavLinks />
      </div>
      <Content slot-key="hero" />
    </div>
    <Content />
  </div>
</template>

<script>
import NavLinks from '@vuepress/theme-default/components/NavLinks.vue'
import SearchBox from '@vuepress/plugin-search/SearchBox.vue'

export default {
  components: { NavLinks, SearchBox },
}
</script>

<style lang="stylus">
.home--hero
  position: relative
  display: flex
  flex-direction: column
  background: linear-gradient(120deg, #80b1c9, #7c8ac1)
  padding: 3em
  padding-bottom: 5em
  text-align: center

  &:after
    content: ''
    position: absolute
    left: 0
    right: 0
    bottom: 0
    height: 4vw
    background: #fff
    clip-path: polygon(0 0, 100% 100%, 0 100%)
    z-index: 0

.content__hero
  z-index: 101

.home--nav
  display: flex
  justify-content: flex-end
  margin-top: -1.5rem
  color: rgba(255,255,255,0.85)
  text-align: start
  z-index: 100

  .nav-links

    a:hover
      color: #fff
      border-bottom-color: rgba(255,255,255,0.6)
</style>
