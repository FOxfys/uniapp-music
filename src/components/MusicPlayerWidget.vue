<template>
  <view
    class="widget-container"
    v-if="playerStore.currentSong"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @click.stop="handleClick"
  >
    <!-- 增加一个外圈光晕，确保可见 -->
    <view class="glow-ring" :class="{ playing: playerStore.isPlaying }"></view>

    <image
      :src="playerStore.currentSong.al?.picUrl || '/static/default-avatar.png'"
      class="cover-image"
      :class="{ playing: playerStore.isPlaying }"
      mode="aspectFill"
    ></image>
  </view>
</template>

<script setup>
import { reactive } from 'vue';
import { playerStore } from '@/store/player.js';

const position = reactive({
  x: playerStore.widgetPosition.x,
  y: playerStore.widgetPosition.y
});

const touchStart = reactive({ x: 0, y: 0 });
let isDragging = false;
let startX = 0;
let startY = 0;

const onTouchStart = (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  touchStart.x = startX - position.x;
  touchStart.y = startY - position.y;
  isDragging = false;
};

const onTouchMove = (e) => {
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;

  // 只有移动距离超过 5px 才算是拖拽，防止误触
  if (Math.abs(currentX - startX) > 5 || Math.abs(currentY - startY) > 5) {
    isDragging = true;
    position.x = currentX - touchStart.x;
    position.y = currentY - touchStart.y;
  }
};

const onTouchEnd = () => {
  if (isDragging) {
    playerStore.updateWidgetPosition(position.x, position.y);
  }
};

const handleClick = () => {
  if (!isDragging) {
    console.log('Widget clicked, navigating to player...');
    uni.navigateTo({
      url: '/pages/player/player',
      fail: (err) => {
        console.error('Navigation failed:', err);
        // 如果跳转失败（比如已经在播放页），尝试重定向
        // uni.redirectTo({ url: '/pages/player/player' });
      }
    });
  }
};
</script>

<style scoped>
.widget-container {
  position: fixed;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 确保最高层级 */
  /* 限制拖拽范围不超出屏幕太远 */
  max-width: 100vw;
  max-height: 100vh;
}

.glow-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #00f2ea;
  box-shadow: 0 0 15px #00f2ea;
  opacity: 0.6;
  pointer-events: none;
}

.glow-ring.playing {
  animation: pulse 2s infinite;
}

.cover-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 2px solid #fff;
  animation: rotate 20s linear infinite;
  animation-play-state: paused;
}

.cover-image.playing {
  animation-play-state: running;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.6; }
}
</style>
