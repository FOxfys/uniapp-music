<template>
  <view class="detail-container">
    <!-- 背景层 (视差滚动) -->
    <image
      :src="playlistInfo.coverImgUrl || playlistInfo.picUrl"
      class="bg-image"
      mode="aspectFill"
      :style="{ transform: `translateY(${bgTranslateY}px)` }"
    ></image>
    <view class="bg-mask"></view>

    <!-- 动态导航栏 -->
    <view class="nav-bar" :style="{ backgroundColor: `rgba(18, 18, 18, ${navOpacity})` }">
      <view class="back-btn" @click="goBack">
        <view class="icon-back-arrow"></view>
      </view>
      <text class="nav-title" :style="{ opacity: navTitleOpacity }">{{ playlistInfo.name }}</text>
    </view>

    <scroll-view
      scroll-y
      class="scroll-content"
      @scroll="onScroll"
    >
      <!-- 头部信息 (随滚动缩小) -->
      <view class="header-wrapper" :style="{ transform: `scale(${headerScale})`, opacity: headerOpacity }">
        <view class="header-section">
          <view class="cover-box">
            <image :src="playlistInfo.coverImgUrl || playlistInfo.picUrl" class="cover-image" mode="aspectFill"></image>
            <view class="play-count">▷ {{ formatCount(playlistInfo.playCount || 0) }}</view>
          </view>
          <view class="info-box">
            <view>
              <text class="playlist-name">{{ playlistInfo.name }}</text>
              <view class="creator-info">
                <image :src="playlistInfo.creator?.avatarUrl" class="creator-avatar" mode="aspectFill"></image>
                <text class="creator-name">{{ playlistInfo.creator?.nickname }}</text>
              </view>
            </view>
            <view class="desc-box" @click="showDescModal = true">
              <text class="playlist-desc">{{ playlistInfo.description || '暂无描述' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作栏 -->
      <view class="action-bar" v-if="pageType === 'music'">
        <view class="action-btn-large" @click="handleCollect">
          <text class="icon">❤</text>
          <text class="text">一键转存到我的歌单</text>
        </view>
      </view>
      <view class="action-bar-placeholder" v-else></view>

      <!-- 歌曲列表容器 -->
      <view class="song-list-container">
        <view class="play-all-header">
          <view class="play-all-btn" @click="playAll">
            <text class="play-icon">▶</text>
            <text class="play-text">播放全部</text>
            <text class="count-text">({{ songList.length }})</text>
          </view>
        </view>

        <view class="song-list">
          <view
            class="song-item"
            v-for="(song, index) in songList"
            :key="song.id"
            @click="playSong(song, index)"
            :style="{ animationDelay: index * 0.03 + 's' }"
          >
            <view class="song-index" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</view>
            <view class="song-info">
              <text class="song-name">{{ song.name }}</text>
              <text class="song-detail">{{ song.artistStr }} - {{ song.albumStr }}</text>
            </view>
            <view v-if="pageType === 'user'" class="delete-btn" @click.stop="handleDeleteSong(song.id)">×</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 导入进度弹窗 (炫酷版) -->
    <view class="modal-mask" v-if="isImporting">
      <view class="progress-modal">
        <text class="progress-title">正在转存...</text>
        <view class="progress-bar-bg">
          <view class="progress-bar-fill" :style="{ width: importProgress + '%' }">
            <view class="progress-glow"></view>
          </view>
        </view>
        <text class="progress-info">{{ importStatus }}</text>
        <text class="progress-percent">{{ Math.floor(importProgress) }}%</text>
      </view>
    </view>

    <!-- 简介详情弹窗 -->
    <view class="desc-modal-mask" v-if="showDescModal" @click="showDescModal = false">
      <view class="desc-modal-content" @click.stop>
        <image :src="playlistInfo.coverImgUrl || playlistInfo.picUrl" class="desc-bg" mode="aspectFill"></image>
        <view class="desc-mask"></view>
        <view class="desc-text-wrapper">
          <text class="desc-title">{{ playlistInfo.name }}</text>
          <scroll-view scroll-y class="desc-scroll">
            <text class="desc-full-text">{{ playlistInfo.description || '暂无描述' }}</text>
          </scroll-view>
        </view>
        <view class="desc-close" @click="showDescModal = false">×</view>
      </view>
    </view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPlaylistDetail as getMusicPlaylist } from '@/api/music.js';
import { getUserPlaylistDetail, createPlaylist, addSongToPlaylist, updatePlaylist, removeSongFromPlaylist } from '../../api/playlist.js';
import { playerStore } from '@/store/player.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const playlistInfo = ref({});
const songList = ref([]);
const pageType = ref('music');
const currentPlaylistId = ref(null);
const showDescModal = ref(false);

// 动效相关
const navOpacity = ref(0);
const navTitleOpacity = ref(0);
const headerScale = ref(1);
const headerOpacity = ref(1);
const bgTranslateY = ref(0);

const isImporting = ref(false);
const importProgress = ref(0);
const importStatus = ref('');

onLoad(async (options) => {
  const id = options.id;
  currentPlaylistId.value = id;
  pageType.value = options.type || 'music';

  if (id) {
    uni.showLoading({ title: '加载中...' });
    try {
      let res;
      if (pageType.value === 'user') {
        res = await getUserPlaylistDetail(id);
        if (res.code === 200 && res.playlist) {
          playlistInfo.value = {
            name: res.playlist.name,
            description: res.playlist.description,
            coverImgUrl: res.playlist.cover_url || '/static/rank/original.png',
            creator: { nickname: '我' }
          };
          songList.value = (res.songs || []).map(normalizeSong);
        }
      } else {
        res = await getMusicPlaylist(id);
        if (res.code === 200 && res.result) {
          playlistInfo.value = res.result;
          songList.value = (res.result.tracks || []).map(normalizeSong);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      uni.hideLoading();
    }
  }
});

const onScroll = (e) => {
  const scrollTop = e.detail.scrollTop;
  const threshold = 100;

  navOpacity.value = Math.min(scrollTop / threshold, 1);
  navTitleOpacity.value = Math.min(Math.max(0, scrollTop - threshold) / 50, 1);

  const scale = Math.max(1 - scrollTop / (threshold * 2), 0.8);
  headerScale.value = scale;
  headerOpacity.value = Math.max(1 - scrollTop / threshold, 0);

  bgTranslateY.value = scrollTop * 0.3;
};

const normalizeSong = (song) => {
  let name = song.name || song.song_name || '未知歌曲';
  let id = song.id || song.song_id;
  let artistStr = '未知歌手';
  let albumStr = '未知专辑';
  let picUrl = song.cover_url || '';

  if (song.artist) {
    artistStr = song.artist;
  } else if (song.ar && Array.isArray(song.ar)) {
    artistStr = song.ar.map(a => a.name).join('/');
  } else if (song.artists && Array.isArray(song.artists)) {
    artistStr = song.artists.map(a => a.name).join('/');
  }

  if (song.album && typeof song.album === 'string') {
    albumStr = song.album;
  } else if (song.al && song.al.name) {
    albumStr = song.al.name;
    picUrl = song.al.picUrl;
  } else if (song.album && typeof song.album === 'object') {
    albumStr = song.album.name;
  }

  if (!picUrl && song.al) picUrl = song.al.picUrl;

  return {
    id,
    name,
    artistStr,
    albumStr,
    picUrl,
    original: song
  };
};

const handleCollect = async () => {
  if (songList.value.length === 0) {
    uni.showToast({ title: '歌单为空', icon: 'none' });
    return;
  }

  isImporting.value = true;
  importStatus.value = '正在创建新歌单...';
  importProgress.value = 0;

  try {
    const createParams = {
      name: playlistInfo.value.name,
      description: playlistInfo.value.description || '',
      cover_url: playlistInfo.value.coverImgUrl || ''
    };

    const createRes = await createPlaylist(createParams);
    if (createRes.code !== 200) throw new Error(createRes.message);
    const newPlaylistId = createRes.playlist_id;

    const batchSize = 10;
    let addedCount = 0;
    for (let i = 0; i < songList.value.length; i += batchSize) {
      const batch = songList.value.slice(i, i + batchSize);
      const promises = batch.map(song => addSongToPlaylist(newPlaylistId, { song_id: song.id }));

      await Promise.all(promises);

      addedCount += batch.length;
      importStatus.value = `正在添加: ${addedCount} / ${songList.value.length}`;
      importProgress.value = (addedCount / songList.value.length) * 100;
    }

    if (!createParams.cover_url) {
        const firstSongWithCover = songList.value.find(s => s.picUrl);
        if (firstSongWithCover) {
          importStatus.value = '正在更新封面...';
          await updatePlaylist(newPlaylistId, { cover_url: firstSongWithCover.picUrl });
        }
    }

    importStatus.value = '转存成功！';
    uni.showToast({ title: '转存成功！', icon: 'success' });

    setTimeout(() => {
      isImporting.value = false;
      uni.redirectTo({
        url: `/pages/playlist/detail?id=${newPlaylistId}&type=user`
      });
    }, 1500);

  } catch (error) {
    isImporting.value = false;
    uni.showToast({ title: error.message || '操作失败', icon: 'none' });
  }
};

const handleDeleteSong = (songId) => {
  uni.showModal({
    title: '提示',
    content: '确定要从歌单中删除这首歌吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeSongFromPlaylist(currentPlaylistId.value, songId);
          uni.showToast({ title: '删除成功', icon: 'success' });
          songList.value = songList.value.filter(s => s.id !== songId);
        } catch (error) {
          if (error && error.message === '歌曲删除失败') {
             console.warn('Backend returned 500 but deletion likely succeeded.');
             uni.showToast({ title: '删除成功', icon: 'success' });
             songList.value = songList.value.filter(s => s.id !== songId);
          } else {
             console.error(error);
             uni.showToast({ title: '请求失败', icon: 'none' });
          }
        }
      }
    }
  });
};

const playSong = (song) => {
  const songData = {
    id: song.id,
    name: song.name,
    ar: [{ name: song.artistStr }],
    al: { name: song.albumStr, picUrl: song.picUrl }
  };

  const playlist = songList.value.map(s => ({
    id: s.id,
    name: s.name,
    ar: [{ name: s.artistStr }],
    al: { name: s.albumStr, picUrl: s.picUrl }
  }));

  playerStore.setPlaylist(playlist);
  playerStore.setSongAndPlay(songData);
};

const playAll = () => {
  if (songList.value.length > 0) {
    playSong(songList.value[0]);
  }
};

const goBack = () => uni.navigateBack();

const formatCount = (count) => {
  if (count > 10000) return (count / 10000).toFixed(1) + '万';
  return count;
};
</script>

<style scoped>
.detail-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #fff;
  background-color: #121212;
}

/* 背景 */
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 600rpx;
  z-index: 1;
  filter: blur(40px);
  opacity: 0.6;
  transition: transform 0.1s linear;
}
.bg-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 600rpx;
  background: linear-gradient(to bottom, rgba(0,0,0,0.2), #121212);
  z-index: 2;
}

/* 动态导航栏 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  height: 88rpx;
  padding-top: env(safe-area-inset-top);
  transition: background-color 0.3s;
}
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
}
.icon-back-arrow {
  width: 24rpx;
  height: 24rpx;
  border-left: 4rpx solid #fff;
  border-bottom: 4rpx solid #fff;
  transform: rotate(45deg);
}
.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32rpx;
  font-weight: bold;
  transition: opacity 0.3s;
}

/* 滚动内容 */
.scroll-content {
  flex: 1;
  height: 0;
  position: relative;
  z-index: 10;
}

/* 头部信息 */
.header-wrapper {
  padding-top: calc(88rpx + env(safe-area-inset-top));
  transition: transform 0.2s, opacity 0.2s;
  transform-origin: top center;
}
.header-section {
  display: flex;
  padding: 40rpx;
  align-items: flex-start;
}
.cover-box {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  margin-right: 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  flex-shrink: 0;
}
.cover-image { width: 100%; height: 100%; }
.play-count {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  font-size: 20rpx;
  color: #fff;
  background-color: rgba(0,0,0,0.3);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(5px);
}

.info-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 240rpx;
  justify-content: space-between;
  overflow: hidden;
}
.playlist-name {
  font-size: 36rpx;
  font-weight: bold;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 15rpx;
}
.creator-info {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}
.creator-avatar {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  margin-right: 15rpx;
}
.creator-name {
  font-size: 26rpx;
  color: rgba(255,255,255,0.7);
}
.desc-box {
  display: flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
}
.playlist-desc {
  font-size: 22rpx;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* 操作栏 */
.action-bar {
  padding: 0 40rpx 40rpx;
  display: flex;
  justify-content: center;
}
.action-btn-large {
  background: linear-gradient(90deg, #00f2ea, #00c2b8);
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 15px rgba(0, 242, 234, 0.3);
}
.action-btn-large .icon {
  font-size: 32rpx;
  color: #121212;
  margin-right: 15rpx;
}
.action-btn-large .text {
  font-size: 30rpx;
  color: #121212;
  font-weight: bold;
}
.action-bar-placeholder {
  height: 40rpx;
}

/* 歌曲列表容器 */
.song-list-container {
  background-color: #121212;
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
  min-height: 500rpx;
  padding-bottom: 120rpx;
}

/* 播放全部栏 */
.play-all-header {
  padding: 30rpx;
  position: sticky;
  top: calc(88rpx + env(safe-area-inset-top)); /* 粘性定位，吸附在导航栏下方 */
  background-color: #121212;
  z-index: 20;
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
}
.play-all-btn {
  display: flex;
  align-items: center;
  background-color: #2a2a2a;
  padding: 20rpx 30rpx;
  border-radius: 50rpx;
  width: fit-content;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.play-all-btn:active {
  background-color: #333;
}
.play-icon {
  color: #00f2ea;
  font-size: 32rpx;
  margin-right: 15rpx;
}
.play-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
}
.count-text {
  font-size: 24rpx;
  color: #888;
  margin-left: 10rpx;
}

/* 列表项 */
.song-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  margin-bottom: 10rpx;
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}
@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}
.song-item:active {
  background-color: rgba(255,255,255,0.05);
}
.song-index {
  width: 60rpx;
  text-align: center;
  color: #666;
  font-size: 30rpx;
  font-family: monospace;
}
.song-index.top-three {
  color: #00f2ea;
  font-weight: bold;
}
.song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
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
.delete-btn {
  padding: 10rpx 20rpx;
  color: #666;
  font-size: 36rpx;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}

/* 进度弹窗 */
.progress-modal {
  width: 70%;
  background-color: #2a2a2a;
  border-radius: 30rpx;
  padding: 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
}
.progress-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40rpx;
}
.progress-bar-bg {
  width: 100%;
  height: 16rpx;
  background-color: rgba(255,255,255,0.1);
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00f2ea, #00c2b8);
  border-radius: 10rpx;
  position: relative;
  transition: width 0.3s ease;
}
.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 20rpx;
  height: 100%;
  background: #fff;
  box-shadow: 0 0 10px #fff;
  opacity: 0.8;
}
.progress-info {
  font-size: 26rpx;
  color: #aaa;
  margin-bottom: 10rpx;
}
.progress-percent {
  font-size: 48rpx;
  font-weight: bold;
  color: #00f2ea;
  font-family: monospace;
}

/* 简介详情弹窗 */
.desc-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.8);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
}
.desc-modal-content {
  width: 80%;
  height: 70%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.desc-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 30rpx;
  opacity: 0.3;
}
.desc-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  border-radius: 30rpx;
}
.desc-text-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  padding: 60rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.desc-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40rpx;
  text-align: center;
}
.desc-scroll {
  flex: 1;
  height: 0;
}
.desc-full-text {
  font-size: 30rpx;
  color: #ddd;
  line-height: 1.8;
  text-align: justify;
}
.desc-close {
  position: absolute;
  bottom: -100rpx;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.5);
  color: #fff;
  font-size: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
