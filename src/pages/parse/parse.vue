<template>
  <view class="parse-container">
    <!-- 1. 输入区 -->
    <view class="input-section">
      <input class="parse-input" placeholder="粘贴歌曲ID或链接" v-model="inputValue" />
      <button class="paste-btn" @click="handlePaste">自动粘贴</button>
    </view>

    <!-- 2. 可视化与信息展示区 -->
    <view class="visualizer-section">
      <image v-if="parsedSong.pic" :src="parsedSong.pic" class="song-cover" mode="aspectFit"></image>

      <view class="audio-visualizer" :class="{ 'playing': isPlaying }">
        <view class="bar" v-for="i in 20" :key="i"></view>
      </view>

      <view v-if="parsedSong.name" class="song-info">
        <text class="song-name">{{ parsedSong.name }}</text>
        <text class="song-artist">{{ parsedSong.ar_name }}</text>
      </view>
       <view v-else class="placeholder-text">
        <text>待解析...</text>
      </view>
    </view>

    <!-- 3. 控制与操作区 -->
    <view class="controls-section">
      <button class="parse-btn" @click="handleParse">开始解析</button>
      <button class="play-btn" :disabled="!parsedSong.url" @click="handlePlay">
        {{ isPlaying ? '暂停播放' : '立即播放' }}
      </button>
    </view>

    <!-- 全局播放器控件 -->
    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { parseMusic } from '@/api/music.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const inputValue = ref('');
const parsedSong = ref({});
const isPlaying = ref(false);

const handlePaste = () => {
  uni.getClipboardData({
    success: (res) => {
      inputValue.value = res.data;
      uni.showToast({ title: '已粘贴', icon: 'none' });
    }
  });
};

const handleParse = async () => {
  if (!inputValue.value) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '解析中...' });
  try {
    const res = await parseMusic({ ids: inputValue.value, level: 'exhigh', type: 'json' });
    if (res.status === 200) {
      parsedSong.value = res;
    } else {
      uni.showToast({ title: res.message || '解析失败', icon: 'none' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    uni.hideLoading();
  }
};

const handlePlay = () => {
  if (!parsedSong.value.url) return;
  isPlaying.value = !isPlaying.value;
  uni.showToast({ title: isPlaying.value ? '开始播放' : '已暂停', icon: 'none' });
};

</script>

<style scoped>
.parse-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  background-color: #121212;
  min-height: 100vh;
  color: #fff;
}
.input-section {
  display: flex;
  width: 100%;
  margin-bottom: 50rpx;
}
.parse-input {
  flex-grow: 1;
  background-color: #2a2a2a;
  border: 1px solid #00f2ea;
  border-radius: 10rpx;
  padding: 20rpx;
  color: #fff;
}
.paste-btn {
  margin-left: 20rpx;
  background-color: #00f2ea;
  color: #121212;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
}
.visualizer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 500rpx;
  background-color: #1a1a1a;
  border-radius: 20rpx;
  margin-bottom: 50rpx;
  position: relative;
}
.song-cover {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  margin-bottom: 30rpx;
  border: 4px solid #2a2a2a;
}
.song-info {
  text-align: center;
}
.song-name {
  font-size: 36rpx;
  font-weight: bold;
}
.song-artist {
  font-size: 28rpx;
  color: #888;
}
.placeholder-text {
  color: #555;
  font-size: 32rpx;
}
.audio-visualizer {
  position: absolute;
  bottom: 40rpx;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 80rpx;
  gap: 6rpx;
}
.audio-visualizer .bar {
  width: 8rpx;
  background-color: #00f2ea;
  height: 10%;
  animation-duration: 1.2s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
.audio-visualizer.playing .bar {
  animation-name: bounce;
}
@keyframes bounce {
  0%, 100% { height: 10%; }
  50% { height: 100%; }
}
.audio-visualizer .bar:nth-child(2) { animation-delay: -1.1s; }
.audio-visualizer .bar:nth-child(3) { animation-delay: -1.0s; }
.audio-visualizer .bar:nth-child(4) { animation-delay: -0.9s; }
.audio-visualizer .bar:nth-child(5) { animation-delay: -0.8s; }
.audio-visualizer .bar:nth-child(6) { animation-delay: -0.7s; }
.audio-visualizer .bar:nth-child(7) { animation-delay: -0.6s; }
.audio-visualizer .bar:nth-child(8) { animation-delay: -0.5s; }
.audio-visualizer .bar:nth-child(9) { animation-delay: -0.4s; }
.audio-visualizer .bar:nth-child(10) { animation-delay: -0.3s; }
.audio-visualizer .bar:nth-child(11) { animation-delay: -0.4s; }
.audio-visualizer .bar:nth-child(12) { animation-delay: -0.5s; }
.audio-visualizer .bar:nth-child(13) { animation-delay: -0.6s; }
.audio-visualizer .bar:nth-child(14) { animation-delay: -0.7s; }
.audio-visualizer .bar:nth-child(15) { animation-delay: -0.8s; }
.audio-visualizer .bar:nth-child(16) { animation-delay: -0.9s; }
.audio-visualizer .bar:nth-child(17) { animation-delay: -1.0s; }
.audio-visualizer .bar:nth-child(18) { animation-delay: -1.1s; }
.audio-visualizer .bar:nth-child(19) { animation-delay: -1.2s; }
.audio-visualizer .bar:nth-child(20) { animation-delay: -1.3s; }
.controls-section {
  display: flex;
  justify-content: space-around;
  width: 100%;
}
.parse-btn, .play-btn {
  width: 45%;
  background-image: linear-gradient(45deg, #00f2ea, #00c2b8);
  color: #121212;
  font-weight: bold;
  border: none;
  border-radius: 10rpx;
}
.play-btn:disabled {
  background: #333;
  color: #666;
}
</style>
