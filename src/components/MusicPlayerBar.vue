<template>
  <view class="player-bar-container" v-if="playerStore.currentSong" @click="goToPlayerPage">
    <image :src="playerStore.currentSong.al?.picUrl" class="song-cover" mode="aspectFill"></image>
    <view class="song-info">
      <text class="song-name">{{ playerStore.currentSong.name }}</text>
      <text class="song-artist">{{ playerStore.currentSong.ar?.map(a => a.name).join('/') }}</text>
    </view>
    <view class="controls">
      <view class="control-btn" @click.stop="togglePlayPause">
        {{ playerStore.isPlaying ? '❚❚' : '▶' }}
      </view>
      <view class="control-btn">☰</view>
    </view>
  </view>
</template>

<script setup>
import { playerStore } from '@/store/player.js';

const togglePlayPause = () => {
  if (playerStore.isPlaying) {
    playerStore.pause();
  } else {
    playerStore.play();
  }
};

const goToPlayerPage = () => {
  uni.navigateTo({
    url: '/pages/player/player'
  });
};
</script>

<style scoped>
.player-bar-container {
  position: fixed;
  bottom: var(--window-bottom);
  left: 0;
  right: 0;
  height: 120rpx;
  background-color: rgba(26, 26, 26, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  border-top: 1px solid #333;
  z-index: 999;
}
.song-cover {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}
.song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.song-name {
  color: #fff;
  font-size: 28rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-artist {
  color: #888;
  font-size: 24rpx;
}
.controls {
  display: flex;
  align-items: center;
}
.control-btn {
  width: 80rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  color: #00f2ea;
  font-size: 40rpx;
  margin-left: 20rpx;
}
</style>
