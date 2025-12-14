<template>
  <view class="player-container">
    <!-- 背景 -->
    <image :src="playerStore.currentSong?.al?.picUrl" class="bg-image" mode="aspectFill"></image>
    <view class="bg-mask"></view>

    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="back-icon" @click="goBack">‹</view>
      <view class="title">
        <text>{{ playerStore.currentSong?.name }}</text>
        <text class="artist">{{ playerStore.currentSong?.ar?.map(a => a.name).join('/') }}</text>
      </view>
      <view class="share-icon">···</view>
    </view>

    <!-- 封面/歌词切换区域 -->
    <swiper
      class="content-swiper"
      :current="swiperIndex"
      @change="swiperIndex = $event.detail.current"
      duration="300"
    >
      <!-- 第一页：封面 -->
      <swiper-item @click="swiperIndex = 1">
        <view class="cover-section">
          <image
            :src="playerStore.currentSong?.al?.picUrl"
            class="cover-image"
            :class="{ playing: playerStore.isPlaying }"
            mode="aspectFit"
          ></image>
        </view>
      </swiper-item>

      <!-- 第二页：歌词 -->
      <swiper-item @click="swiperIndex = 0">
        <scroll-view
          scroll-y
          class="lyric-section"
          :scroll-top="lyricScrollTop"
          scroll-with-animation
        >
          <!-- 顶部占位，让第一句歌词能显示在中间 -->
          <view class="lyric-placeholder"></view>

          <view v-if="lyric.length === 0" class="lyric-line debug-info">
            {{ debugMsg || '纯音乐，请欣赏' }}
          </view>

          <view
            class="lyric-line"
            :class="{ active: index === lyricIndex }"
            v-for="(line, index) in lyric"
            :key="index"
          >
            {{ line.text }}
          </view>

          <!-- 底部占位 -->
          <view class="lyric-placeholder"></view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 分页指示点 -->
    <view class="dots-container">
      <view class="dot" :class="{ active: swiperIndex === 0 }"></view>
      <view class="dot" :class="{ active: swiperIndex === 1 }"></view>
    </view>

    <!-- 进度条 -->
    <view class="progress-section">
      <text>{{ formatTime(playerStore.currentTime) }}</text>
      <slider
        class="progress-slider"
        :value="progress"
        @changing="onSliderChanging"
        @change="onSliderChange"
        activeColor="#00f2ea"
        backgroundColor="rgba(255,255,255,0.3)"
        block-size="12"
        block-color="#fff"
      ></slider>
      <text>{{ formatTime(playerStore.duration) }}</text>
    </view>

    <!-- 控制按钮 -->
    <view class="controls-section">
      <view class="btn loop-btn" @click="playerStore.togglePlayMode()">
        <text v-if="playerStore.playMode === 'sequence'">🔁</text>
        <text v-if="playerStore.playMode === 'loop'">🔂</text>
        <text v-if="playerStore.playMode === 'random'">🔀</text>
      </view>
      <view class="btn prev-btn" @click="playerStore.playPrev()">⏪</view>
      <view class="btn play-pause-btn" @click="togglePlayPause">
        {{ playerStore.isPlaying ? '❚❚' : '▶' }}
      </view>
      <view class="btn next-btn" @click="playerStore.playNext()">⏩</view>
      <view class="btn playlist-btn">☰</view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { playerStore } from '@/store/player.js';
import { getLyric } from '@/api/music.js';

const swiperIndex = ref(0);
const lyric = ref([]);
const lyricIndex = ref(0);
const lyricScrollTop = ref(0);
const debugMsg = ref('');
let isSeeking = false;

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
  sliderValue = e.detail.value;
};

const onSliderChange = (e) => {
  const newTime = (e.detail.value / 100) * playerStore.duration;
  playerStore.seek(newTime);
  isSeeking = false;
};

let stopWatch = null;
onShow(() => {
  fetchLyric(playerStore.currentSong?.id);
  stopWatch = watch(() => playerStore.currentTime, (newTime) => {
    if (isSeeking || lyric.value.length === 0) return;

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
      // 调整滚动位置，让高亮行位于屏幕中间 (假设容器高度的一半减去行高的一半)
      // 300px (容器半高) - 32px (行半高) = 268px
      lyricScrollTop.value = Math.max(0, newIndex * 64 - 200);
    }
  });
});

onUnload(() => {
  if (stopWatch) stopWatch();
});

watch(() => playerStore.currentSong?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchLyric(newId);
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
</script>

<style scoped>
.player-container { display: flex; flex-direction: column; height: 100vh; color: #fff; position: relative; }
.bg-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; filter: blur(50px); transform: scale(1.5); }
.bg-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: -1; }
.nav-bar { display: flex; align-items: center; padding: 0 30rpx; height: 88rpx; padding-top: var(--status-bar-height); z-index: 10; }
.back-icon { font-size: 50rpx; width: 80rpx; font-weight: bold; }
.title { flex: 1; text-align: center; overflow: hidden; }
.title text { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.artist { font-size: 24rpx; color: #ccc; }
.share-icon { font-size: 40rpx; width: 80rpx; text-align: right; }

.content-swiper { flex: 1; height: 0; /* 关键：配合flex:1使用 */ }
.cover-section { display: flex; justify-content: center; align-items: center; height: 100%; }
.cover-image { width: 500rpx; height: 500rpx; border-radius: 50%; border: 8rpx solid rgba(255,255,255,0.1); animation: rotate 20s linear infinite; animation-play-state: paused; }
.cover-image.playing { animation-play-state: running; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.lyric-section { height: 100%; text-align: center; }
.lyric-placeholder { height: 50%; } /* 占位，允许首尾歌词滚到中间 */
.lyric-line {
  min-height: 64rpx;
  line-height: 1.5;
  padding: 16rpx 40rpx;
  color: rgba(255,255,255,0.6);
  font-size: 30rpx;
  transition: all 0.3s;
}
.lyric-line.active {
  color: #00f2ea;
  font-size: 36rpx;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 242, 234, 0.5);
}
.debug-info { color: #aaa; font-size: 28rpx; margin-top: 200rpx; }

.dots-container { display: flex; justify-content: center; padding: 20rpx; gap: 15rpx; }
.dot { width: 12rpx; height: 12rpx; border-radius: 50%; background-color: rgba(255,255,255,0.3); transition: all 0.3s; }
.dot.active { background-color: #00f2ea; width: 30rpx; border-radius: 10rpx; }

.progress-section { display: flex; align-items: center; padding: 0 30rpx; font-size: 22rpx; color: #ccc; margin-bottom: 10rpx; }
.progress-slider { flex: 1; margin: 0 20rpx; }

.controls-section { display: flex; justify-content: space-around; align-items: center; padding: 30rpx; padding-bottom: calc(40rpx + var(--safe-area-inset-bottom)); }
.btn { font-size: 40rpx; color: #eee; text-align: center; }
.loop-btn { width: 80rpx; }
.play-pause-btn { width: 120rpx; height: 120rpx; line-height: 120rpx; border: 2px solid #eee; border-radius: 50%; font-size: 50rpx; }
</style>
