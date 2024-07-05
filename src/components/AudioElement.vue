<template>
  <vue-plyr ref="plyr" :emit="['canplay', 'timeupdate', 'ended', 'seeked', 'playing', 'waiting', 'pause', 'seeking']"
    @canplay="onCanplay()" @timeupdate="onTimeupdate()" @ended="onEnded()" @seeked="onSeeked()" @playing="onPlaying()"
    @waiting="onWaiting()" @pause="onPause()" @sourcechange="onSourceChange()" @seeking="onSeeking()">
    <audio v-if="!videoMode" crossorigin="anonymous" ref="audioElement">
      <source v-if="source" :src="source" />
    </audio>
    <video v-else crossorigin="anonymous">
      <source v-if="source" :src="source" />
    </video>
  </vue-plyr>
</template>


<script>
import Lyric from 'lrc-file-parser'
import { mapState, mapGetters, mapMutations } from 'vuex'
import NotifyMixin from '../mixins/Notification.js'



export default {
  name: 'AudioElement',

  mixins: [NotifyMixin],

  data() {
    return {
      lrcObj: null,
      lrcAvailable: false,
      count: 0,
      // videoMode: JSON.parse(localStorage.getItem('videoModeFlag')),
      videoMode: JSON.parse(localStorage.getItem('videoModeFlag')),
      notifyBarButtonInited: false,
    }
  },
  props: ["coverUrl"],
  computed: {
    player() {
      return this.$refs.plyr.player
    },
    noPicFlag() {
      return this.$q.localStorage.getItem('noPicFlag') || false
    },


    // videoMode() {
    // const videoModeFlag = localStorage.getItem('videoModeFlag')
    // console.log(JSON.parse(videoModeFlag))
    //   if (videoModeFlag !== null) {
    //     return JSON.parse(videoModeFlag)
    //   }else{
    //     return false
    //   }
    // },

    source() {
      // 从 LocalStorage 中读取 token
      // console.log(this.currentPlayingFile)
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      // New API
      if (this.currentPlayingFile.mediaStreamUrl) {
        return `${this.currentPlayingFile.mediaStreamUrl}?token=${token}`
      } else if (this.currentPlayingFile.hash) {
        // Fallback to be compatible with old backend
        return `/api/media/stream/${this.currentPlayingFile.hash}?token=${token}`
      } else {
        return ""
      }
    },

    ...mapState('AudioPlayer', [
      'playing',
      'queue',
      'queueIndex',
      'playMode',
      'muted',
      'volume',
      'sleepTime',
      'sleepMode',
      'rewindSeekTime',
      'forwardSeekTime',
      'rewindSeekMode',
      'forwardSeekMode'
    ]),

    ...mapGetters('AudioPlayer', [
      'currentPlayingFile'
    ])
  },

  watch: {
    noPicFlag() {
      this.notifyBarButtonInited = false;
      this.addNotifyBarButton()
    },
    currentPlayingFile() {
      this.addNotifyBarButton()
    }
    ,
    playing(flag) {
      if (this.player.duration) {
        // 缓冲至可播放状态
        flag ? this.player.play() : this.player.pause()
        if (this.$store.state.AudioPlayer.startTime != 0) {
          console.log('startTime', this.$store.state.AudioPlayer.startTime)
        }
      }

      // this.playLrc(flag);
    },

    // watch source -> media.load() -> canPlay -> player.play()
    source(url) {
      if (url) {
        // 加载新音频/视频文件
        this.player.media.load();
        this.loadLrcFile();
      }
    },

    muted(flag) {
      // 切换静音状态
      this.player.muted = flag
    },

    volume(val) {
      // 屏蔽非法数值
      if (val < 0 || val > 1) {
        return
      }

      // 调节音量
      this.player.volume = val
    },
    rewindSeekMode(rewind) {
      if (rewind) {
        this.player.rewind(this.rewindSeekTime);
        this.SET_REWIND_SEEK_MODE(false);
      }
    },
    forwardSeekMode(forward) {
      if (forward) {
        this.player.forward(this.forwardSeekTime);
        // this.player.currentTime = 60;
        this.SET_FORWARD_SEEK_MODE(false);
      }
    }
  },

  methods: {
    onSourceChange() {
      // console.log('onPlay' + event)
      // 销毁 vue-plyr 组件
      this.$refs.plyr.destroy();
      // 重新创建 vue-plyr 组件
      this.$nextTick(() => {
        this.$refs.plyr.init()
        // this.addNotifyBarButton()
      });
      this.player.currentTime = this.$store.state.AudioPlayer.startTime;
    },
    /**
     * 当 外部暂停（线控暂停、软件切换）、用户控制暂停、seek 时会触发本事件
     */
    onPause() {
      // console.log('onPause:this.playing'+this.playing)
      this.playLrc(false)
      this.PAUSE()
    },
    /**
     * 当播放器真正开始播放时会触发本事件
     */
    onPlaying() {
      // console.log('this.player' + this.$store.state.AudioPlayer.currentTime)
      // this.player.seek(this.$store.state.AudioPlayer.currentTime);
      this.playLrc(true)
      this.PLAY()
      // this.addNotifyBarButton(this.mediaConfigObj)
      if (this.$store.state.AudioPlayer.startTime != 0) {
        this.player.currentTime = this.$store.state.AudioPlayer.startTime;
        this.$store.commit('AudioPlayer/SET_START_TIME', 0);
      }
      // this.player.currentTime = this.$store.state.AudioPlayer.startTime;
    },
    /**
     * 当播放器缓冲区空，被迫暂停加载时会触发本事件
     */
    onWaiting() {
      // console.log('waiting')
      this.playLrc(false)
      this.PLAY()
    },
    ...mapMutations('AudioPlayer', [
      'SET_DURATION',
      'SET_CURRENT_TIME',
      'SET_START_TIME',
      'PAUSE',
      'PLAY',
      'SET_TRACK',
      'NEXT_TRACK',
      'PREVIOUS_TRACK',
      'SET_CURRENT_LYRIC',
      'SET_VOLUME',
      'CLEAR_SLEEP_MODE',
      'SET_REWIND_SEEK_MODE',
      'SET_FORWARD_SEEK_MODE',
      'ON_SEEKING',
      'ON_SEEKED',
    ]),

    onCanplay() {
      // 缓冲至可播放状态时触发 (只有缓冲至可播放状态, 才能获取媒体文件的播放时长)
      this.SET_DURATION(this.player.duration)

      // console.log('onCanplay');
      // this.PLAY()
      // 播放
      if (this.playing && this.player.currentTime !== this.player.duration) {
        this.player.play()
      }
    },

    onTimeupdate() {
      // 当目前的播放位置已更改时触发
      this.SET_CURRENT_TIME(this.player.currentTime)
      this.count += 1
      if (this.count == 10) {
        // console.log(this.currentPlayingFile)
        this.count = 0
        this.$axios.post('/api/media/history', {
          play_time: this.player.currentTime,
          hash: this.currentPlayingFile.hash,
          username: this.$store.state.User.name,
          id: this.currentPlayingFile.hash.split('/')[0],
          track_name: this.currentPlayingFile.title,
        })
      }
      if (this.sleepMode && this.sleepTime) {
        const currentTime = new Date()
        const currentHourStr = currentTime.getHours().toString().padStart(2, '0')
        const currentMinuteStr = currentTime.getMinutes().toString().padStart(2, '0')
        const sleepHourStr = this.sleepTime.match(/\d+/g)[0]
        const sleepMinuteStr = this.sleepTime.match(/\d+/g)[1]
        if (currentHourStr === sleepHourStr && currentMinuteStr === sleepMinuteStr) {
          this.PAUSE()
          this.CLEAR_SLEEP_MODE()
          // Persist sleep mode settings
          this.$q.sessionStorage.set('sleepTime', null)
          this.$q.sessionStorage.set('sleepMode', false)
        }
      }
    },

    onEnded() {
      // 当前文件播放结束时触发
      switch (this.playMode.name) {
        case "all repeat":
          // 循环播放
          if (this.queueIndex === this.queue.length - 1) {
            this.SET_TRACK(0)
          } else {
            this.NEXT_TRACK()
          }
          break
        case "repeat once":
          // 单曲循环
          this.player.currentTime = 0
          this.player.play()
          this.PLAY()
          break
        case "shuffle": {
          // 随机播放
          const index = Math.floor(Math.random() * this.queue.length)
          this.SET_TRACK(index)
          if (index === this.queueIndex) {
            this.player.currentTime = 0
          }
          break
        }
        default:
          // 顺序播放
          if (this.queueIndex === this.queue.length - 1) {
            this.PAUSE()
          } else {
            this.NEXT_TRACK()
          }
      }
    },

    onSeeked() {
      // if (this.lrcAvailable) {
      //   this.lrcObj.play(this.player.currentTime * 1000);
      //   if (!this.playing) {
      //     this.lrcObj.pause();
      //   }
      // }
      // console.log("onseeked:" + this.playing)
      this.ON_SEEKED()
    },
    onSeeking() {
      this.ON_SEEKING()
    },

    playLrc(playStatus) {
      if (this.lrcAvailable) {
        if (playStatus) {
          this.lrcObj.play(this.player.currentTime * 1000);
        } else {
          this.lrcObj.pause();
        }
      }
    },

    initLrcObj() {
      this.lrcObj = new Lyric({
        onPlay: (line, text) => {
          this.SET_CURRENT_LYRIC(text);
        },
      })
    },

    loadLrcFile() {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      const fileHash = this.queue[this.queueIndex].hash;
      const url = `/api/media/check-lrc/${fileHash}?token=${token}`;

      this.$axios.get(url)
        .then((response) => {
          if (response.data.result) {
            // 有lrc歌词文件
            this.lrcAvailable = true;
            console.log('读入歌词');
            const lrcUrl = `/api/media/stream/${response.data.hash}?token=${token}`;
            this.$axios.get(lrcUrl)
              .then(response => {
                console.log('歌词读入成功');
                this.lrcObj.setLyric(response.data);
                this.lrcObj.play(this.player.currentTime * 1000);
              });
          } else {
            // 无歌词文件
            this.lrcAvailable = false;
            this.lrcObj.setLyric('');
            this.SET_CURRENT_LYRIC('');
          }
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            if (error.response.status !== 401) {
              this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`);
            }
          } else {
            this.showErrNotif(error.message || error);
          }
        })
    },
    //从用户UA获取用户设备类型
    getMobileOperatingSystem() {
      const userAgent = navigator.userAgent
      // iOS设备
      if (/iPad|iPhone|iPod|Macintosh/.test(userAgent) && !window.MSStream) {
        return 'iOS';
      }

      // Android设备
      if (/android/i.test(userAgent)) {
        return 'Android';
      }

      // 其他情况
      return 'unknown';
    },
    // 手机通知栏添加线控按钮
    addNotifyBarButton() {
      if ('mediaSession' in navigator) {
        let platform = this.getMobileOperatingSystem()

        const _this = this
        let mediaConfigObj = {
          title: this.noPicFlag ? "Kikoeru" : this.currentPlayingFile.title, //音轨标题
          // title: this.currentPlayingFile.title,
          artist: "",
          album: this.noPicFlag ? "" : this.currentPlayingFile.workTitle, //作品标题
          // album: this.currentPlayingFile.workTitle,
          //artwork:[{ src: this.samCoverUrl(this.currentPlayingFile.hash), sizes: '50x50', type: 'image/jpg' }]
          artwork: this.noPicFlag ? [{ src: "" }] : [{ src: this.coverUrl }]
        }
        navigator.mediaSession.metadata = new MediaMetadata(mediaConfigObj);
        if (this.notifyBarButtonInited && (platform !== 'iOS')) { //被傻逼ios气晕， 如果为iOS则绑定第二次。
          return
        }
        navigator.mediaSession.setActionHandler('play', function () {
          _this.PLAY()
        });
        navigator.mediaSession.setActionHandler('pause', function () {
          _this.PAUSE()
        });

        navigator.mediaSession.setActionHandler('previoustrack', function () {
          _this.PREVIOUS_TRACK()
        });
        navigator.mediaSession.setActionHandler('nexttrack', function () { _this.NEXT_TRACK() });
        // if (platform !== 'iOS') {
        //   navigator.mediaSession.setActionHandler('seekbackward', function () {
        //     _this.SET_REWIND_SEEK_MODE(true)
        //   });
        //   navigator.mediaSession.setActionHandler('seekforward', function () {
        //     _this.SET_FORWARD_SEEK_MODE(true)
        //   });
        // }

        this.notifyBarButtonInited = true; //确保setHandler只会执行一次
      }
    }
  },

  mounted() {
    // 初始化音量
    this.SET_VOLUME(this.player.volume);
    this.initLrcObj();
    if (this.source) {
      this.loadLrcFile();
    }
    this.addNotifyBarButton()
  }
}
</script>
