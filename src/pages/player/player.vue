<template>
  <view class="player-container">
    <!-- 背景层 -->
    <image :src="coverUrl" class="bg-image" mode="aspectFill"></image>
    <view class="bg-mask"></view>
    <view class="bg-noise"></view>

    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <view class="icon i-back"></view>
      </view>
      <view class="title-area">
        <text class="song-title">{{ playerStore.currentSong?.name || '未知歌曲' }}</text>
        <text class="singer-name">{{ getArtistName(playerStore.currentSong) }}</text>
      </view>
      <view class="right-placeholder"></view>
    </view>

    <!-- 中间内容区 -->
    <swiper
      class="content-swiper"
      :current="swiperIndex"
      @change="swiperIndex = $event.detail.current"
      duration="400"
    >
      <!-- 封面页 -->
      <swiper-item>
        <view class="cover-wrapper">
          <view class="cover-glow" :class="{ playing: playerStore.isPlaying }"></view>
          <view class="cover-disc" :class="{ playing: playerStore.isPlaying }">
            <image :src="coverUrl" class="cover-image" mode="aspectFill"></image>
            <view class="disc-center"></view>
          </view>
        </view>
      </swiper-item>

      <!-- 歌词页 -->
      <swiper-item>
        <scroll-view
          scroll-y
          class="lyric-scroll"
          :scroll-into-view="`lyric-line-${Math.max(0, lyricIndex - 1)}`"
          scroll-with-animation
          @touchstart="isUserScrolling = true"
          @touchend="resumeAutoScroll"
        >
          <!-- 顶部不需要大 padding，只需要一点点留白 -->
          <view style="height: 40rpx;"></view>

          <view v-if="lyric.length === 0" class="lyric-line no-lyric">
            {{ debugMsg || '纯音乐，请欣赏' }}
          </view>
          <view
            v-for="(line, index) in lyric"
            :key="index"
            :id="`lyric-line-${index}`"
            class="lyric-line"
            :class="{ active: index === lyricIndex }"
            @click="seekToLyric(line.time)"
          >
            {{ line.text }}
          </view>

          <!-- 底部留白，确保最后一行能滚上来 -->
          <view style="height: 50vh;"></view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 底部控制区 -->
    <view class="footer-area">
      <!-- 进度条 -->
      <view class="progress-container">
        <text class="time-text">{{ formatTime(playerStore.currentTime) }}</text>
        <view class="slider-wrapper">
          <slider
            class="custom-slider"
            :value="progress"
            @changing="onSliderChanging"
            @change="onSliderChange"
            activeColor="#00f2ea"
            backgroundColor="rgba(255,255,255,0.15)"
            block-size="16"
            block-color="#fff"
          />
        </view>
        <text class="time-text">{{ formatTime(playerStore.duration) }}</text>
      </view>

      <!-- 核心控制按钮 -->
      <view class="controls-grid">
        <!-- 模式切换 -->
        <view class="ctrl-btn mode-btn" @click="playerStore.togglePlayMode()">
          <view class="icon i-mode-loop" v-if="playerStore.playMode === 'sequence'"></view>
          <view class="icon i-mode-one" v-if="playerStore.playMode === 'loop'"></view>
          <view class="icon i-mode-random" v-if="playerStore.playMode === 'random'"></view>
        </view>

        <!-- 上一首 -->
        <view class="ctrl-btn prev-btn" @click="playerStore.playPrev()">
          <view class="icon i-prev"></view>
        </view>

        <!-- 播放/暂停 (C位) -->
        <view class="play-pause-wrapper" @click="togglePlayPause">
          <view class="play-pause-btn" :class="{ playing: playerStore.isPlaying }">
            <view class="icon" :class="playerStore.isPlaying ? 'i-pause' : 'i-play'"></view>
          </view>
        </view>

        <!-- 下一首 -->
        <view class="ctrl-btn next-btn" @click="playerStore.playNext()">
          <view class="icon i-next"></view>
        </view>

        <!-- 收藏按钮 -->
        <view class="ctrl-btn fav-btn" @click="showAddToPlaylist">
          <view class="icon i-heart"></view>
        </view>
      </view>
    </view>

    <!-- 收藏到歌单弹窗 -->
    <view class="modal-mask" v-if="isFavModalVisible" @click="isFavModalVisible = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">收藏到歌单</text>
        <scroll-view scroll-y class="playlist-scroll">
          <view
            class="playlist-item"
            v-for="pl in myPlaylists"
            :key="pl.id"
            @click="addToPlaylist(pl.id)"
          >
            <image :src="pl.cover_url || '/static/default-avatar.png'" class="pl-cover" mode="aspectFill"></image>
            <view class="pl-info">
              <text class="pl-name">{{ pl.name }}</text>
              <text class="pl-count">{{ pl.song_count || 0 }} 首</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { playerStore } from '@/store/player.js';
import { userStore } from '@/store/user.js';
import { getLyric, getSongCover } from '@/api/music.js';
import { getUserPlaylists, addSongToPlaylist } from '@/api/playlist.js';

const swiperIndex = ref(0);
const lyric = ref([]);
const lyricIndex = ref(0);
const debugMsg = ref('');
let isSeeking = false;
const coverUrl = ref('/static/default-avatar.png');

const isFavModalVisible = ref(false);
const myPlaylists = ref([]);
const isUserScrolling = ref(false);
let userScrollTimer = null;

const fetchCover = async (song) => {
  if (!song || !song.id) return;

  const existingCover = song.al?.picUrl || song.cover_url;
  if (existingCover) {
    coverUrl.value = existingCover;
    return;
  }

  try {
    const res = await getSongCover(song.id);
    if (res.data && res.data.picUrl) {
      coverUrl.value = res.data.picUrl;
      if (playerStore.currentSong && playerStore.currentSong.id === song.id) {
        if (!playerStore.currentSong.al) playerStore.currentSong.al = {};
        playerStore.currentSong.al.picUrl = res.data.picUrl;
      }
    }
  } catch (error) {
    console.error('Fetch cover failed:', error);
  }
};

const getArtistName = (song) => {
  if (!song) return '';
  if (song.ar) return song.ar.map(a => a.name).join('/');
  if (song.artists) return song.artists.map(a => a.name).join('/');
  if (song.artist) return song.artist;
  return '未知歌手';
};

const fetchLyric = async (id) => {
  if (!id) return;
  lyric.value = [];
  debugMsg.value = '';

  try {
    const res = await getLyric(id);
    let lrcText = '';
    if (res?.data?.lrc) lrcText = res.data.lrc;
    else if (res?.lrc) lrcText = res.lrc;
    else if (res?.lrc?.lyric) lrcText = res.lrc.lyric;
    else if (res?.data?.lrc?.lyric) lrcText = res.data.lrc.lyric;

    if (typeof lrcText !== 'string') {
        lrcText = JSON.stringify(lrcText);
        if (lrcText === '{}' || lrcText === 'null') lrcText = '';
    }

    if (lrcText) {
      lyric.value = parseLyric(lrcText);
    } else {
      debugMsg.value = '暂无歌词';
    }
  } catch (error) {
    console.error("Failed to fetch lyric:", error);
    debugMsg.value = '歌词加载失败';
  }
};

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

const progress = computed(() => {
  if (isSeeking) return sliderValue.value;
  return playerStore.duration > 0 ? (playerStore.currentTime / playerStore.duration) * 100 : 0;
});

let sliderValue = 0;
const onSliderChanging = (e) => {
  isSeeking = true;
  isUserScrolling.value = true;
  sliderValue = e.detail.value;
};

const onSliderChange = (e) => {
  const newTime = (e.detail.value / 100) * playerStore.duration;
  playerStore.seek(newTime);
  isSeeking = false;
  resumeAutoScroll();
};

const seekToLyric = (time) => {
  if (time >= 0) {
    playerStore.seek(time);
    if (!playerStore.isPlaying) {
      playerStore.play();
    }
    isUserScrolling.value = false;
    uni.showToast({ title: '已跳转', icon: 'none', duration: 1000 });
  }
};

const resumeAutoScroll = () => {
  if (userScrollTimer) clearTimeout(userScrollTimer);
  userScrollTimer = setTimeout(() => {
    isUserScrolling.value = false;
  }, 2000);
};

let stopWatch = null;
onShow(() => {
  const song = playerStore.currentSong;
  fetchLyric(song?.id);
  fetchCover(song);

  stopWatch = watch(() => playerStore.currentTime, (newTime) => {
    if (isSeeking || lyric.value.length === 0 || isUserScrolling.value) return;

    let newIndex = -1;
    for (let i = 0; i < lyric.value.length; i++) {
        if (lyric.value[i].time > newTime) {
            newIndex = i - 1;
            break;
        }
    }
    if (newIndex === -1 && lyric.value.length > 0 && newTime > lyric.value[lyric.value.length-1].time) {
        newIndex = lyric.value.length - 1;
    }
    if (newIndex < 0) newIndex = 0;

    if (lyricIndex.value !== newIndex) {
      lyricIndex.value = newIndex;
      // 纯 CSS 滚动，不需要手动计算 scrollTop
    }
  });
});

onUnload(() => {
  if (stopWatch) stopWatch();
});

watch(() => playerStore.currentSong?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchLyric(newId);
    fetchCover(playerStore.currentSong);
  }
});

const togglePlayPause = () => {
  if (playerStore.isPlaying) playerStore.pause();
  else playerStore.play();
};

const goBack = () => uni.navigateBack();

const formatTime = (time = 0) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const showAddToPlaylist = async () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 1000);
    return;
  }

  uni.showLoading({ title: '加载歌单...' });
  try {
    const res = await getUserPlaylists();
    if (res.code === 200 && res.playlists) {
      myPlaylists.value = res.playlists;
      isFavModalVisible.value = true;
    } else {
      uni.showToast({ title: '获取歌单失败', icon: 'none' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    uni.hideLoading();
  }
};

const addToPlaylist = async (playlistId) => {
  uni.showLoading({ title: '添加中...' });
  try {
    const res = await addSongToPlaylist(playlistId, { song_id: playerStore.currentSong.id });
    if (res.code === 200) {
      uni.showToast({ title: '已收藏', icon: 'success' });
      isFavModalVisible.value = false;
    } else {
      uni.showToast({ title: res.message || '收藏失败', icon: 'none' });
    }
  } catch (error) {
    console.error(error);
    uni.showToast({ title: '请求失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};
</script>

<style scoped>
/* ... (样式部分保持不变) ... */
.player-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #fff;
  position: relative;
  background-color: #000;
  overflow: hidden;
}

/* 背景 */
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  filter: blur(80px);
  transform: scale(1.2);
  opacity: 0.5;
}
.bg-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(0,0,0,0.2), rgba(0,0,0,0.9));
  z-index: 2;
}
.bg-noise {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* 导航栏 */
.nav-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  height: 100rpx;
  padding-top: calc(60rpx + env(safe-area-inset-top));
}
.back-btn, .right-placeholder {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}
.song-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
.singer-name {
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 6rpx;
}

/* 中间内容 */
.content-swiper {
  position: relative;
  z-index: 10;
  flex: 1;
  height: 0;
}

/* 封面样式 */
.cover-wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.cover-glow {
  position: absolute;
  width: 500rpx;
  height: 500rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 242, 234, 0.2), transparent 70%);
  opacity: 0;
  transition: opacity 1s;
}
.cover-glow.playing {
  opacity: 1;
  animation: pulse 3s infinite;
}
.cover-disc {
  width: 560rpx;
  height: 560rpx;
  border-radius: 50%;
  background: #111;
  border: 12rpx solid rgba(255,255,255,0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
  position: relative;
  animation: rotate 24s linear infinite;
  animation-play-state: paused;
}
.cover-disc.playing {
  animation-play-state: running;
}
.cover-image {
  width: 380rpx;
  height: 380rpx;
  border-radius: 50%;
  border: 4rpx solid #000;
}
.disc-center {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  background: #000;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.2);
  z-index: 5;
}

@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.2; } 100% { transform: scale(1); opacity: 0.5; } }

/* 歌词样式优化 */
.lyric-scroll {
  height: 100%;
  text-align: center;
  scroll-behavior: smooth;
  /* 关键：移除大 padding，使用 spacer */
}
.lyric-line {
  min-height: 100rpx; /* 加大行高 */
  line-height: 1.8;
  padding: 15rpx 40rpx;
  color: #999;
  font-size: 36rpx; /* 加大字号 */
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.lyric-line.active {
  color: #00f2ea;
  font-size: 50rpx; /* 高亮字号 */
  font-weight: bold;
  text-shadow: 0 0 15px rgba(0, 242, 234, 0.5);
  transform: scale(1.05);
}
.no-lyric { color: #888; margin-top: 200rpx; }

/* 底部控制区 */
.footer-area {
  position: relative;
  z-index: 10;
  padding: 0 40rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}

.progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 50rpx;
}
.time-text {
  font-size: 22rpx;
  color: rgba(255,255,255,0.6);
  width: 80rpx;
  text-align: center;
  font-family: monospace;
}
.slider-wrapper {
  flex: 1;
  margin: 0 20rpx;
}
.custom-slider {
  margin: 0;
}

/* 按钮网格 */
.controls-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40rpx;
}

.ctrl-btn {
  width: 90rpx;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.2s;
  font-size: 40rpx;
}
.ctrl-btn:active {
  background-color: rgba(255,255,255,0.15);
  transform: scale(0.95);
}

/* 播放按钮特写 */
.play-pause-wrapper {
  width: 140rpx;
  height: 140rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.play-pause-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f2ea, #00c2b8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0, 242, 234, 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-size: 50rpx;
  color: #121212;
}
.play-pause-btn:active {
  transform: scale(0.9);
  box-shadow: 0 0 10px rgba(0, 242, 234, 0.2);
}
.play-pause-btn.playing {
  box-shadow: 0 0 30px rgba(0, 242, 234, 0.6);
}
.play-pause-btn .icon.i-play {
  margin-left: 8rpx;
}

.icon-prev {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 14rpx 20rpx 14rpx 0;
  border-color: transparent #fff transparent transparent;
  position: relative;
}
.icon-prev::after {
  content: '';
  position: absolute;
  left: -6rpx;
  top: -14rpx;
  width: 4rpx;
  height: 28rpx;
  background-color: #fff;
}

.icon-next {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 14rpx 0 14rpx 20rpx;
  border-color: transparent transparent transparent #fff;
  position: relative;
}
.icon-next::after {
  content: '';
  position: absolute;
  right: -6rpx;
  top: -14rpx;
  width: 4rpx;
  height: 28rpx;
  background-color: #fff;
}

.icon-mode {
  width: 30rpx;
  height: 20rpx;
  border: 3rpx solid #ccc;
  border-radius: 6rpx;
  position: relative;
}
.icon-mode.loop::after {
  content: '1';
  position: absolute;
  font-size: 16rpx;
  color: #ccc;
  top: 0;
  left: 8rpx;
}
.icon-mode.random {
  border: none;
  background: transparent;
}
.icon-mode.random::before, .icon-mode.random::after {
  content: '';
  position: absolute;
  width: 30rpx;
  height: 3rpx;
  background: #ccc;
  top: 8rpx;
  transform: rotate(20deg);
}
.icon-mode.random::after {
  transform: rotate(-20deg);
}

.icon-heart {
  width: 24rpx;
  height: 24rpx;
  background-color: #ccc;
  transform: rotate(45deg);
  position: relative;
  margin-top: 6rpx;
}
.icon-heart::before, .icon-heart::after {
  content: '';
  width: 24rpx;
  height: 24rpx;
  background-color: #ccc;
  border-radius: 50%;
  position: absolute;
}
.icon-heart::before { left: -12rpx; }
.icon-heart::after { top: -12rpx; }

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  width: 80%;
  max-height: 60%;
  background-color: #2a2a2a;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
}
.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 30rpx;
  text-align: center;
}
.playlist-scroll {
  flex: 1;
  height: 0;
  min-height: 400rpx;
}
.playlist-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #333;
}
.pl-cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
}
.pl-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.pl-name {
  font-size: 30rpx;
  color: #fff;
}
.pl-count {
  font-size: 24rpx;
  color: #888;
}
</style>
