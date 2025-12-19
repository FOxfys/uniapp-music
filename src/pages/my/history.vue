<template>
  <view
    class="history-container"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <view class="custom-refresher" :style="{ height: refresherHeight + 'px' }">
      <view class="refresher-content" :class="{ refreshing: isRefreshing }">
        <view class="loading-gear">
          <view class="gear-inner"></view>
          <view class="gear-outer"></view>
        </view>
        <text class="refresher-text">{{ refresherText }}</text>
      </view>
    </view>

    <view class="page-wrapper" :style="{ transform: `translateY(${refresherHeight}px)` }">
      <view class="bg-noise"></view>

      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <view class="icon i-back"></view>
        </view>
        <text class="nav-title">播放历史</text>
      </view>

      <view class="header">
        <view class="title-group">
          <text class="main-title">HISTORY</text>
          <text class="sub-title">共 {{ totalSongs }} 首歌曲</text>
        </view>
        <view class="play-all-btn" @click="playAll">
          <view class="icon i-play"></view>
          <text>播放全部</text>
        </view>
      </view>

      <scroll-view scroll-y class="song-list" @scroll="onScroll">
        <view v-if="loading" class="loading-text">加载中...</view>
        <view v-else-if="songList.length === 0" class="empty-text">暂无播放记录</view>

        <view
          class="song-card"
          v-for="(song, index) in songList"
          :key="song.id"
          @click="playSong(song)"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <view class="card-bg"></view>
          <!-- 修复：使用动态计算的 pageSize 来显示序号 -->
          <view class="song-index">{{ String((currentPage - 1) * pageSize + index + 1).padStart(2, '0') }}</view>
          <view class="song-info">
            <text class="song-name">{{ song.name }}</text>
            <text class="song-detail">
              {{ song.artist }} - {{ song.album }}
            </text>
          </view>
          <text class="play-time">{{ formatPlayTime(song.play_time) }}</text>
        </view>
      </scroll-view>

      <!-- 分页控制器 -->
      <view class="pagination-controls" v-if="totalPages > 1">
        <view class="page-btn" :class="{ disabled: currentPage === 1 }" @click="changePage(currentPage - 1)">
          <view class="icon i-prev"></view>
        </view>
        <text class="page-info">{{ currentPage }} / {{ totalPages }}</text>
        <view class="page-btn" :class="{ disabled: currentPage === totalPages }" @click="changePage(currentPage + 1)">
          <view class="icon i-next"></view>
        </view>
      </view>
    </view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow, onHide } from '@dcloudio/uni-app';
import { getPlayHistory } from '@/api/playlist.js';
import { playerStore } from '@/store/player.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const songList = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const totalSongs = ref(0);
const pageSize = ref(20); // 默认每页20条，后续会根据后端返回动态调整

// 自定义下拉刷新相关
const refresherHeight = ref(0);
const refresherText = ref('下拉刷新');
const isRefreshing = ref(false);
let startY = 0;
let canRefresh = false;
let currentScrollTop = 0;

onShow(() => {
  fetchHistory(1);
  setTimeout(() => {
    playerStore.isWidgetVisible = true;
  }, 50);
});
onHide(() => {
  playerStore.isWidgetVisible = false;
});

const goBack = () => uni.navigateBack();

const fetchHistory = async (page) => {
  loading.value = true;
  try {
    // 尝试请求 100 条，但后端可能会限制返回数量
    const res = await getPlayHistory({ page: page, limit: 100 });
    if (res.code === 200 && res.history) {
      songList.value = res.history.map(item => ({
        id: item.song_id,
        name: item.name,
        artist: item.artist,
        album: item.album,
        play_time: item.play_time,
        ar: [{ name: item.artist }],
        al: { name: item.album, picUrl: item.cover_url || '' },
      }));
      currentPage.value = res.page;
      totalPages.value = res.total_pages;
      totalSongs.value = res.total;

      // 关键修复：动态计算真实的 pageSize
      // 如果总页数大于1，我们可以通过 总数/总页数 向上取整来估算每页大小
      if (res.total_pages > 0) {
        pageSize.value = Math.ceil(res.total / res.total_pages);
      } else if (res.history.length > 0) {
        // 如果只有一页，直接用当前长度作为 pageSize (虽然此时序号计算不受影响)
        pageSize.value = res.history.length;
      }
    }
  } catch (error) {
    console.error(error);
    uni.showToast({ title: '获取历史失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) {
    return;
  }
  fetchHistory(page);
};

const formatPlayTime = (timeStr) => {
  if (!timeStr) return '';
  const compatibleTimeStr = timeStr.replace(/-/g, '/');
  const date = new Date(compatibleTimeStr);
  const now = new Date();

  const diff = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diff / (1000 * 60));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}天前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const playSong = (song) => {
  playerStore.setPlaylist(songList.value);
  playerStore.setSongAndPlay(song);
};

const playAll = () => {
  if (songList.value.length > 0) {
    playSong(songList.value[0]);
  }
};

// --- 自定义下拉刷新逻辑 ---
const onScroll = (e) => {
  currentScrollTop = e.detail.scrollTop;
};

const onTouchStart = (e) => {
  if (currentScrollTop > 0 || isRefreshing.value) {
    canRefresh = false;
    return;
  }
  startY = e.touches[0].clientY;
  canRefresh = true;
};

const onTouchMove = (e) => {
  if (!canRefresh) return;
  const deltaY = e.touches[0].clientY - startY;
  if (deltaY > 0) {
    refresherHeight.value = Math.min(deltaY, 200);
    if (deltaY > 120) {
      refresherText.value = '松开刷新';
    } else {
      refresherText.value = '下拉刷新';
    }
  }
};

const onTouchEnd = async () => {
  if (!canRefresh) return;
  canRefresh = false;
  if (refresherHeight.value > 120) {
    isRefreshing.value = true;
    refresherHeight.value = 100;
    refresherText.value = '正在加载...';
    await fetchHistory(1); // 刷新总是回到第一页
    refresherText.value = '刷新完成';
    setTimeout(() => {
      refresherHeight.value = 0;
      isRefreshing.value = false;
    }, 500);
  } else {
    refresherHeight.value = 0;
  }
};
</script>

<style scoped>
.history-container {
  height: 100vh;
  overflow: hidden;
  position: relative;
}
.page-wrapper {
  background-color: #121212;
  height: 100%;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
  transition: transform 0.3s ease;
}

/* 自定义下拉刷新 */
.custom-refresher {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  background-color: #121212;
}
.refresher-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: env(safe-area-inset-top);
}
.loading-gear {
  width: 80rpx;
  height: 80rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gear-inner, .gear-outer {
  position: absolute;
  border-radius: 50%;
  border: 4rpx solid;
}
.gear-inner {
  width: 40rpx;
  height: 40rpx;
  border-color: #00f2ea;
  animation: rotate 2s linear infinite;
}
.gear-outer {
  width: 80rpx;
  height: 80rpx;
  border-color: rgba(0, 242, 234, 0.5);
  border-style: dashed;
  animation: rotate-reverse 3s linear infinite;
}
.refresher-content.refreshing .gear-inner { animation-duration: 1s; }
.refresher-content.refreshing .gear-outer { animation-duration: 1.5s; }

@keyframes rotate-reverse {
  to { transform: rotate(-360deg); }
}
@keyframes rotate {
  to { transform: rotate(360deg); }
}

.refresher-text {
  font-size: 24rpx;
  color: #888;
  margin-top: 20rpx;
  text-shadow: 0 0 10px rgba(0, 242, 234, 0.3);
}

/* ... (其他样式保持不变) ... */
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
.nav-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  height: 88rpx;
  padding-top: env(safe-area-inset-top);
}
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  font-size: 36rpx;
}
.nav-title { font-size: 32rpx; font-weight: bold; margin-left: 20rpx; }
.header {
  padding: 40rpx 30rpx;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  z-index: 1;
}
.main-title {
  font-size: 60rpx;
  font-weight: 900;
  color: #00f2ea;
  display: block;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(0, 242, 234, 0.3);
}
.sub-title {
  font-size: 24rpx;
  color: #888;
  margin-top: 10rpx;
  display: block;
}
.play-all-btn {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #00f2ea, #00c2b8);
  padding: 15rpx 30rpx;
  border-radius: 40rpx;
  box-shadow: 0 5px 15px rgba(0, 242, 234, 0.3);
}
.play-all-btn text {
  color: #121212;
  font-weight: bold;
  font-size: 28rpx;
}
.play-icon {
  color: #121212;
  font-size: 24rpx;
  margin-right: 10rpx;
}
.song-list {
  flex: 1;
  height: 0;
  padding: 0 30rpx;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}
.song-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 25rpx 30rpx;
  margin-bottom: 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
  animation: slideIn 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  box-sizing: border-box;
}
.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  z-index: -1;
}
@keyframes slideIn {
  to { opacity: 1; transform: translateY(0); }
}
.song-index {
  width: 50rpx;
  font-size: 32rpx;
  color: #00f2ea;
  font-family: monospace;
  font-weight: bold;
  opacity: 0.8;
  flex-shrink: 0;
}
.song-info {
  flex: 1;
  margin-left: 20rpx;
  overflow: hidden;
  min-width: 0;
  margin-right: 10rpx;
}
.song-name {
  font-size: 30rpx;
  color: #fff;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.song-detail {
  font-size: 22rpx;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.play-time {
  font-size: 22rpx;
  color: #666;
  margin-left: 20rpx;
  font-family: monospace;
  flex-shrink: 0;
}
.loading-text, .empty-text {
  text-align: center;
  margin-top: 100rpx;
  color: #666;
}

/* 分页控制器样式 */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
  flex-shrink: 0;
  z-index: 10;
}
.page-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  font-size: 36rpx;
  color: #fff;
  transition: all 0.2s;
}
.page-btn.disabled {
  opacity: 0.3;
  pointer-events: none;
}
.page-btn:active {
  background-color: rgba(0, 242, 234, 0.2);
}
.page-info {
  margin: 0 40rpx;
  font-size: 30rpx;
  color: #888;
  font-family: monospace;
}
</style>
