<template>
  <router-link :to="`/work/${workid}`" :class="{ 'small-font': $q.screen.width <= 600 }">
    <q-img v-show="!noPic"
      :src="coverUrl"
      :ratio="4/3"
      :img-class="imgClass"
      style="max-width: 560px;"
      transition="fade"
      @mouseover="toggleBlurFlag()"
      @mouseout="toggleBlurFlag()"
    >
      <div class="absolute-top-left " style="padding: 0;">
        <q-chip dense square color="brown" text-color="white" class="q-ma-sm">
          {{`RJ${rjcode}`}}
        </q-chip>
      </div>

      <div :v-if="release" class="absolute-bottom-right" :style="{'padding': $q.screen.width <= 600 ? '0px' : '5px'}">
        {{release}}
      </div>
    </q-img>
  </router-link>   
</template>

<script>
export default {
  name: 'CoverSFW',

  props: {
    workid: {
      type: Number,
      required: true
    },
    
    nsfw: {
      type: Boolean,
      default: true
    },

    release: {
      required: true
    },

    historys: {
      required: false
    }
  },

  data () {
    return {
      blurFlag: true,
    }
  },

  computed: {
    coverUrl () {
      // 从 LocalStorage 中读取 token
      // console.log(this.historys)
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return this.workid ? `/api/cover/${this.workid}?token=${token}` : ""
    },

    rjcode () {
      if (this.workid>=1000000) {
            return (`00000000${this.workid}`).slice(-8);
          } else {
            return (`000000${this.workid}`).slice(-6);
          }
    },

    imgClass () {
      if (this.$q.platform.is.mobile) {
        // 在移动设备上图片直接显示
        return ""
      } else {
        if (!this.nsfw) {
          // 在PC上SFW的图片直接显示
          return ""
        } else {
          // 在PC上NSFW的图片鼠标悬停显示
          return this.blurFlag ? "blur-image" : ""
        }
      }
    },

    noPic (){
      return this.$q.localStorage.getItem('noPicFlag');
    }
  },

  methods: {
    toggleBlurFlag () {
      this.blurFlag = !this.blurFlag
    }
  }
}
</script>

<style lang="scss">
  .blur-image {
    filter: blur(10px);
  }
</style>