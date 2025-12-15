<template>
  <view class="search-container">
    <!-- 顶部搜索栏 -->
    <view class="search-header">
      <view class="input-wrapper">
        <text class="search-icon">🔍</text>
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
            v-for="tag in hotTags"
            :key="tag"
            @click="searchTag(tag)"
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
          >
            <text class="history-text">{{ item }}</text>
            <text class="delete-item" @click.stop="deleteHistoryItem(index)">×</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索后：结果列表 -->
    <block v-else>
      <view v-if="loading" class="status-text">搜索中...</view>
      <view v-if="!loading && songList.length === 0" class="status-text">未找到相关歌曲</view>

      <scroll-view scroll-y class="result-list" v-if="songList.length > 0">
        <view
          class="song-item"
          v-for="(song, index) in songList"
          :key="song.id"
          @click="playSong(song)"
        >
          <view class="song-index">{{ index + 1 }}</view>
          <view class="song-info">
            <text class="song-name">{{ song.name }}</text>
            <text class="song-detail">
              {{ song.artists.map(a => a.name).join('/') }} - {{ song.album.name }}
            </text>
          </view>
          <view class="action-icon">▶</view>
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
  min-height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;
}

/* 顶部搜索栏 */
.search-header {
  display: flex;
  align-items: center;
  padding: 30rpx;
  /* 大幅增加顶部距离：80rpx + 安全距离 */
  padding-top: calc(80rpx + env(safe-area-inset-top));
  background-color: #1a1a1a;
}
.input-wrapper {
  flex: 1;
  position: relative;
  background-color: #2a2a2a;
  border-radius: 60rpx; /* 更大的圆角 */
  padding: 15rpx 30rpx;
  display: flex;
  align-items: center;
  border: 1px solid #444;
  transition: all 0.3s;
  animation: glow-breathing 2s ease-in-out infinite;
}
.input-wrapper:focus-within {
  border-color: #00f2ea;
  box-shadow: 0 0 20px rgba(0, 242, 234, 0.6); /* 更强的辉光 */
  animation: none;
}
@keyframes glow-breathing {
  0%, 100% { box-shadow: 0 0 5px rgba(0, 242, 234, 0.2); }
  50% { box-shadow: 0 0 15px rgba(0, 242, 234, 0.5); }
}
.search-icon {
  color: #666;
  margin-right: 20rpx;
  font-size: 36rpx; /* 图标加大 */
}
.search-input {
  flex: 1;
  color: #fff;
  font-size: 34rpx; /* 字体加大 */
  height: 80rpx; /* 高度加大 */
}
.clear-icon {
  color: #999;
  font-size: 44rpx;
  padding: 0 15rpx;
}
.cancel-btn {
  margin-left: 25rpx;
  color: #fff;
  font-size: 34rpx; /* 字体加大 */
}

/* 预搜索内容 */
.pre-search-content {
  padding: 40rpx 30rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #eee;
  margin-bottom: 30rpx;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.tag {
  padding: 10rpx 25rpx;
  background-color: #2a2a2a;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #ccc;
  border: 1px solid #444;
}

.search-history {
  margin-top: 60rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.clear-history {
  font-size: 24rpx;
  color: #666;
}
.history-list {
  margin-top: 10rpx;
}
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #2a2a2a;
}
.history-text {
  font-size: 28rpx;
  color: #aaa;
}
.delete-item {
  font-size: 32rpx;
  color: #666;
  padding: 0 10rpx;
}

/* 搜索后内容 */
.status-text {
  text-align: center;
  margin-top: 50rpx;
  color: #666;
}
.result-list {
  flex: 1;
  height: 0;
  padding: 20rpx;
}
.song-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #2a2a2a;
}
.song-index {
  width: 60rpx;
  text-align: center;
  color: #666;
  font-size: 30rpx;
}
.song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 20rpx;
  overflow: hidden;
}
.song-name {
  font-size: 30rpx;
  color: #fff;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-detail {
  font-size: 24rpx;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.action-icon {
  padding: 0 20rpx;
  color: #00f2ea;
  font-size: 32rpx;
}
</style>
