<template>
  <view class="history-container">
    <view class="bg-noise"></view>

    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <view class="icon-back"></view>
      </view>
      <text class="nav-title">播放历史</text>
    </view>

    <view class="header">
      <view class="title-group">
        <text class="main-title">HISTORY</text>
        <text class="sub-title">共 {{ songList.length }} 首歌曲</text>
      </view>
      <view class="play-all-btn" @click="playAll">
        <view class="play-icon">▶</view>
        <text>播放全部</text>
      </view>
    </view>

    <scroll-view scroll-y class="song-list">
      <view v-if="loading" class="loading-text">加载中...</view>
      <view v-else-if="songList.length === 0" class="empty-text">暂无播放记录</view>

      <view
        class="song-card"
        v-for="(song, index) in songList"
        :key="song.id"
        @click="playSong(song)"
        :style="{ animationDelay: index * 0.05 + 's' }"
      >
        <view class="card-bg"></view>
        <view class="song-index">{{ String(index + 1).padStart(2, '0') }}</view>
        <view class="song-info">
          <text class="song-name">{{ song.name }}</text>
          <text class="song-detail">
            {{ song.artist }} - {{ song.album }}
          </text>
        </view>
        <text class="play-time">{{ formatPlayTime(song.play_time) }}</text>
      </view>
    </scroll-view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getPlayHistory } from '@/api/playlist.js';
import { playerStore } from '@/store/player.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const songList = ref([]);
const loading = ref(false);

onShow(() => {
  fetchHistory();
});

const goBack = () => uni.navigateBack();

const fetchHistory = async () => {
  loading.value = true;
  try {
    const res = await getPlayHistory({ page: 1, limit: 100 });
    if (res.code === 200 && res.history) {
      songList.value = res.history.map(item => ({
        id: item.song_id,
        name: item.name,
        artist: item.artist,
        album: item.album,
        play_time: item.play_time,
        ar: [{ name: item.artist }],
        al: { name: item.album, picUrl: item.cover_url || '' },
      }));
    }
  } catch (error) {
    console.error(error);
    uni.showToast({ title: '获取历史失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const formatPlayTime = (timeStr) => {
  if (!timeStr) return '';
  const compatibleTimeStr = timeStr.replace(/-/g, '/');
  const date = new Date(compatibleTimeStr);
  const now = new Date();

  const diff = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diff / (1000 * 60));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}天前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const playSong = (song) => {
  playerStore.setPlaylist(songList.value);
  playerStore.setSongAndPlay(song);
};

const playAll = () => {
  if (songList.value.length > 0) {
    playSong(songList.value[0]);
  }
};
</script>

<style scoped>
.history-container {
  background-color: #121212;
  height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;
  overflow: hidden;
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

/* 导航栏 */
.nav-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  height: 88rpx;
  padding-top: env(safe-area-inset-top);
}
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
}
.icon-back {
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid #fff;
  border-bottom: 4rpx solid #fff;
  transform: rotate(45deg);
}
.nav-title { font-size: 32rpx; font-weight: bold; margin-left: 20rpx; }

.header {
  padding: 40rpx 30rpx;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  z-index: 1;
}
.main-title {
  font-size: 60rpx;
  font-weight: 900;
  color: #00f2ea;
  display: block;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(0, 242, 234, 0.3);
}
.sub-title {
  font-size: 24rpx;
  color: #888;
  margin-top: 10rpx;
  display: block;
}

.play-all-btn {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #00f2ea, #00c2b8);
  padding: 15rpx 30rpx;
  border-radius: 40rpx;
  box-shadow: 0 5px 15px rgba(0, 242, 234, 0.3);
}
.play-all-btn text {
  color: #121212;
  font-weight: bold;
  font-size: 28rpx;
}
.play-icon {
  color: #121212;
  font-size: 24rpx;
  margin-right: 10rpx;
}

.song-list {
  flex: 1;
  height: 0;
  padding: 0 30rpx;
  position: relative;
  z-index: 1;
}

.song-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 25rpx 30rpx;
  margin-bottom: 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
  animation: slideIn 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}
.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  z-index: -1;
}

@keyframes slideIn {
  to { opacity: 1; transform: translateY(0); }
}

.song-index {
  width: 50rpx;
  font-size: 32rpx;
  color: #00f2ea;
  font-family: monospace;
  font-weight: bold;
  opacity: 0.8;
}
.song-info {
  flex: 1;
  margin-left: 20rpx;
  overflow: hidden;
}
.song-name {
  font-size: 30rpx;
  color: #fff;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.song-detail {
  font-size: 22rpx;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.play-time {
  font-size: 22rpx;
  color: #666;
  margin-left: 20rpx;
  font-family: monospace;
}

.loading-text, .empty-text {
  text-align: center;
  margin-top: 100rpx;
  color: #666;
}
</style>
