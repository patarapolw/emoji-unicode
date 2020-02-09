<template lang="pug">
.container
  b-field(label="Search")
    b-input(v-model="q" placeholder="Please search to view results")
  b-table(:data="output")
    template(slot-scope="props")
      b-table-column(label="Character Code" field="charCode") {{props.row.charCode}}
      b-table-column(label="Symbol" field="symbol") {{props.row.symbol}}
      b-table-column(label="Code" field="code" sortable)
        code {{props.row.code}}
      b-table-column(label="Alternate codes" field="alt")
        div(v-for="a in props.row.alt" :key="a")
          code {{a}}
      b-table-column(label="Description" field="description") {{props.row.description}}
      b-table-column(label="Hint" field="hint")
        div(v-for="a in props.row.hint" :key="a") {{a}}
    template(slot="empty")
      section.section
        .content.has-text-grey.has-text-centered
          p
            b-icon(icon="emoticon-sad" size="is-large")
          p Nothing here.
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

  created () {
    this.searcher.addIndex('symbol')
    this.searcher.addIndex('description')
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
