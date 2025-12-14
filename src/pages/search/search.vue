<template>
  <view class="search-container">
    <!-- 顶部搜索栏 -->
    <view class="search-header">
      <view class="input-wrapper">
        <input
          class="search-input"
          type="text"
          confirm-type="search"
          v-model="keyword"
          placeholder="搜索歌曲、歌手"
          focus
          @confirm="doSearch"
        />
        <text v-if="keyword" class="clear-icon" @click="keyword = ''">×</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索状态 -->
    <view v-if="loading" class="status-text">搜索中...</view>
    <view v-if="!loading && hasSearched && songList.length === 0" class="status-text">未找到相关歌曲</view>

    <!-- 搜索结果列表 -->
    <scroll-view scroll-y class="result-list" v-if="songList.length > 0">
      <view
        class="song-item"
        v-for="(song, index) in songList"
        :key="song.id"
        @click="playSong(song)"
      >
        <view class="song-index">{{ index + 1 }}</view>
        <view class="song-info">
          <text class="song-name">{{ song.name }}</text>
          <text class="song-detail">
            {{ song.artists.map(a => a.name).join('/') }} - {{ song.album.name }}
          </text>
        </view>
        <view class="action-icon">▶</view>
      </view>
    </scroll-view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { searchMusic } from '@/api/music.js';
import { playerStore } from '@/store/player.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const keyword = ref('');
const songList = ref([]);
const loading = ref(false);
const hasSearched = ref(false);

const goBack = () => uni.navigateBack();

const doSearch = async () => {
  if (!keyword.value.trim()) return;
  loading.value = true;
  hasSearched.value = true;
  songList.value = [];
  try {
    const res = await searchMusic({ name: keyword.value });
    if (res.code === 200 && res.result && res.result.songs) {
      songList.value = res.result.songs;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 修复点：点击播放时，设置播放列表
const playSong = (song) => {
  playerStore.setPlaylist(songList.value);
  playerStore.setSongAndPlay(song);
};
</script>

<style scoped>
.search-container { background-color: #121212; min-height: 100vh; color: #fff; display: flex; flex-direction: column; }
.search-header { display: flex; align-items: center; padding: 20rpx; background-color: #1a1a1a; }
.input-wrapper { flex: 1; position: relative; background-color: #333; border-radius: 40rpx; padding: 10rpx 30rpx; display: flex; align-items: center; }
.search-input { flex: 1; color: #fff; font-size: 28rpx; }
.clear-icon { color: #999; font-size: 36rpx; padding: 0 10rpx; }
.cancel-btn { margin-left: 20rpx; color: #fff; font-size: 30rpx; }
.status-text { text-align: center; margin-top: 50rpx; color: #666; }
.result-list { flex: 1; height: 0; padding: 20rpx; }
.song-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1px solid #2a2a2a; }
.song-index { width: 60rpx; text-align: center; color: #666; font-size: 30rpx; }
.song-info { flex: 1; display: flex; flex-direction: column; margin-left: 20rpx; overflow: hidden; }
.song-name { font-size: 30rpx; color: #fff; margin-bottom: 8rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.song-detail { font-size: 24rpx; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.action-icon { padding: 0 20rpx; color: #00f2ea; font-size: 32rpx; }
</style>
