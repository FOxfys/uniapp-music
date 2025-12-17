<template>
  <view class="search-container">
    <view class="bg-gradient"></view>
    <view class="bg-noise"></view>

    <!-- 顶部搜索栏 -->
    <view class="search-header">
      <view class="input-wrapper">
        <view class="icon i-search"></view>
        <input
          class="search-input"
          type="text"
          confirm-type="search"
          v-model="keyword"
          placeholder="搜索歌曲、歌手"
          focus
          @confirm="doSearch"
          @input="onInput"
        />
        <text v-if="keyword" class="clear-icon" @click="clearKeyword">×</text>
        <view class="input-glow"></view>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索前：热门搜索 & 历史记录 -->
    <view class="pre-search-content" v-if="!hasSearched">
      <!-- 热门搜索 -->
      <view class="hot-search">
        <h3 class="section-title">热门搜索</h3>
        <view class="tag-cloud">
          <text
            class="tag"
            v-for="(tag, index) in hotTags"
            :key="tag"
            @click="searchTag(tag)"
            :style="{ animationDelay: index * 0.05 + 's' }"
          >{{ tag }}</text>
        </view>
      </view>

      <!-- 搜索历史 -->
      <view class="search-history" v-if="historyList.length > 0">
        <view class="section-header">
          <h3 class="section-title">搜索历史</h3>
          <text class="clear-history" @click="clearHistory">清空</text>
        </view>
        <view class="history-list">
          <view
            class="history-item"
            v-for="(item, index) in historyList"
            :key="index"
            @click="searchTag(item)"
            :style="{ animationDelay: index * 0.05 + 's' }"
          >
            <view class="history-icon">🕒</view>
            <text class="history-text">{{ item }}</text>
            <text class="delete-item" @click.stop="deleteHistoryItem(index)">×</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索后：结果列表 -->
    <block v-else>
      <view v-if="loading" class="status-text">
        <view class="loading-dot"></view>
        <view class="loading-dot"></view>
        <view class="loading-dot"></view>
      </view>
      <view v-if="!loading && songList.length === 0" class="status-text">未找到相关歌曲</view>

      <scroll-view scroll-y class="result-list" v-if="songList.length > 0">
        <view
          class="song-item"
          v-for="(song, index) in songList"
          :key="song.id"
          @click="playSong(song)"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <view class="song-index">{{ String(index + 1).padStart(2, '0') }}</view>
          <view class="song-info">
            <text class="song-name">{{ song.name }}</text>
            <text class="song-detail">
              {{ song.artists.map(a => a.name).join('/') }} - {{ song.album.name }}
            </text>
          </view>
        </view>
      </scroll-view>
    </block>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { searchMusic } from '@/api/music.js';
import { playerStore } from '@/store/player.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const keyword = ref('');
const songList = ref([]);
const loading = ref(false);
const hasSearched = ref(false);
const historyList = ref([]);
const hotTags = ref(['周杰伦', '陈奕迅', '林俊杰', 'Taylor Swift', 'golden hour', '电子', '纯音乐']);

onMounted(() => {
  const history = uni.getStorageSync('searchHistory');
  if (history) {
    historyList.value = history;
  }
});

const goBack = () => uni.navigateBack();

const onInput = () => {
  if (keyword.value === '') {
    hasSearched.value = false;
  }
};

const clearKeyword = () => {
  keyword.value = '';
  hasSearched.value = false;
};

const doSearch = async () => {
  const searchKeyword = keyword.value.trim();
  if (!searchKeyword) return;

  loading.value = true;
  hasSearched.value = true;
  songList.value = [];

  try {
    const res = await searchMusic({ name: searchKeyword });
    if (res.code === 200 && res.result && res.result.songs) {
      songList.value = res.result.songs;
    }
    saveHistory(searchKeyword);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const searchTag = (tag) => {
  keyword.value = tag;
  doSearch();
};

const playSong = (song) => {
  const songData = {
    id: song.id,
    name: song.name,
    ar: song.artists,
    al: song.album
  };
  playerStore.setPlaylist(songList.value);
  playerStore.setSongAndPlay(songData);
};

const saveHistory = (term) => {
  const index = historyList.value.indexOf(term);
  if (index !== -1) {
    historyList.value.splice(index, 1);
  }
  historyList.value.unshift(term);
  if (historyList.value.length > 10) {
    historyList.value.pop();
  }
  uni.setStorageSync('searchHistory', historyList.value);
};

const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清空所有搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        historyList.value = [];
        uni.removeStorageSync('searchHistory');
      }
    }
  });
};

const deleteHistoryItem = (index) => {
  historyList.value.splice(index, 1);
  uni.setStorageSync('searchHistory', historyList.value);
};
</script>

<style scoped>
.search-container {
  background-color: #121212;
  height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 动态背景 */
.bg-gradient {
  position: absolute;
  top: -20%;
  left: -20%;
  width: 140%;
  height: 140%;
  background: radial-gradient(circle at 50% 0%, #1a2a3a, #121212 60%);
  z-index: 0;
}
.bg-noise {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* 顶部搜索栏 */
.search-header {
  display: flex;
  align-items: center;
  padding: 30rpx;
  padding-top: calc(80rpx + env(safe-area-inset-top));
  position: relative;
  z-index: 10;
}
.input-wrapper {
  flex: 1;
  position: relative;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 60rpx;
  padding: 15rpx 30rpx;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}
.input-wrapper:focus-within {
  border-color: #00f2ea;
  box-shadow: 0 0 20px rgba(0, 242, 234, 0.3);
}
.input-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 60rpx;
  box-shadow: 0 0 10px rgba(0, 242, 234, 0.1);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.input-wrapper:focus-within .input-glow {
  opacity: 1;
}

.icon.i-search {
  color: #00f2ea;
  margin-right: 20rpx;
  font-size: 36rpx;
}
.search-input {
  flex: 1;
  color: #fff;
  font-size: 34rpx;
  height: 80rpx;
}
.clear-icon {
  color: rgba(255, 255, 255, 0.5);
  font-size: 44rpx;
  padding: 0 15rpx;
}
.cancel-btn {
  margin-left: 25rpx;
  color: rgba(255, 255, 255, 0.8);
  font-size: 34rpx;
}

/* 预搜索内容 */
.pre-search-content {
  padding: 40rpx 30rpx;
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 30rpx;
  border-left: 6rpx solid #00f2ea;
  padding-left: 20rpx;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.tag {
  padding: 12rpx 30rpx;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 40rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  opacity: 0;
  transform: scale(0.8);
}
.tag:active {
  background-color: rgba(0, 242, 234, 0.1);
  border-color: #00f2ea;
  color: #00f2ea;
  transform: scale(0.95);
}

@keyframes popIn {
  to { opacity: 1; transform: scale(1); }
}

.search-history {
  margin-top: 60rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.clear-history {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 30rpx;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20rpx;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideUp 0.4s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}
.history-item:active {
  background: rgba(255, 255, 255, 0.08);
}
.history-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
  opacity: 0.6;
}
.history-text {
  flex: 1;
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.9);
}
.delete-item {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.4);
  padding: 0 10rpx;
}

/* 搜索后内容 */
.status-text {
  text-align: center;
  margin-top: 100rpx;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  gap: 10rpx;
}
.loading-dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #00f2ea;
  border-radius: 50%;
  animation: bounce 0.6s infinite alternate;
}
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  to { transform: translateY(-10rpx); opacity: 0.5; }
}

.result-list {
  flex: 1;
  height: 0;
  padding: 20rpx;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}
.song-item {
  display: flex;
  align-items: center;
  padding: 25rpx 30rpx;
  margin-bottom: 15rpx;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20rpx;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  box-sizing: border-box;
}
@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}
.song-item:active {
  background: rgba(255, 255, 255, 0.08);
}
.song-index {
  width: 60rpx;
  text-align: center;
  color: #00f2ea;
  font-size: 32rpx;
  font-family: monospace;
  font-weight: bold;
  flex-shrink: 0; /* 防止序号被压缩 */
}
.song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 20rpx;
  overflow: hidden;
  min-width: 0; /* 关键：允许 flex item 缩小到内容以下 */
  margin-right: 10rpx;
}
.song-name {
  display: block;
  font-size: 32rpx;
  color: #fff;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-detail {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
