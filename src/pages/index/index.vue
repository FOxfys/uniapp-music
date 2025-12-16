<template>
  <view class="home-container">
    <!-- 动态背景 -->
    <view class="bg-gradient"></view>
    <view class="bg-noise"></view>

    <!-- 1. 顶部区域：用户状态 + 搜索框 -->
    <view class="top-bar">
      <view class="user-status" @click="handleUserClick">
        <view class="avatar-box">
          <view class="avatar-ring"></view>
          <image
            class="avatar"
            :src="userStore.isLoggedIn ? (userStore.userInfo.avatarUrl || '/static/default-avatar.png') : '/static/default-avatar.png'"
            mode="aspectFill"
          ></image>
        </view>
        <view class="user-info" v-if="userStore.isLoggedIn">
          <text class="nickname">{{ userStore.userInfo.username }}</text>
          <view class="badge">MUSICIAN</view>
        </view>
        <text class="nickname" v-else>未登录</text>
      </view>

      <view class="search-bar" @click="goToSearch">
        <view class="search-input-mock">
          <view class="search-icon-box">
            <view class="icon-search"></view>
          </view>
          <text class="placeholder">搜索歌曲、歌手...</text>
          <view class="scan-line"></view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" @scrolltolower="onReachBottom">
      <!-- 2. 3D 轮播图 -->
      <swiper
        class="banner-swiper"
        circular
        interval="4000"
        duration="500"
        previous-margin="50rpx"
        next-margin="50rpx"
        @change="onBannerChange"
      >
        <swiper-item v-for="(item, index) in bannerList" :key="item.id">
          <view class="banner-item" :class="{ active: currentBannerIndex === index }">
            <image
              :src="item.picUrl"
              mode="aspectFill"
              class="banner-image"
              @error="handleImageError(item, 'banner')"
            ></image>
            <view class="banner-mask"></view>
            <text class="banner-title">{{ item.name }}</text>
          </view>
        </swiper-item>
      </swiper>

      <!-- 3. 推荐歌单 -->
      <view class="playlist-section">
        <view class="section-header">
          <text class="section-title">RECOMMEND</text>
          <text class="section-subtitle">为你推荐</text>
        </view>

        <view class="playlist-grid">
          <view
            class="playlist-card"
            v-for="(item, index) in displayedPlaylist"
            :key="item.id"
            @click="goToPlaylist(item.id)"
            :style="{ animationDelay: index * 0.05 + 's' }"
          >
            <view class="card-image-wrapper">
              <image
                :src="item.picUrl"
                mode="aspectFill"
                class="playlist-cover"
                lazy-load
                @error="handleImageError(item, 'playlist')"
              ></image>
              <view class="play-icon">▶</view>
            </view>
            <text class="playlist-name">{{ item.name }}</text>
          </view>
        </view>
        <view v-if="loadingMore" class="loading-more">
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
        </view>
      </view>
    </scroll-view>

    <!-- 全局播放器控件 -->
    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onReachBottom } from '@dcloudio/uni-app'; // 修复：导入 onReachBottom
import { getHotPlaylists } from '@/api/music.js';
import { userStore } from '@/store/user.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const bannerList = ref([]);
const allPlaylists = ref([]);
const page = ref(1);
const limit = 9;
const loadingMore = ref(false);
const currentBannerIndex = ref(0);

const displayedPlaylist = computed(() => {
  return allPlaylists.value.slice(0, page.value * limit);
});

const fetchData = async () => {
  try {
    const res = await getHotPlaylists();
    if (res.playlists) {
      const playlists = res.playlists.map(item => {
        let url = item.coverImgUrl || item.picUrl || '';
        if (url && url.startsWith('http://')) {
          url = url.replace('http://', 'https://');
        }
        return {
          id: item.id,
          name: item.name,
          picUrl: url
        };
      });

      bannerList.value = playlists.slice(0, 5);
      allPlaylists.value = playlists.slice(5);
    }
  } catch (error) {
    console.error('Failed to fetch hot playlists:', error);
  }
};

// 修复：使用 onReachBottom 注册回调
onReachBottom(() => {
  if (loadingMore.value) return;
  if (displayedPlaylist.value.length >= allPlaylists.value.length) return;

  loadingMore.value = true;
  setTimeout(() => {
    page.value++;
    loadingMore.value = false;
  }, 500);
});

const onBannerChange = (e) => {
  currentBannerIndex.value = e.detail.current;
};

const handleImageError = (item, type) => {
  item.picUrl = '/static/rank/original.png';
};

const handleUserClick = () => {
  if (userStore.isLoggedIn) {
    uni.switchTab({ url: '/pages/my/my' });
  } else {
    uni.navigateTo({ url: '/pages/login/login' });
  }
};

const goToSearch = () => {
  uni.navigateTo({ url: '/pages/search/search' });
};

const goToPlaylist = (id) => {
  uni.navigateTo({ url: `/pages/playlist/detail?id=${id}` });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.home-container {
  background-color: #121212;
  color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
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

/* 顶部栏 */
.top-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: rgba(18, 18, 18, 0.8);
  backdrop-filter: blur(10px);
}

/* 用户状态 */
.user-status {
  display: flex;
  align-items: center;
  margin-right: 30rpx;
}
.avatar-box {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  margin-right: 15rpx;
}
.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
}
.avatar-ring {
  position: absolute;
  top: -4rpx;
  left: -4rpx;
  right: -4rpx;
  bottom: -4rpx;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #00f2ea;
  border-right-color: #00f2ea;
  animation: rotate 4s linear infinite;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  max-width: 150rpx;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge {
  font-size: 18rpx;
  color: #000;
  background: linear-gradient(90deg, #00f2ea, #00c2b8);
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  font-weight: bold;
  margin-top: 4rpx;
  align-self: flex-start;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

/* 搜索框 */
.search-bar {
  flex: 1;
}
.search-input-mock {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 40rpx;
  padding: 15rpx 20rpx;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
}
.search-icon-box {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15rpx;
}
.icon-search {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid #00f2ea;
  border-radius: 50%;
  position: relative;
}
.icon-search::after {
  content: '';
  position: absolute;
  width: 8rpx;
  height: 3rpx;
  background-color: #00f2ea;
  bottom: -4rpx;
  right: -6rpx;
  transform: rotate(45deg);
}
.placeholder {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
}
.scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 242, 234, 0.1), transparent);
  animation: scan 3s ease-in-out infinite;
  transform: skewX(-20deg);
}
@keyframes scan {
  0% { left: -100%; }
  50%, 100% { left: 200%; }
}

.scroll-content {
  flex: 1;
  height: 0;
  position: relative;
  z-index: 1;
}

/* 3D 轮播图 */
.banner-swiper {
  height: 380rpx;
  margin-top: 30rpx;
}
.banner-item {
  width: 100%;
  height: 100%;
  padding: 0 10rpx;
  box-sizing: border-box;
  position: relative;
  transition: all 0.3s;
  transform: scale(0.9);
  opacity: 0.7;
}
.banner-item.active {
  transform: scale(1);
  opacity: 1;
}
.banner-image {
  width: 100%;
  height: 100%;
  border-radius: 20rpx;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.banner-mask {
  position: absolute;
  bottom: 0;
  left: 10rpx;
  right: 10rpx;
  height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  border-bottom-left-radius: 20rpx;
  border-bottom-right-radius: 20rpx;
}
.banner-title {
  position: absolute;
  bottom: 20rpx;
  left: 30rpx;
  right: 30rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* 推荐歌单 */
.playlist-section {
  padding: 40rpx 30rpx;
}
.section-header {
  margin-bottom: 40rpx;
}
.section-title {
  font-size: 48rpx;
  font-weight: 900;
  color: transparent;
  -webkit-background-clip: text;
  background-image: linear-gradient(to right, #fff, #00f2ea);
  display: block;
  letter-spacing: 2px;
}
.section-subtitle {
  font-size: 24rpx;
  color: rgba(255,255,255,0.5);
  letter-spacing: 4px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25rpx;
}
.playlist-card {
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}
@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 1:1 比例 */
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 15rpx;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.playlist-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}
.playlist-card:active .playlist-cover {
  transform: scale(1.1);
}
.play-icon {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  width: 50rpx;
  height: 50rpx;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
  border: 1px solid rgba(255,255,255,0.2);
}

.playlist-name {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 加载更多动画 */
.loading-more {
  display: flex;
  justify-content: center;
  padding: 40rpx 0;
  gap: 10rpx;
}
.loading-dot {
  width: 10rpx;
  height: 10rpx;
  background-color: #00f2ea;
  border-radius: 50%;
  animation: bounce 0.6s infinite alternate;
}
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  to { transform: translateY(-10rpx); opacity: 0.5; }
}
</style>
