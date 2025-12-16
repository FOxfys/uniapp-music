<template>
  <view class="home-container">
    <!-- 1. 顶部区域：用户状态 + 搜索框 -->
    <view class="top-bar">
      <view class="user-status" @click="handleUserClick">
        <image
          class="avatar"
          :src="userStore.isLoggedIn ? (userStore.userInfo.avatarUrl || '/static/default-avatar.png') : '/static/default-avatar.png'"
          mode="aspectFill"
        ></image>
        <text class="nickname">{{ userStore.isLoggedIn ? userStore.userInfo.username : '未登录' }}</text>
      </view>
      <view class="search-bar" @click="goToSearch">
        <view class="search-input-mock">
          <text>🔍 搜索歌曲、歌手</text>
        </view>
      </view>
    </view>

    <!-- 2. 轮播图 -->
    <swiper class="banner-swiper" indicator-dots autoplay circular interval="4000" duration="500">
      <swiper-item v-for="item in bannerList" :key="item.id">
        <image
          :src="item.picUrl"
          mode="aspectFill"
          class="banner-image"
          @error="handleImageError(item, 'banner')"
        ></image>
      </swiper-item>
    </swiper>

    <!-- 3. 推荐歌单 -->
    <view class="playlist-section">
      <h2 class="section-title">推荐歌单</h2>
      <view class="playlist-grid">
        <view class="playlist-item" v-for="item in displayedPlaylist" :key="item.id" @click="goToPlaylist(item.id)">
          <image
            :src="item.picUrl"
            mode="aspectFill"
            class="playlist-cover"
            lazy-load
            @error="handleImageError(item, 'playlist')"
          ></image>
          <text class="playlist-name">{{ item.name }}</text>
        </view>
      </view>
      <view v-if="loadingMore" class="loading-more">加载中...</view>
    </view>

    <!-- 全局播放器控件 -->
    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onReachBottom } from '@dcloudio/uni-app';
import { getHotPlaylists } from '@/api/music.js';
import { userStore } from '@/store/user.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const bannerList = ref([]);
const allPlaylists = ref([]); // 存储所有歌单
const page = ref(1);
const limit = 9;
const loadingMore = ref(false);

// 计算当前应显示的歌单
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
      allPlaylists.value = playlists.slice(5); // 剩下的都作为推荐
    }
  } catch (error) {
    console.error('Failed to fetch hot playlists:', error);
  }
};

// 触底加载
onReachBottom(() => {
  if (loadingMore.value) return;
  if (displayedPlaylist.value.length >= allPlaylists.value.length) {
    return;
  }

  loadingMore.value = true;
  setTimeout(() => {
    page.value++;
    loadingMore.value = false;
  }, 500);
});

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
  min-height: 100vh;
  padding: 20rpx;
  box-sizing: border-box;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding-top: env(safe-area-inset-top);
}
.user-status {
  display: flex;
  align-items: center;
  margin-right: 20rpx;
}
.avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  margin-right: 15rpx;
  border: 2px solid rgba(255,255,255,0.1);
}
.nickname {
  font-size: 28rpx;
  white-space: nowrap;
  max-width: 150rpx;
  overflow: hidden;
  text-overflow: ellipsis;
}
.search-bar {
  flex: 1;
}
.search-input-mock {
  background-color: #2a2a2a;
  border-radius: 50rpx;
  padding: 15rpx 30rpx;
  color: #888;
  font-size: 28rpx;
  text-align: left;
  display: flex;
  align-items: center;
}

.banner-swiper { height: 300rpx; border-radius: 20rpx; overflow: hidden; margin-bottom: 40rpx; }
.banner-image { width: 100%; height: 100%; }

.section-title { font-size: 36rpx; font-weight: bold; margin-bottom: 30rpx; color: #fff; border-left: 8rpx solid #00f2ea; padding-left: 20rpx; }
.playlist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20rpx; }
.playlist-item { display: flex; flex-direction: column; }
.playlist-cover { width: 100%; height: 220rpx; border-radius: 15rpx; margin-bottom: 10rpx; background-color: #2a2a2a; }
.playlist-name { font-size: 24rpx; color: #e0e0e0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; }
.loading-more {
  text-align: center;
  color: #666;
  padding: 20rpx;
}
</style>
