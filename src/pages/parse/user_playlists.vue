<template>
  <view
    class="user-playlists-container"
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
      <view class="bg-gradient"></view>
      <view class="bg-noise"></view>

      <view class="header">
        <text class="title">用户歌单</text>
        <text class="subtitle" v-if="playlists.length > 0">共 {{ playlists.length }} 个歌单</text>
      </view>

      <scroll-view scroll-y class="playlist-scroll" @scroll="onScroll">
        <view v-if="loading" class="status-text">加载中...</view>
        <view v-else-if="playlists.length === 0" class="status-text">未找到该用户的公开歌单</view>

        <view
          class="playlist-card"
          v-for="(item, index) in playlists"
          :key="item.id"
          @click="goToPlaylist(item.id)"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <view class="card-border"></view>
          <image :src="item.coverImgUrl" class="cover" mode="aspectFit" @error="handleImageError(item)"></image>
          <view class="info">
            <text class="name">{{ item.name }}</text>
            <text class="meta">{{ item.trackCount }} 首，播放 {{ formatCount(item.playCount) }}</text>
          </view>
          <view class="arrow">›</view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow, onHide, onLoad } from '@dcloudio/uni-app';
import { getUserPlaylistsMusic } from '@/api/music.js';
import { playerStore } from '@/store/player.js';

const playlists = ref([]);
const loading = ref(false);
let currentUid = null;

// 自定义下拉刷新相关
const refresherHeight = ref(0);
const refresherText = ref('下拉刷新');
const isRefreshing = ref(false);
let startY = 0;
let canRefresh = false;
let currentScrollTop = 0;

onShow(() => {
  setTimeout(() => {
    playerStore.isWidgetVisible = true;
  }, 50);
});
onHide(() => {
  playerStore.isWidgetVisible = false;
});

onLoad(async (options) => {
  currentUid = options.uid;
  if (currentUid) {
    await fetchPlaylists();
  }
});

const fetchPlaylists = async () => {
  if (!currentUid) return;
  loading.value = true;
  try {
    const res = await getUserPlaylistsMusic(currentUid);
    if (res.code === 200 && res.playlist) {
      playlists.value = res.playlist.map(item => {
        let cover = item.coverImgUrl || '';
        if (cover && cover.startsWith('http://')) {
          cover = cover.replace('http://', 'https://');
        }
        if (cover && !cover.includes('?')) {
            cover += '?param=200y200';
        }
        return {
          ...item,
          coverImgUrl: cover || '/static/default-avatar.png'
        };
      });
    }
  } catch (error) {
    console.error(error);
    uni.showToast({ title: '获取失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const handleImageError = (item) => {
  item.coverImgUrl = '/static/default-avatar.png';
};

const goToPlaylist = (id) => {
  uni.navigateTo({
    url: `/pages/playlist/detail?id=${id}&type=music`
  });
};

const formatCount = (count) => {
  if (count > 10000) return (count / 10000).toFixed(1) + '万';
  return count;
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
    await fetchPlaylists();
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
.user-playlists-container {
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
.header {
  padding: 40rpx 30rpx;
  padding-top: calc(40rpx + env(safe-area-inset-top));
  position: relative;
  z-index: 1;
}
.title {
  font-size: 60rpx;
  font-weight: 900;
  color: #00f2ea;
  display: block;
  text-shadow: 0 0 20px rgba(0, 242, 234, 0.3);
}
.subtitle {
  font-size: 28rpx;
  color: #888;
  margin-top: 10rpx;
}
.playlist-scroll {
  flex: 1;
  height: 0;
  padding: 0 30rpx;
  position: relative;
  z-index: 1;
  box-sizing: border-box; /* 修复：确保 padding 不会撑大宽度 */
}
.playlist-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 30rpx;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  width: 100%; /* 修复：确保宽度自适应 */
  box-sizing: border-box;
}
.playlist-card:active {
  background: rgba(255, 255, 255, 0.1);
}
.card-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 20rpx;
  border: 1px solid #00f2ea;
  opacity: 0;
  transition: opacity 0.3s;
}
.playlist-card:hover .card-border {
  opacity: 0.3;
}
@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}
.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 15rpx;
  margin-right: 25rpx;
  flex-shrink: 0;
  background-color: #222;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.name {
  font-size: 30rpx;
  color: #fff;
  margin-bottom: 10rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  font-size: 24rpx;
  color: #888;
}
.arrow {
  font-size: 40rpx;
  color: #444;
  margin-left: 20rpx;
}
.status-text {
  text-align: center;
  margin-top: 100rpx;
  color: #666;
}
</style>
