<template>
  <view class="my-container">
    <!-- 动态背景 -->
    <view class="bg-gradient"></view>
    <view class="bg-noise"></view>

    <!-- 用户信息卡片 -->
    <view class="user-card" @click="handleLogin">
      <view class="avatar-wrapper">
        <image
          class="avatar"
          :src="userStore.isLoggedIn ? (userStore.userInfo.avatarUrl || '/static/default-avatar.png') : '/static/default-avatar.png'"
          mode="aspectFill"
        ></image>
        <view class="avatar-glow"></view>
      </view>
      <view class="user-info">
        <text class="nickname">{{ userStore.isLoggedIn ? userStore.userInfo.username : '点击登录' }}</text>
        <text class="user-desc" v-if="userStore.isLoggedIn">音乐让生活更美好</text>
        <text class="user-desc" v-else>登录同步你的音乐世界</text>
      </view>
      <!-- 已移除 login-arrow -->
    </view>

    <!-- 功能入口 (网格布局) -->
    <view class="action-grid">
      <view class="action-item" @click="goToHistory">
        <view class="icon-box history-icon">🕒</view>
        <text class="action-text">播放历史</text>
      </view>
      <view class="action-item" @click="showCreateModal">
        <view class="icon-box create-icon">➕</view>
        <text class="action-text">创建歌单</text>
      </view>
      <view class="action-item" @click="goToAbout">
        <view class="icon-box about-icon">ℹ️</view>
        <text class="action-text">关于我们</text>
      </view>
      <view class="action-item" @click="handleLogout" v-if="userStore.isLoggedIn">
        <view class="icon-box logout-icon">🚪</view>
        <text class="action-text">退出登录</text>
      </view>
    </view>

    <!-- 我的歌单列表 -->
    <view class="playlist-section" v-if="userStore.isLoggedIn">
      <view class="section-header">
        <text class="section-title">我的歌单</text>
        <text class="playlist-count">{{ myPlaylists.length }} 个</text>
      </view>

      <view class="playlist-list">
        <view
          class="playlist-card"
          v-for="(item, index) in myPlaylists"
          :key="item.id"
          @click="goToPlaylist(item.id)"
          @longpress="handleLongPress(item)"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <image :src="item.cover_url || '/static/default-avatar.png'" class="playlist-cover" mode="aspectFill"></image>
          <view class="playlist-info">
            <text class="playlist-name">{{ item.name }}</text>
            <text class="playlist-meta">{{ item.song_count || 0 }} 首歌曲</text>
          </view>
          <!-- 已移除 playlist-arrow -->
        </view>
      </view>
    </view>

    <!-- 创建歌单弹窗 -->
    <view class="modal-mask" v-if="isModalVisible">
      <view class="modal-content">
        <text class="modal-title">新建歌单</text>

        <!-- 封面选择区 -->
        <view class="cover-upload-section">
          <view class="cover-preview" @click="chooseCoverImage">
            <image :src="selectedCover || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="upload-tip">点击更换封面</view>
          </view>
        </view>

        <input class="modal-input" v-model="newPlaylistName" placeholder="歌单标题 (必填)" />
        <textarea class="modal-textarea" v-model="newPlaylistDesc" placeholder="歌单描述 (选填)" />

        <view class="modal-btns">
          <text class="modal-btn cancel" @click="isModalVisible = false">取消</text>
          <text class="modal-btn confirm" @click="handleCreatePlaylist">提交</text>
        </view>
      </view>
    </view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { userStore } from '@/store/user.js';
import { createPlaylist, getUserPlaylists, deletePlaylist } from '@/api/playlist.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const isModalVisible = ref(false);
const newPlaylistName = ref('');
const newPlaylistDesc = ref('');
const selectedCover = ref('');
const myPlaylists = ref([]);

onShow(() => {
  if (userStore.isLoggedIn) {
    fetchUserPlaylists();
  } else {
    myPlaylists.value = [];
  }
});

const fetchUserPlaylists = async () => {
  try {
    const res = await getUserPlaylists();
    if (res.code === 200 && res.playlists) {
      myPlaylists.value = res.playlists;
    }
  } catch (error) {
    console.error('Fetch playlists failed:', error);
  }
};

const requireLogin = () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      complete: () => {
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/login/login' });
        }, 1500);
      }
    });
    return false;
  }
  return true;
};

const goToHistory = () => {
  if (requireLogin()) {
    uni.navigateTo({ url: '/pages/my/history' });
  }
};

const showCreateModal = () => {
  if (requireLogin()) {
    isModalVisible.value = true;
    newPlaylistName.value = '';
    newPlaylistDesc.value = '';
    selectedCover.value = '';
  }
};

const chooseCoverImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];

      uni.getFileSystemManager().readFile({
        filePath: tempFilePath,
        encoding: 'base64',
        success: (data) => {
          const base64 = 'data:image/jpeg;base64,' + data.data;
          selectedCover.value = base64;
        },
        fail: (err) => {
          console.error('Read file failed:', err);
          uni.showToast({ title: '图片读取失败', icon: 'none' });
        }
      });
    }
  });
};

const handleCreatePlaylist = async () => {
  if (!newPlaylistName.value.trim()) {
    uni.showToast({ title: '请输入名称', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '创建中...' });
  try {
    const params = {
      name: newPlaylistName.value,
      description: newPlaylistDesc.value,
      cover_url: selectedCover.value || ''
    };

    const res = await createPlaylist(params);
    if (res.code === 200) {
      uni.showToast({ title: '创建成功', icon: 'success' });
      isModalVisible.value = false;
      fetchUserPlaylists();
    } else {
      uni.showToast({ title: res.message || '创建失败', icon: 'none' });
    }
  } catch (error) {
    if (error && error.message && error.message.includes('创建失败')) {
        uni.showToast({ title: '歌单名称可能已被使用', icon: 'none', duration: 2000 });
    } else {
        uni.showToast({ title: '请求失败', icon: 'none' });
    }
    console.error(error);
  } finally {
    uni.hideLoading();
  }
};

const handleLongPress = (playlist) => {
  uni.showActionSheet({
    itemList: ['删除歌单'],
    itemColor: '#ff5555',
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showModal({
          title: '确认删除',
          content: `确定要删除歌单 "${playlist.name}" 吗？`,
          success: async (modalRes) => {
            if (modalRes.confirm) {
              try {
                const delRes = await deletePlaylist(playlist.id);
                if (delRes.code === 200) {
                  uni.showToast({ title: '删除成功', icon: 'success' });
                  fetchUserPlaylists();
                } else {
                  uni.showToast({ title: delRes.message || '删除失败', icon: 'none' });
                }
              } catch (error) {
                console.error(error);
              }
            }
          }
        });
      }
    }
  });
};

const goToPlaylist = (id) => {
  uni.navigateTo({ url: `/pages/playlist/detail?id=${id}&type=user` });
};

const goToAbout = () => {
  uni.navigateTo({ url: '/pages/about/about' });
};

const handleLogin = () => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/login' });
  }
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        myPlaylists.value = [];
        uni.showToast({ title: '已退出', icon: 'none' });
      }
    }
  });
};
</script>

<style scoped>
.my-container {
  min-height: 100vh;
  background-color: #121212;
  color: #fff;
  padding: 40rpx 30rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
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

/* 用户信息卡片 */
.user-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 40rpx;
  border-radius: 30rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 40rpx;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
.avatar-wrapper {
  position: relative;
  margin-right: 30rpx;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
}
.avatar-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 242, 234, 0.4);
  animation: pulse 3s infinite;
}
.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}
.user-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

@keyframes pulse {
  0% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 0.4; transform: scale(1); }
}

/* 功能入口 (网格) */
.action-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  margin-bottom: 50rpx;
}
.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 20rpx 10rpx;
  border-radius: 20rpx;
  transition: background 0.2s;
}
.action-item:active {
  background: rgba(255, 255, 255, 0.08);
}
.icon-box {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-bottom: 15rpx;
  background: rgba(255, 255, 255, 0.05);
}
.history-icon { color: #00f2ea; }
.create-icon { color: #ff0055; }
.about-icon { color: #ffcc00; }
.logout-icon { color: #999; }
.action-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 歌单列表 */
.playlist-section {
  position: relative;
  z-index: 1;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30rpx;
  padding: 0 10rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  border-left: 6rpx solid #00f2ea;
  padding-left: 20rpx;
}
.playlist-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.playlist-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.playlist-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 20rpx;
  border-radius: 20rpx;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}
.playlist-card:active {
  background: rgba(255, 255, 255, 0.08);
}
.playlist-cover {
  width: 100rpx;
  height: 100rpx;
  border-radius: 15rpx;
  margin-right: 25rpx;
}
.playlist-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.playlist-name {
  font-size: 30rpx;
  color: #fff;
  margin-bottom: 8rpx;
}
.playlist-meta {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
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
.modal-content {
  width: 80%;
  background-color: #2a2a2a;
  border-radius: 30rpx;
  padding: 50rpx;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
}
.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40rpx;
  display: block;
  text-align: center;
}
.modal-input {
  background-color: rgba(0,0,0,0.3);
  color: #fff;
  padding: 25rpx;
  border-radius: 15rpx;
  margin-bottom: 20rpx;
  border: 1px solid rgba(255,255,255,0.1);
}
.modal-textarea {
  background-color: rgba(0,0,0,0.3);
  color: #fff;
  padding: 25rpx;
  border-radius: 15rpx;
  margin-bottom: 40rpx;
  border: 1px solid rgba(255,255,255,0.1);
  height: 150rpx;
  width: 100%;
  box-sizing: border-box;
}
.modal-btns {
  display: flex;
  justify-content: space-between;
  gap: 30rpx;
}
.modal-btn {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 50rpx;
  font-size: 30rpx;
  text-align: center;
}
.modal-btn.cancel {
  background-color: rgba(255,255,255,0.1);
  color: #aaa;
}
.modal-btn.confirm {
  background: linear-gradient(90deg, #00f2ea, #00c2b8);
  color: #121212;
  font-weight: bold;
}

/* 封面上传 */
.cover-upload-section {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}
.cover-preview {
  width: 180rpx;
  height: 180rpx;
  border-radius: 20rpx;
  overflow: hidden;
  position: relative;
  border: 2px dashed rgba(255,255,255,0.3);
  background-color: rgba(0,0,0,0.2);
}
.cover-preview image {
  width: 100%;
  height: 100%;
}
.upload-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  padding: 6rpx 0;
}
</style>
