import { isEqual } from 'lodash'
import Vuex from 'vuex'
import { createStore } from '../../store'

export default ({
  Vue, // the version of Vue being used in the VuePress app
  options, // the options for the root Vue instance
  router, // the router instance for the app
  siteData // site metadata
}) => {
  Vue.use(Vuex)
  options.store = createStore(router)

  const scrollBehavior = router.options.scrollBehavior
  router.options.scrollBehavior = (to, from, savedPosition) => {
    if (
      to.path === from.path &&
      to.hash === from.hash &&
      !isEqual(to.query, from.query)
    ) return false
    else return scrollBehavior(to, from, savedPosition)
  }
}
