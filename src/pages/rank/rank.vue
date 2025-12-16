<template>
  <view class="rank-container">
    <view class="bg-gradient"></view>
    <view class="bg-noise"></view>

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
        :style="{ animationDelay: index * 0.1 + 's' }"
      >
        <!-- 增加装饰性边框和切角 -->
        <view class="card-border"></view>
        <view class="card-corner top-left"></view>
        <view class="card-corner top-right"></view>
        <view class="card-corner bottom-left"></view>
        <view class="card-corner bottom-right"></view>

        <view class="card-content">
          <text class="rank-name">{{ item.name }}</text>
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

.header {
  margin-bottom: 60rpx;
  padding-top: 40rpx;
  position: relative;
  z-index: 1;
  text-align: center;
}
.page-title {
  font-size: 80rpx;
  font-weight: 900;
  color: transparent;
  -webkit-background-clip: text;
  background-image: linear-gradient(to right, #fff, #00f2ea, #fff);
  background-size: 200% auto;
  animation: shine 3s linear infinite;
  letter-spacing: 4px;
  display: block;
  text-shadow: 0 0 30px rgba(0, 242, 234, 0.3);
}
@keyframes shine {
  to { background-position: 200% center; }
}

.page-subtitle {
  font-size: 24rpx;
  color: rgba(255,255,255,0.4);
  letter-spacing: 8px;
  margin-top: 10rpx;
  display: block;
  font-family: monospace;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  position: relative;
  z-index: 1;
}

.rank-card {
  position: relative;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  transition: transform 0.2s;
  animation: slideIn 0.6s ease-out forwards;
  opacity: 0;
  transform: translateX(-20px);
  /* 切角效果 */
  clip-path: polygon(0 20px, 20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px));
}
.rank-card:active {
  transform: scale(0.98);
}

/* 装饰性边框和切角 */
.card-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  clip-path: polygon(0 20px, 20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px, 2px 20px, 2px calc(100% - 20px), 20px calc(100% - 2px), calc(100% - 20px) calc(100% - 2px), calc(100% - 2px) calc(100% - 20px), calc(100% - 2px) 20px, calc(100% - 20px) 2px, 20px 2px, 2px 20px);
}
.card-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 3;
}
.top-left { top: 0; left: 0; border-top: 2px solid; border-left: 2px solid; }
.top-right { top: 0; right: 0; border-top: 2px solid; border-right: 2px solid; }
.bottom-left { bottom: 0; left: 0; border-bottom: 2px solid; border-left: 2px solid; }
.bottom-right { bottom: 0; right: 0; border-bottom: 2px solid; border-right: 2px solid; }

/* 内容层 */
.card-content {
  position: relative;
  z-index: 3;
  height: 100%;
  padding: 0 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-name {
  font-size: 60rpx; /* 加大字号 */
  font-weight: 900;
  color: #fff;
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
  font-style: italic; /* 倾斜 */
  letter-spacing: 2px;
}

/* --- 各榜单配色 --- */
.hot .card-border, .hot .card-corner { border-color: #ff4b1f; }
.hot .rank-name { text-shadow: 0 0 20px #ff4b1f; }

.soar .card-border, .soar .card-corner { border-color: #8e2de2; }
.soar .rank-name { text-shadow: 0 0 20px #8e2de2; }

.new .card-border, .new .card-corner { border-color: #11998e; }
.new .rank-name { text-shadow: 0 0 20px #11998e; }

.original .card-border, .original .card-corner { border-color: #ec008c; }
.original .rank-name { text-shadow: 0 0 20px #ec008c; }

@keyframes slideIn {
  to { opacity: 1; transform: translateX(0); }
}
</style>
