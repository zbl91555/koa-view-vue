
import App from './component/app'

import Vue from 'vue'

const app = new Vue({
  render: h => h(App),
  data() {
    return {
      ...window._vue_ssr_data
    }
  }
})

app.$mount('#app')
