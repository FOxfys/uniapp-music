<template>
  <view class="history-container">
    <view class="header">
      <text class="title">播放历史</text>
      <text class="subtitle">共 {{ songList.length }} 首</text>
    </view>

    <view class="play-all-bar" @click="playAll">
      <text class="play-icon">▶</text>
      <text>播放全部</text>
    </view>

    <scroll-view scroll-y class="song-list">
      <view v-if="loading" class="loading-text">加载中...</view>
      <view v-else-if="songList.length === 0" class="empty-text">暂无播放记录</view>

      <view
        class="song-item"
        v-for="(song, index) in songList"
        :key="song.id"
        @click="playSong(song)"
      >
        <view class="song-index">{{ index + 1 }}</view>
        <view class="song-info">
          <text class="song-name">{{ song.song_name || song.name }}</text>
          <text class="song-detail">
            {{ song.artist || (song.ar ? song.ar.map(a=>a.name).join('/') : '未知歌手') }} - {{ song.album || (song.al ? song.al.name : '未知专辑') }}
          </text>
        </view>
      </view>
    </scroll-view>

    <!-- 全局播放器控件 -->
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

const fetchHistory = async () => {
  loading.value = true;
  try {
    const res = await getPlayHistory({ page: 1, limit: 100 });
    if (res.code === 200 && res.history) {
      // 适配数据结构：后端返回的 history 字段可能和标准 song 结构不同
      // 这里做一个简单的映射，确保 playerStore 能识别
      songList.value = res.history.map(item => ({
        id: item.song_id,
        name: item.song_name,
        ar: [{ name: item.artist }], // 模拟 ar 结构
        al: { name: item.album, picUrl: '' }, // 模拟 al 结构，历史记录可能没存封面
        ...item
      }));
    }
  } catch (error) {
    console.error(error);
    uni.showToast({ title: '获取历史失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
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
  min-height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}
.header {
  padding: 40rpx 30rpx;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}
.subtitle {
  font-size: 28rpx;
  color: #888;
}
.play-all-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
}
.play-icon {
  color: #00f2ea;
  font-size: 36rpx;
  margin-right: 20rpx;
}
.song-list {
  flex: 1;
  height: 0;
}
.song-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  margin: 0 30rpx;
  border-bottom: 1px solid #2a2a2a;
}
.song-index {
  width: 60rpx;
  text-align: center;
  color: #666;
  font-size: 30rpx;
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
}
.song-detail {
  font-size: 24rpx;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.loading-text, .empty-text {
  text-align: center;
  margin-top: 100rpx;
  color: #666;
}
</style>
