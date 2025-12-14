<template>
  <view class="rank-container">
    <view class="rank-card" v-for="item in rankList" :key="item.id" @click="goToPlaylist(item.id)">
      <image :src="item.cover" mode="aspectFill" class="rank-cover"></image>
      <view class="rank-name">{{ item.name }}</view>
    </view>

    <!-- 全局播放器控件 -->
    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const rankList = ref([
  { id: 3778678, name: '热歌榜', cover: '/static/rank/hot.png' },
  { id: 19723756, name: '飙升榜', cover: '/static/rank/soar.png' },
  { id: 3779629, name: '新歌榜', cover: '/static/rank/new.png' },
  { id: 2884035, name: '原创榜', cover: '/static/rank/original.png' }
]);

const goToPlaylist = (id) => {
  uni.navigateTo({
    url: `/pages/playlist/detail?id=${id}`
  });
};
</script>

<style scoped>
.rank-container {
  padding: 30rpx;
}
.rank-card {
  position: relative;
  height: 200rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rank-cover {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.rank-name {
  position: relative;
  z-index: 2;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 10px rgba(0,0,0,0.7);
}
</style>
