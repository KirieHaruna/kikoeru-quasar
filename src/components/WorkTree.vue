<!-- eslint-disable no-unsafe-finally -->
<template>
  <div class="q-ma-md " style="">
    <q-breadcrumbs gutter="xs" v-if="path.length">
      <q-breadcrumbs-el   >
        <q-btn no-caps flat dense size="md" icon="folder" style="height: 30px;" @click="path = []">ROOT</q-btn>
      </q-breadcrumbs-el>
      
      <q-breadcrumbs-el v-for="(folderName, index) in path"  :key="index"  class="cursor-pointer" >
        <q-btn no-caps flat dense size="md" icon="folder" style="height: 30px;" @click="onClickBreadcrumb(index)">{{folderName}}</q-btn>
      </q-breadcrumbs-el>
    </q-breadcrumbs>

    <q-card>
      <q-list separator style="background:#333333;">
        <q-item
          clickable
          v-ripple
          v-for="(item, index) in filteredItems"
          :key="index"
          :active="item.type === 'audio' && currentPlayingFile.hash === item.hash"
          active-class="text-white bg-teal"
          @click="onClickItem(item)"
          class="non-selectable"
        >
          <q-item-section avatar>
            <q-icon size="34px" v-if="item.type === 'folder'" color="amber" name="folder" />
            <q-icon size="34px" v-else-if="item.type === 'text'" color="info" name="description" />
            <q-icon size="34px" v-else-if="item.type === 'image'" color="orange" name="photo" />
            <q-icon size="34px" v-else-if="item.type === 'other'" color="info" name="description" />
            <q-btn v-else round dense color="primary" :icon="playIcon(item.hash)" @click="onClickPlayButton(item.hash)" />
          </q-item-section>

          <q-item-section>
            <q-item-label lines="2">{{ item.title }}</q-item-label>
            <q-item-label v-if="item.children" caption lines="1"  class="text-white">{{ `${item.children.length} 项目` }}</q-item-label>
          </q-item-section>

          <q-item-section side v-if="his === item.hash">
            <div class="q-ml-md text-white">{{ formattedTime }}</div>
          </q-item-section>
            

          <!-- 上下文菜单 -->
          <q-menu
            v-if="item.type === 'audio' || item.type === 'text' || item.type === 'image' || item.type === 'other'"
            touch-position
            context-menu
            auto-close
            transition-show="jump-down"
            transition-hide="jump-up"
          >
            <q-list separator>
              <q-item clickable @click="addToQueue(item)" v-if="item.type === 'audio'">
                <q-item-section>添加到播放列表</q-item-section>
              </q-item>

              <q-item clickable @click="playNext(item)" v-if="item.type === 'audio'">
                <q-item-section>下一曲播放</q-item-section>
              </q-item>

              <q-item clickable @click="download(item)">
                <q-item-section>下载文件</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>
      </q-list>
    </q-card>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'WorkTree',

  data() {
    return {
      path: []
    }
  },

  props: {
    tree: {
      type: Array,
      required: true,
    },
    history: {
      type: Array,
      required: false,
    },
    WorkDetails: Object,
  },

  watch: {
    tree () {
      this.initPath()
    }
  },

  computed: {

    formattedTime() {
      let time = Math.floor(this.playTime)
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;

      // 使用 toString() 和 padStart() 方法来确保秒是两位数
      return `播放至${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    fatherFolder () {
      let fatherFolder = this.tree.concat()
      // console.log(fatherFolder)
      this.path.forEach(folderName => {
        fatherFolder = fatherFolder.find(item => item.type === 'folder' && item.title === folderName).children
      })
      // console.log(this.playTime + ' :' + this.his)

      return fatherFolder
    },
    
    filteredItems() {
      // 从$store中获取showLrc的值
      let showLyrics = this.$store.state.User.displayLrcFile
      if (showLyrics) {
        // console.log(showLyrics)
        return this.fatherFolder
      }else {
        // console.log(showLyrics)
        return this.fatherFolder.filter(item => item.type !== 'text')
      }
    },

    his () {
      try{
        let item = this.history.concat()[0].hash
        return item
      }catch {
        return ''
      }
      
    },

    playTime () {
      try{
        let item = this.history.concat()[0].play_time
        return item
      }catch {
        return ''
      }
    },

    queue () {
      const queue = []
      this.fatherFolder.forEach(item => {
        if (item.type === 'audio') {
          queue.push(item)
        }
      })

      return queue
    },

    ...mapState('AudioPlayer', [
      'playing'
    ]),

    ...mapGetters('AudioPlayer', [
      'currentPlayingFile'
    ])
  },
  async mounted () {
    let count = 0
    while (!this.playTime && count < 30) {
      count += 1
      await this.sleep(100);
    }
    // await this.sleep(500);
    // console.log(this.playTime + ' :' + this.his + ' :' + this.$route.query.continue)
    if (this.$route.query.continue === 'true') {
      // console.log('aaa :' + this.$route.query.continue)
      let result = this.make_queue(this.fatherFolder, this.his)
      let queue = result.queue.concat()
      this.$router.replace({ query: { continue: false } });
      // console.log(this.playTime + ' :' + this.his)
      if (result.queue.length>0 && result.isHitted){
        this.$store.commit('AudioPlayer/SET_QUEUE', {
          queue: queue,
          index: queue.findIndex(file => file.hash === this.his),
          resetPlaying: true,
          time: this.playTime
        })
      }
    }
  },

  methods: {
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    make_queue(fatherFolder, hash) {
      let queue = []
      let childFolder = []
      let isHitted = false

      for (const item of fatherFolder) {
        if (item.type === 'folder') {
          const result = this.make_queue(item.children, hash)
          queue = queue.concat(result.queue)
          childFolder = childFolder.concat(result.childFolder)
          isHitted = isHitted || result.isHitted
        } else if (item.type === 'audio') {
          queue.push(item)
        }

        if (item.hash === hash) {
          isHitted = true
        }
      }

      if (isHitted) {
        return {
          queue: queue,
          childFolder: childFolder,
          isHitted: isHitted
        }
      } else {
        return {
          queue: [],
          childFolder: [],
          isHitted: false
        }
      }
    },

    playIcon (hash) {
      return this.playing && this.currentPlayingFile.hash === hash ? "pause" : "play_arrow"            
    },

    initPath () {
      const initialPath = []
      let fatherFolder = this.tree.concat()
      while (fatherFolder.length === 1) {
        if (fatherFolder[0].type === 'audio') {
          break
        }
        initialPath.push(fatherFolder[0].title)
        fatherFolder = fatherFolder[0].children
      }
      this.path = initialPath
    },
    
    onClickBreadcrumb (index) {
      this.path = this.path.slice(0, index+1)
    },

    onClickItem (item) {
      if (item.type === 'folder') {
        this.path.push(item.title);
      } else if (item.type === 'text' || item.type === 'image') {
        this.openFile(item);
      } else if (item.type === 'other') {
        this.download(item);
      } else if (this.currentPlayingFile.hash !== item.hash) {
        this.$store.commit('AudioPlayer/SET_QUEUE', {
          queue: this.queue.concat(),
          index: this.queue.findIndex(file => file.hash === item.hash),
          resetPlaying: true,
          time: this.his === item.hash ? this.playTime : 0
        })
      }
    },

    onClickPlayButton (hash) {
      if (this.currentPlayingFile.hash === hash) {
        this.$store.commit('AudioPlayer/TOGGLE_PLAYING')
      } else {
        this.$store.commit('AudioPlayer/SET_QUEUE', {
          queue: this.queue.concat(),
          index: this.queue.findIndex(file => file.hash === hash),
          resetPlaying: true,
          time: this.his === hash ? this.playTime : 0
        })
      }
    },

    addToQueue (file) {
      this.$store.commit('AudioPlayer/ADD_TO_QUEUE', file)
    },

    playNext (file) {
      this.$store.commit('AudioPlayer/PLAY_NEXT', file)
    },

    download (file) {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      // Fallback to old API for an old backend 
      const url = file.mediaDownloadUrl ? `${file.mediaDownloadUrl}?token=${token}` : `/api/media/download/${file.hash}?token=${token}`;
      const link = document.createElement('a');
      link.href = url;
      link.target="_blank";
      link.click();
    },

    openFile (file) {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      // Fallback to old API for an old backend 
      const url = file.mediaStreamUrl ? `${file.mediaStreamUrl}?token=${token}` : `/api/media/stream/${file.hash}?token=${token}`;
      const link = document.createElement('a');
      link.href = url;
      link.target="_blank";
      link.click();
    }
  }
}
</script>
