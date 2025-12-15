<template>
  <view class="rank-container">
    <view class="header">
      <text class="page-title">排行榜</text>
      <text class="page-subtitle">TOP CHARTS</text>
    </view>

    <view class="rank-list">
      <view
        class="rank-card"
        v-for="(item, index) in rankList"
        :key="item.id"
        :class="item.styleClass"
        @click="goToPlaylist(item.id)"
      >
        <view class="card-bg"></view>
        <view class="card-content">
          <text class="rank-no">0{{ index + 1 }}</text>
          <text class="rank-name">{{ item.name }}</text>
          <view class="play-icon">▶</view>
        </view>
      </view>
    </view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

onShow(() => {
  setTimeout(() => {
    uni.showTabBar({ animation: true });
  }, 200);
});

const rankList = ref([
  { id: 3778678, name: '热歌榜', styleClass: 'hot' },
  { id: 19723756, name: '飙升榜', styleClass: 'soar' },
  { id: 3779629, name: '新歌榜', styleClass: 'new' },
  { id: 2884035, name: '原创榜', styleClass: 'original' }
]);

const goToPlaylist = (id) => {
  uni.navigateTo({
    url: `/pages/playlist/detail?id=${id}`
  });
};
</script>

<style scoped>
.rank-container {
  min-height: 100vh;
  background-color: #121212;
  padding: 40rpx 30rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.header {
  margin-bottom: 50rpx;
  padding-top: 20rpx;
}
.page-title {
  font-size: 60rpx;
  font-weight: 900;
  color: #fff;
  letter-spacing: 2px;
  display: block;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}
.page-subtitle {
  font-size: 24rpx;
  color: #666;
  letter-spacing: 4px;
  margin-top: 10rpx;
  display: block;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.rank-card {
  position: relative;
  height: 220rpx;
  border-radius: 30rpx;
  overflow: hidden;
  transition: transform 0.2s;
}
.rank-card:active {
  transform: scale(0.98);
}

/* 背景层：渐变 + 纹理 */
.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.9;
}

/* 内容层 */
.card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 0 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中 */
}

.rank-no {
  font-size: 100rpx; /* 加大编号 */
  font-weight: bold;
  color: rgba(255, 255, 255, 0.15);
  position: absolute;
  right: 20rpx;
  top: -20rpx; /* 稍微上移 */
  font-style: italic;
}

.rank-name {
  font-size: 56rpx; /* 加大标题 */
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 2px;
}

.play-icon {
  position: absolute;
  right: 40rpx;
  bottom: 40rpx;
  width: 80rpx; /* 加大按钮 */
  height: 80rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36rpx;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

/* --- 各榜单配色 --- */

/* 热歌榜：烈焰红 */
.hot .card-bg {
  background: linear-gradient(135deg, #ff4b1f, #ff9068);
}
.hot .rank-name {
  text-shadow: 0 0 15px rgba(255, 75, 31, 0.6);
}

/* 飙升榜：闪电紫 */
.soar .card-bg {
  background: linear-gradient(135deg, #8e2de2, #4a00e0);
}
.soar .rank-name {
  text-shadow: 0 0 15px rgba(142, 45, 226, 0.6);
}

/* 新歌榜：极光绿 */
.new .card-bg {
  background: linear-gradient(135deg, #11998e, #38ef7d);
}
.new .rank-name {
  text-shadow: 0 0 15px rgba(56, 239, 125, 0.6);
}

/* 原创榜：赛博粉 */
.original .card-bg {
  background: linear-gradient(135deg, #ec008c, #fc6767);
}
.original .rank-name {
  text-shadow: 0 0 15px rgba(236, 0, 140, 0.6);
}
</style>
