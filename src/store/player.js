import { reactive } from 'vue';
import { getSongUrl } from '../api/music.js';
import { savePlayHistory } from '../api/playlist.js';
import { userStore } from './user.js';

const audioManager = uni.getBackgroundAudioManager();

const sysInfo = uni.getSystemInfoSync();
const screenWidth = sysInfo.windowWidth;
const screenHeight = sysInfo.windowHeight;

export const playerStore = reactive({
  isPlaying: false,
  currentSong: null,
  playlist: [],
  currentTime: 0,
  duration: 0,
  playMode: 'sequence',
  
  widgetPosition: {
    x: screenWidth - 80,
    y: screenHeight - 150
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
    this.currentSong = song;
    this.isPlaying = false;
    
    if (!this.currentSong.ar && this.currentSong.artists) this.currentSong.ar = this.currentSong.artists;
    if (!this.currentSong.al && this.currentSong.album) this.currentSong.al = this.currentSong.album;

    uni.showLoading({ title: '加载音频...' });
    try {
      const res = await getSongUrl(this.currentSong.id);
      if (res.data && res.data.url) {
        audioManager.src = res.data.url;
        audioManager.title = this.currentSong.name || '未知歌曲';
        audioManager.singer = this.currentSong.ar ? this.currentSong.ar.map(a => a.name).join('/') : '未知歌手';
        audioManager.coverImgUrl = this.currentSong.al ? this.currentSong.al.picUrl : '';
        
        // 修复：只传递 song_id
        if (userStore.isLoggedIn) {
          savePlayHistory({
            song_id: this.currentSong.id
          }).catch(err => console.error('Save history failed:', err));
        }

      } else {
        uni.showToast({ title: '无法获取播放地址', icon: 'none' });
      }
    } catch (error) {
      console.error(error);
      uni.showToast({ title: '播放出错', icon: 'none' });
    } finally {
      uni.hideLoading();
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

// --- 事件监听 ---
audioManager.onPlay(() => playerStore.isPlaying = true);
audioManager.onPause(() => playerStore.isPlaying = false);
audioManager.onStop(() => { playerStore.isPlaying = false; });
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
