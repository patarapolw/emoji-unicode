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
      b-table-column.has-text-centered(field="like" width="50" sortable)
        b-tooltip(:label="isAuthenticated ? '' : 'Login to ❤️'" position="is-right")
          button.button.is-text(@click="props.row.like.includes(userEmail) ? doUnlike(props.row._id) : doLike(props.row._id)")
            b-icon(icon="heart" :class="props.row.like.includes(userEmail) ? 'has-text-danger' : 'has-text-grey-light'")
        .has-text-centered(v-if="props.row.like.length > 0")
          small {{props.row.like.length}}
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
import createAuth0Client from '@auth0/auth0-spa-js'
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client'

@Component
export default class App extends Vue {
  output: any[] = []
  auth0?: Auth0Client
  isAuthenticated = false
  userEmail: string = ''
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
    this.isAuthenticated = await this.getAuthenticated()
  }

  @Watch('q')
  @Watch('page')
  @Watch('sort')
  @Watch('order')
  async load () {
    const q = Array.isArray(this.q) ? this.q[0] : this.q

    if (q) {
      try {
        const r = await axios.get('/api/search', {
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

  async getAuth0 () {
    if (!this.auth0) {
      this.auth0 = await createAuth0Client({
        domain: process.env.VUE_APP_AUTH0_DOMAIN!,
        client_id: process.env.VUE_APP_AUTH0_CLIENT_ID!,
        audience: process.env.VUE_APP_AUTH0_AUDIENCE!
      })
    }
    return this.auth0
  }

  async getUser () {
    const auth0 = await this.getAuth0()
    if (!(await auth0.isAuthenticated())) {
      await auth0.loginWithPopup()
    }
    this.isAuthenticated = true

    const user = await auth0.getUser()
    this.userEmail = user.email

    return user.email
  }

  async getAuthenticated () {
    const auth0 = await this.getAuth0()
    this.isAuthenticated = await auth0.isAuthenticated()
    return this.isAuthenticated
  }

  async getToken () {
    let token = localStorage.getItem('token')
    if (token) {
      const r = await fetch('/api/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (r.status !== 200) {
        token = ''
      }
    }

    if (!token) {
      await this.getUser()
      const auth0 = await this.getAuth0()
      token = await auth0.getTokenSilently()
    }
    if (token) {
      localStorage.setItem('token', token)
    }

    return token
  }

  async doLike (id: string) {
    const token = await this.getToken()
    const user = await this.getUser()

    await axios.put('/api/like', undefined, {
      params: {
        user,
        id
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    this.load()
  }

  async doUnlike (id: string) {
    const user = await this.getUser()
    const token = await this.getToken()

    await axios.delete('/api/unlike', {
      params: {
        user,
        id
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    this.load()
  }
}
</script>
