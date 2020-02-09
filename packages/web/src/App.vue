<template lang="pug">
.container(style="margin-top: 1rem;")
  b-field(label="Search")
    b-input(v-model="q" placeholder="Please search to view results")
  b-table(
    :data="output"
    paginated
    :per-page="5"
    :current-page.sync="page"
  )
    template(slot-scope="props")
      b-table-column.has-text-centered(field="like" width="50" sortable)
        button.button.is-text
          b-icon.has-text-grey-light(icon="heart")
        .has-text-centered
          small 0
      b-table-column(label="Unicode" field="charCode" sortable width="50")
        | {{'0x' + props.row.charCode.toString(16)}}
      b-table-column(label="Symbol" field="symbol" width="100")
        | {{props.row.symbol}}
      b-table-column(label="Code" field="code" sortable width="100")
        code {{props.row.code}}
      b-table-column(label="Alternatives" field="alt" width="100")
        div(v-for="a in props.row.alt" :key="a")
          code {{a}}
      b-table-column(label="Description" field="description") {{props.row.description}}
      b-table-column(label="Hint" field="hint")
        div(v-for="a, i in props.row.hint" :key="i") {{a}}
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

import htmlCodesYaml from 'raw-loader!../api/codes.yaml'

@Component
export default class App extends Vue {
  output: any[] = []
  searcher = new Search('symbol')

  get q () {
    return this.$route.query.q
  }

  set q (q) {
    this.$router.push({
      query: {
        ...this.$route.query,
        q
      }
    })
  }

  get page () {
    const pageString = Array.isArray(this.$route.query.page) ? this.$route.query.page[0] : this.$route.query.page
    return parseInt(pageString || '1')
  }

  set page (page) {
    if (page === 1) {
      const { page, ...query } = this.$route.query
      this.$router.push({ query })
    } else {
      this.$router.push({
        query: {
          ...this.$route.query,
          page: page.toString()
        }
      })
    }
  }

  created () {
    this.searcher.addIndex('symbol')
    this.searcher.addIndex('description')
    this.searcher.addIndex('hint')
    this.searcher.addDocuments(Object.values(yaml.safeLoad(htmlCodesYaml)))

    this.onQChanged()
  }

  @Watch('$route.query.q')
  onQChanged () {
    const q = Array.isArray(this.q) ? this.q[0] : this.q

    if (q) {
      Vue.set(this, 'output', this.searcher.search(q))
    } else {
      Vue.set(this, 'output', [])
    }
  }
}
</script>
