import { reactive } from 'vue';
import { getSongUrl, getSongCover, getLyric } from '../api/music.js';
import { savePlayHistory } from '../api/playlist.js';
import { userStore } from './user.js';

const audioManager = uni.getBackgroundAudioManager();

const sysInfo = uni.getSystemInfoSync();
const screenWidth = sysInfo.windowWidth;
const screenHeight = sysInfo.windowHeight;

const parseLyric = (lrcText) => {
  if (!lrcText) return [];
  const lines = lrcText.split(/[\n\r]+/);
  const result = [];
  const timeReg = /\[(\d{1,2}):(\d{1,2})(\.(\d{1,3}))?\](.*)/;

  for (const line of lines) {
    const match = line.match(timeReg);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = match[4] ? parseFloat("0." + match[4]) : 0;
      const time = min * 60 + sec + ms;
      const text = match[5].trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }
  return result;
};

export const playerStore = reactive({
  isPlaying: false,
  currentSong: null,
  playlist: [],
  lyric: [],
  currentTime: 0,
  duration: 0,
  playMode: 'sequence',
  
  widgetPosition: {
    x: screenWidth - 70,
    y: screenHeight * 0.5
  },

  togglePlayMode() {
    const modes = ['sequence', 'loop', 'random'];
    const currentIdx = modes.indexOf(this.playMode);
    this.playMode = modes[(currentIdx + 1) % modes.length];
    
    let modeName = '顺序播放';
    if (this.playMode === 'loop') modeName = '单曲循环';
    if (this.playMode === 'random') modeName = '随机播放';
    
    uni.showToast({ title: modeName, icon: 'none' });
  },

  async setSongAndPlay(song) {
    if (!song) return;

    this.currentTime = 0;
    this.duration = 0;
    this.lyric = [];

    this.currentSong = song;
    this.isPlaying = false;

    if (!this.currentSong.ar && this.currentSong.artists) this.currentSong.ar = this.currentSong.artists;
    if (!this.currentSong.al && this.currentSong.album) this.currentSong.al = this.currentSong.album;

    // --- 1. Fetch Audio URL and play ---
    const playAudio = async () => {
      if (this.currentSong.url) {
        this._playAudio(this.currentSong.url);
        return;
      }
      uni.showLoading({ title: '加载音频...' });
      try {
        const res = await getSongUrl(this.currentSong.id);
        if (res.data && res.data.url) {
          this._playAudio(res.data.url);
        } else {
          uni.showToast({ title: '无法获取播放地址', icon: 'none' });
        }
      } catch (error) {
        console.error(error);
        uni.showToast({ title: '播放出错', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    };
    playAudio();

    // --- 2. Fetch Lyrics ---
    getLyric(song.id).then(res => {
      let lrcText = '';
      if (res?.data?.lrc?.lyric) lrcText = res.data.lrc.lyric;
      else if (res?.lrc?.lyric) lrcText = res.lrc.lyric;
      else if (res?.data?.lrc) lrcText = res.data.lrc;
      else if (res?.lrc) lrcText = res.lrc;

      if (typeof lrcText === 'string' && lrcText) {
        this.lyric = parseLyric(lrcText);
      }
    }).catch(err => {
      console.error("Failed to fetch lyric:", err);
    });

    // --- 3. Fetch Cover if needed ---
    const hasCover = this.currentSong.al?.picUrl || this.currentSong.picUrl || this.currentSong.cover_url || this.currentSong.pic;
    if (!hasCover) {
      getSongCover(song.id).then(res => {
        if (res.data && res.data.picUrl) {
          if (!this.currentSong.al) this.currentSong.al = {};
          this.currentSong.al.picUrl = res.data.picUrl;
        }
      }).catch(err => {
        console.error('Failed to fetch cover:', err);
      });
    }
  },

  _playAudio(url) {
    if (url && url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }

    audioManager.src = url;
    audioManager.title = this.currentSong.name || '未知歌曲';
    let singer = '未知歌手';
    if (this.currentSong.ar_name) {
        singer = this.currentSong.ar_name;
    } else if (this.currentSong.ar) {
        singer = this.currentSong.ar.map(a => a.name).join('/');
    }
    audioManager.singer = singer;

    let cover = this.currentSong.al?.picUrl || this.currentSong.picUrl || this.currentSong.cover_url || this.currentSong.pic || '';
    if (cover && cover.startsWith('http://')) {
        cover = cover.replace('http://', 'https://');
    }
    audioManager.coverImgUrl = cover;

    if (userStore.isLoggedIn) {
      savePlayHistory({
        song_id: this.currentSong.id
      }).catch(err => console.error('Save history failed:', err));
    }
  },

  play() {
    if (this.currentSong && audioManager.src) {
      audioManager.play();
    } else if (this.currentSong) {
      this.setSongAndPlay(this.currentSong);
    }
  },

  pause() {
    audioManager.pause();
  },

  seek(time) {
    if (this.duration > 0) {
      audioManager.seek(time);
    }
  },

  playNext(isAuto = false) {
    if (this.playlist.length === 0) return;
    if (this.playMode === 'loop' && isAuto) {
      this.setSongAndPlay(this.currentSong);
      return;
    }
    if (this.playMode === 'random') {
      const randomIndex = Math.floor(Math.random() * this.playlist.length);
      this.setSongAndPlay(this.playlist[randomIndex]);
      return;
    }
    const currentIndex = this.playlist.findIndex(s => s.id === this.currentSong?.id);
    let nextIndex = 0;
    if (currentIndex !== -1) {
      nextIndex = (currentIndex + 1) % this.playlist.length;
    }
    this.setSongAndPlay(this.playlist[nextIndex]);
  },

  playPrev() {
    if (this.playlist.length === 0) return;
    if (this.playMode === 'random') {
      const randomIndex = Math.floor(Math.random() * this.playlist.length);
      this.setSongAndPlay(this.playlist[randomIndex]);
      return;
    }
    const currentIndex = this.playlist.findIndex(s => s.id === this.currentSong?.id);
    let prevIndex = 0;
    if (currentIndex !== -1) {
      prevIndex = (currentIndex - 1 + this.playlist.length) % this.playlist.length;
    }
    this.setSongAndPlay(this.playlist[prevIndex]);
  },
  
  setPlaylist(songs) {
    this.playlist = JSON.parse(JSON.stringify(songs));
  },
  
  updateWidgetPosition(x, y) {
    this.widgetPosition.x = x;
    this.widgetPosition.y = y;
  }
});

audioManager.onPlay(() => playerStore.isPlaying = true);
audioManager.onPause(() => playerStore.isPlaying = false);
audioManager.onStop(() => { 
  playerStore.isPlaying = false; 
  playerStore.currentTime = 0;
});
audioManager.onEnded(() => playerStore.playNext(true));
audioManager.onTimeUpdate(() => {
  playerStore.currentTime = audioManager.currentTime;
  if (audioManager.duration && playerStore.duration !== audioManager.duration) {
    playerStore.duration = audioManager.duration;
  }
});
audioManager.onError((err) => {
  console.error('Audio Error:', err);
  playerStore.isPlaying = false;
  uni.showToast({ title: '音频播放错误', icon: 'none' });
});
audioManager.onCanplay(() => {
    if(audioManager.duration) {
        playerStore.duration = audioManager.duration;
    }
});
