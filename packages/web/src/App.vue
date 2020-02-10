<template lang="pug">
.container(style="margin-top: 1rem;")
  b-field(label="Search")
    b-input(v-model="q" placeholder="Please search to view results")
  b-table(
    :data="output"
    paginated
    :per-page="5"
    :total = "count"

    backend-pagination
    @page-change="page = $event"
    backend-sorting
    @sort="onSort"
    :default-sort="[sort, order]"
  )
    template(slot-scope="props")
      b-table-column(label="Unicode" field="charCode" sortable width="50")
        | {{'0x' + props.row.charCode.toString(16)}}
      b-table-column(label="Symbol" field="symbol" width="100")
        | {{props.row.symbol}}
      b-table-column(label="Code" field="code" sortable width="100")
        code {{props.row.code}}
      b-table-column(label="Alternatives" field="alt" width="100")
        div(v-for="a in props.row.alt" :key="a")
          code {{a}}
      b-table-column(label="Description" field="description" sortable) {{props.row.description}}
      b-table-column(label="Hint" field="hint" style="min-width: 200px;")
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
import axios from 'axios'

@Component
export default class App extends Vue {
  output: any[] = []
  count = 0

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

  get sort () {
    return this.$route.query.sort || 'code'
  }

  set sort (sort) {
    this.$router.push({
      query: {
        ...this.$route.query,
        sort
      }
    })
  }

  get order () {
    return this.$route.query.order || 'desc'
  }

  set order (order) {
    this.$router.push({
      query: {
        ...this.$route.query,
        order
      }
    })
  }

  async created () {
    this.load()
  }

  @Watch('q')
  @Watch('page')
  @Watch('sort')
  @Watch('order')
  async load () {
    const q = Array.isArray(this.q) ? this.q[0] : this.q

    if (q) {
      try {
        const r = await axios.post('/api/search', undefined, {
          params: {
            q,
            offset: (this.page - 1) * 5,
            sort: this.sort,
            order: this.order
          }
        })

        this.count = r.data.count
        Vue.set(this, 'output', r.data.data)
      } catch (e) {
        Vue.set(this, 'output', [])
      }
    } else {
      Vue.set(this, 'output', [])
    }
  }

  onSort (sort: string, order: string) {
    this.sort = sort
    this.order = order
  }
}
</script>
