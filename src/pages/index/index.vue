<template>
  <view class="home-container">
    <!-- 1. 顶部搜索框 -->
    <view class="search-bar" @click="goToSearch">
      <view class="search-input-mock">
        <text>搜索歌曲、歌手</text>
      </view>
    </view>

    <!-- 2. 轮播图 -->
    <swiper class="banner-swiper" indicator-dots autoplay circular>
      <swiper-item v-for="item in bannerList" :key="item.id">
        <image :src="item.coverImgUrl || item.picUrl" mode="aspectFill" class="banner-image"></image>
      </swiper-item>
    </swiper>

    <!-- 3. 推荐歌单 -->
    <view class="playlist-section">
      <h2 class="section-title">推荐歌单</h2>
      <view class="playlist-grid">
        <view class="playlist-item" v-for="item in playlist" :key="item.id" @click="goToPlaylist(item.id)">
          <image :src="item.coverImgUrl || item.picUrl" mode="aspectFill" class="playlist-cover"></image>
          <text class="playlist-name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 全局播放器控件 -->
    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getHotPlaylists } from '@/api/music.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const bannerList = ref([]);
const playlist = ref([]);

const fetchData = async () => {
  try {
    const res = await getHotPlaylists();
    if (res.playlists) {
      bannerList.value = res.playlists.slice(0, 5).map(item => ({ id: item.id, picUrl: item.coverImgUrl || item.picUrl }));
      playlist.value = res.playlists;
    }
  } catch (error) {
    console.error('Failed to fetch hot playlists:', error);
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
}
.search-bar { margin-bottom: 30rpx; }
.search-input-mock { background-color: #2a2a2a; border-radius: 50rpx; padding: 15rpx 30rpx; color: #888; font-size: 28rpx; text-align: center; }
.banner-swiper { height: 300rpx; border-radius: 20rpx; overflow: hidden; margin-bottom: 40rpx; }
.banner-image { width: 100%; height: 100%; }
.section-title { font-size: 36rpx; font-weight: bold; margin-bottom: 30rpx; color: #00f2ea; }
.playlist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20rpx; }
.playlist-item { display: flex; flex-direction: column; }
.playlist-cover { width: 100%; height: 220rpx; border-radius: 15rpx; margin-bottom: 10rpx; }
.playlist-name { font-size: 24rpx; color: #e0e0e0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; text-overflow: ellipsis; }
</style>
