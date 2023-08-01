<template>
  <div>
    <WorkDetails :metadata="metadata" @reset="requestData()" />
    <!-- <WorkQueue :queue="tracks" :editable="false" /> -->
    <WorkTree :tree="tree" :editable="false" :WorkDetails="WorkDetails" :history="history"/>
  </div>
</template>

<script>
import WorkDetails from 'components/WorkDetails'
// import WorkQueue from 'components/WorkQueue'
import WorkTree from 'components/WorkTree'
import NotifyMixin from '../mixins/Notification.js'

export default {
  name: 'Work',

  mixins: [NotifyMixin],

  components: {
    WorkDetails,
    // WorkQueue,
    WorkTree
  },

  computed: {
    getuserName: function() {
      return this.$store.state.User.name
    }
  },

  data () {
    return {
      workid: this.$route.params.id,
      metadata: {
        id: parseInt(this.$route.params.id),
        circle: {}
      },
      tree: [],
      history: [],
      WorkDetails: WorkDetails,
      userName: this.$store.state.User.name
    }
  },

  watch: {
    $route (to) {
      this.workid = to.params.id;
      this.requestData();
    }
  },

  async created () {
    if (this.getuserName == '') {
      await this.sleep(500);
    }
    // console.log(this.$route.query.continue)
    this.userName = this.getuserName
    this.requestData()
  },

  methods: {

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    requestData () {
      this.$axios.get(`/api/work/${this.workid}`)
        .then(response => {
          this.metadata = response.data
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          } else {
            this.showErrNotif(error.message || error)
          }
        })

      this.$axios.get(`/api/tracks/${this.workid}`)
        .then(response => {
          this.tree = response.data
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          } else {
            this.showErrNotif(error.message || error)
          }
        })

        this.$axios.get(`/api/media/history/${this.userName}/${this.workid}`)
        .then(response => {
          // console.log(this.userName +'bbb')
          this.history = response.data
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            // console.log(this.userName +'ccc')
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },
  }
}
</script>
