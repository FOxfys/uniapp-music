<template>
  <view class="detail-container">
    <!-- 背景高斯模糊 -->
    <image :src="playlistInfo.coverImgUrl || playlistInfo.picUrl" class="bg-image" mode="aspectFill"></image>
    <view class="bg-mask"></view>

    <!-- 头部信息 -->
    <view class="header-section">
      <image :src="playlistInfo.coverImgUrl || playlistInfo.picUrl" class="cover-image" mode="aspectFit"></image>
      <view class="info-text">
        <h1 class="playlist-name">{{ playlistInfo.name }}</h1>
        <view class="creator-info">
          <image :src="playlistInfo.creator?.avatarUrl" class="creator-avatar" mode="aspectFill"></image>
          <text class="creator-name">{{ playlistInfo.creator?.nickname }}</text>
        </view>
        <text class="playlist-desc">{{ playlistInfo.description }}</text>
      </view>
    </view>

    <!-- 歌曲列表 -->
    <scroll-view scroll-y class="song-list-section">
      <view class="play-all-header">
        <button class="play-all-btn" @click="playAll">▶ 播放全部 ({{ songList.length }})</button>
      </view>
      <view class="song-item" v-for="(song, index) in songList" :key="song.id" @click="playSong(song, index)">
        <view class="song-index">{{ index + 1 }}</view>
        <view class="song-info">
          <text class="song-name">{{ song.name }}</text>
          <text class="song-detail">
            {{ (song.ar || song.artists).map(a => a.name).join('/') }} - {{ (song.al || song.album).name }}
          </text>
        </view>
      </view>
    </scroll-view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPlaylistDetail } from '@/api/music.js';
import { playerStore } from '@/store/player.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const playlistInfo = ref({});
const songList = ref([]);

onLoad(async (options) => {
  const id = options.id;
  if (id) {
    uni.showLoading({ title: '加载中...' });
    try {
      const res = await getPlaylistDetail(id);
      if (res.code === 200 && res.result) {
        playlistInfo.value = res.result;
        songList.value = res.result.tracks;
        uni.setNavigationBarTitle({ title: res.result.name });
      }
    } catch (error) {
      console.error(error);
    } finally {
      uni.hideLoading();
    }
  }
});

// 修复点：点击单曲播放时，也需要设置播放列表
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
.detail-container { position: relative; display: flex; flex-direction: column; height: 100vh; color: #fff; }
.bg-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; filter: blur(40px); transform: scale(1.5); }
.bg-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: -1; }
.header-section { display: flex; padding: 40rpx; align-items: center; }
.cover-image { width: 200rpx; height: 200rpx; border-radius: 20rpx; margin-right: 30rpx; flex-shrink: 0; }
.info-text { display: flex; flex-direction: column; overflow: hidden; }
.playlist-name { font-size: 36rpx; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.creator-info { display: flex; align-items: center; margin: 15rpx 0; }
.creator-avatar { width: 50rpx; height: 50rpx; border-radius: 50%; margin-right: 15rpx; }
.creator-name { font-size: 26rpx; color: #ccc; }
.playlist-desc { font-size: 24rpx; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.song-list-section { flex: 1; background-color: rgba(26, 26, 26, 0.8); border-top-left-radius: 40rpx; border-top-right-radius: 40rpx; overflow: hidden; }
.play-all-header { padding: 20rpx 30rpx; border-bottom: 1px solid #333; }
.play-all-btn { background: transparent; color: #00f2ea; border: 1px solid #00f2ea; border-radius: 40rpx; font-size: 28rpx; }
.song-item { display: flex; align-items: center; padding: 20rpx 0; margin: 0 30rpx; border-bottom: 1px solid #2a2a2a; }
.song-index { width: 60rpx; text-align: center; color: #666; font-size: 30rpx; }
.song-info { flex: 1; margin-left: 20rpx; overflow: hidden; }
.song-name { font-size: 30rpx; color: #fff; margin-bottom: 8rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.song-detail { font-size: 24rpx; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
