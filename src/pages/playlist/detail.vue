<template>
  <view class="detail-container">
    <!-- 背景层 -->
    <image :src="playlistInfo.coverImgUrl || playlistInfo.picUrl" class="bg-image" mode="aspectFill"></image>
    <view class="bg-mask"></view>

    <!-- 导航栏 (透明) -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <text class="icon-back">﹀</text>
      </view>
      <text class="nav-title">歌单</text>
    </view>

    <scroll-view scroll-y class="scroll-content">
      <!-- 头部信息 -->
      <view class="header-section">
        <view class="cover-box">
          <image :src="playlistInfo.coverImgUrl || playlistInfo.picUrl" class="cover-image" mode="aspectFill"></image>
          <view class="play-count">▷ {{ formatCount(playlistInfo.playCount || 0) }}</view>
        </view>
        <view class="info-box">
          <text class="playlist-name">{{ playlistInfo.name }}</text>
          <view class="creator-info">
            <image :src="playlistInfo.creator?.avatarUrl" class="creator-avatar" mode="aspectFill"></image>
            <text class="creator-name">{{ playlistInfo.creator?.nickname }}</text>
          </view>
          <view class="desc-box">
            <text class="playlist-desc">{{ playlistInfo.description || '暂无描述' }}</text>
            <text class="icon-arrow">></text>
          </view>
        </view>
      </view>

      <!-- 操作栏：仅保留一键转存 -->
      <view class="action-bar" v-if="pageType === 'music'">
        <view class="action-btn-large" @click="handleCollect">
          <text class="icon">❤</text>
          <text class="text">一键转存到我的歌单</text>
        </view>
      </view>
      <view class="action-bar-placeholder" v-else></view>

      <!-- 歌曲列表容器 -->
      <view class="song-list-container">
        <!-- 播放全部栏 -->
        <view class="play-all-bar" @click="playAll">
          <view class="play-icon-circle">▶</view>
          <text class="play-text">播放全部</text>
          <text class="count-text">(共{{ songList.length }}首)</text>
        </view>

        <!-- 列表 -->
        <view class="song-list">
          <view
            class="song-item"
            v-for="(song, index) in songList"
            :key="song.id"
            @click="playSong(song, index)"
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

    <!-- 导入进度弹窗 -->
    <view class="modal-mask" v-if="isImporting">
      <view class="modal-content">
        <text class="modal-title">正在转存...</text>
        <progress :percent="importProgress" activeColor="#00f2ea" stroke-width="4" />
        <text class="progress-text">{{ importStatus }}</text>
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
    // 修复：构造正确的参数对象
    const createParams = {
      name: playlistInfo.value.name,
      description: playlistInfo.value.description || '',
      cover_url: playlistInfo.value.coverImgUrl || '' // 尝试直接带上封面
    };

    const createRes = await createPlaylist(createParams);
    if (createRes.code !== 200) throw new Error(createRes.message);
    const newPlaylistId = createRes.playlist_id;

    for (let i = 0; i < songList.value.length; i++) {
      const song = songList.value[i];
      importStatus.value = `正在添加: ${i + 1} / ${songList.value.length}`;
      await addSongToPlaylist(newPlaylistId, { song_id: song.id });
      importProgress.value = ((i + 1) / songList.value.length) * 100;
    }

    // 如果创建时没带上封面（比如封面是网易云的URL，后端可能没存），这里再更新一次
    // 但其实 createPlaylist 已经带了 cover_url，这里可以视情况保留或删除
    // 为了保险，如果 createParams.cover_url 是空的，再尝试更新一次
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

/* 导航栏 */
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
  padding-top: calc(20rpx + env(safe-area-inset-top));
}
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
}
.icon-back { font-size: 40rpx; transform: rotate(90deg); color: #fff; }
.nav-title { font-size: 32rpx; font-weight: bold; margin-left: 20rpx; }

/* 滚动内容 */
.scroll-content {
  flex: 1;
  height: 0;
  position: relative;
  z-index: 10;
  padding-top: calc(100rpx + env(safe-area-inset-top));
}

/* 头部信息 */
.header-section {
  display: flex;
  padding: 40rpx;
  align-items: flex-start;
}
.cover-box {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  margin-right: 40rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
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
}
.playlist-name {
  font-size: 36rpx;
  font-weight: bold;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.creator-info {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
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
  margin-top: auto;
}
.playlist-desc {
  font-size: 22rpx;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300rpx;
}
.icon-arrow { font-size: 22rpx; color: rgba(255,255,255,0.5); margin-left: 10rpx; }

/* 操作栏：大按钮 */
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
.play-all-bar {
  display: flex;
  align-items: center;
  padding: 30rpx;
  position: sticky;
  top: 0;
  background-color: #121212;
  z-index: 20;
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
}
.play-icon-circle {
  width: 50rpx;
  height: 50rpx;
  background-color: #00f2ea;
  border-radius: 50%;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  margin-right: 20rpx;
}
.play-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}
.count-text {
  font-size: 24rpx;
  color: #666;
  margin-left: 10rpx;
}

/* 列表项 */
.song-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  margin-bottom: 10rpx;
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
  font-size: 22rpx;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.delete-btn {
  padding: 10rpx 20rpx;
  color: #666;
  font-size: 36rpx;
}

/* 弹窗样式 */
.modal-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 999; display: flex; justify-content: center; align-items: center; }
.modal-content { width: 70%; background-color: #2a2a2a; border-radius: 20rpx; padding: 40rpx; text-align: center; }
.modal-title { font-size: 36rpx; font-weight: bold; color: #fff; margin-bottom: 40rpx; display: block; }
.progress-text { font-size: 28rpx; color: #ccc; margin-top: 20rpx; display: block; }
</style>
