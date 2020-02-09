<template lang="pug">
.container
  b-field(label="Search")
    b-input(v-model="q" placeholder="Type here to search")
  .container(name="output")
    pre(v-html="outputHtml")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import yaml from 'js-yaml'
import { Search } from 'js-search'

import htmlCodesYaml from 'raw-loader!./assets/codes.yaml'

@Component
export default class App extends Vue {
  q = ''
  output: any[] = []

  searcher = new Search('symbol')

  get outputHtml () {
    return JSON.stringify(this.output, null, 2)
  }

  created () {
    this.searcher.addIndex('symbol')
    this.searcher.addIndex('html-name')
    this.searcher.addIndex('name')
    this.searcher.addIndex('hint')
    this.searcher.addDocuments(Object.values(yaml.safeLoad(htmlCodesYaml)))
  }

  @Watch('q')
  onQChanged () {
    if (this.q) {
      Vue.set(this, 'output', this.searcher.search(this.q))
    } else {
      Vue.set(this, 'output', [])
    }
  }
}
</script>
