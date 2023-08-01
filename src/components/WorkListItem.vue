<template>
  <q-item clickable :to="`/work/${metadata.id}${isHistoryItem ? '?continue=true' : ''}`" class="bg-dark text-white" :class="{'rounded-borders': isHistoryItem}" style="padding: 5px;">
    <q-item-section avatar style="padding: 0px 5px 0px 0px;">
      <router-link :to="`/work/${metadata.id}${isHistoryItem ? '?continue=true' : ''}`">
        <q-img transition="fade" :src="samCoverUrl" :style="isHistoryItem ? { height: '40px', width: '40px' } : { height: '60px', width: '60px' }" />
      </router-link>
    </q-item-section>

    <q-item-section>
      <q-item-label lines="2" class="text">
        <router-link :to="`/work/${metadata.id}${isHistoryItem ? '?continue=true' : ''}`" class="text-white truncate-text">
          {{ metadata.title }}
        </router-link>
      </q-item-label>

      <q-item-label class="text" lines="2" v-if="isHistoryItem">
        <span  class="text-blue truncate-text">{{ truncateText(metadata.track_name, 15) }}</span>
        <span>位置:</span>
        <span>{{ formattedTime(metadata.play_time) }}</span>
      </q-item-label>

      <q-item-label  v-if="!isHistoryItem">
        <div class="row q-gutter-x-sm q-gutter-y-xs">
          <router-link :to="`/works?circleId=${metadata.circle.id}`" class="col-auto text-grey">
            {{ metadata.circle.name }}
          </router-link>

          <span class="col-auto">/</span>

          <router-link
            v-for="(va, index) in metadata.vas"
            :to="`/works?vaId=${va.id}`"
            :key=index
            class="col-auto text-primary"
          >
            {{ va.name }}
          </router-link>
        </div>
      </q-item-label>

      <q-item-label v-if="showLabel && $q.screen.width> 700">
        <div class="row q-gutter-x-sm q-gutter-y-xs">
          <router-link
            v-for="(tag, index) in metadata.tags"
            :to="`/works?tagId=${tag.id}`"
            :key=index
            class="col-auto text-grey"
          >
            {{ tag.name }}
          </router-link>
        </div>
      </q-item-label>
    </q-item-section>
  </q-item>   
</template>

<script>
// import WorkDetails from 'components/WorkDetails'
// import CoverSFW from 'components/CoverSFW'

export default {
  name: 'WorkListItem',
  onlodad () {
    console.log(this.metadata)
  },

  props: {
    metadata: {
      type: Object,
      required: true
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    isHistoryItem: {
      type: Boolean,
      default: false
    },
  },

  computed: {
    samCoverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return this.metadata.id ? `/api/cover/${this.metadata.id}?type=sam&token=${token}` : ""
    },
  },

  methods: {
    formattedTime(time) {
      // console.log(time);
      time = Math.floor(time)
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;

      // 使用 toString() 和 padStart() 方法来确保秒是两位数
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    truncateText (text, length) {
      if (text.length > length) {
        return text.substring(0, length) + '...'
      } else {
        return text + ''
      }
    }
  }
}
</script>

<style>
.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rounded-borders {
  border-radius: 10px;
}
</style>
