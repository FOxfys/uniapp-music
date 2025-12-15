<template>
  <view class="my-container">
    <!-- 登录/用户信息 -->
    <view class="user-profile" @click="handleLogin">
      <image class="avatar" :src="userStore.isLoggedIn ? (userStore.userInfo.avatarUrl || '/static/default-avatar.png') : '/static/default-avatar.png'"></image>
      <text class="nickname">{{ userStore.isLoggedIn ? userStore.userInfo.username : '点击登录' }}</text>
    </view>

    <!-- 功能列表 -->
    <view class="action-list">
      <view class="action-item" @click="goToHistory">
        <text>播放历史</text>
        <text class="arrow">></text>
      </view>
      <view class="action-item" @click="showCreateModal">
        <text>创建歌单</text>
        <text class="arrow">></text>
      </view>
       <view class="action-item" @click="goToAbout">
        <text>关于我们</text>
        <text class="arrow">></text>
      </view>
    </view>

    <!-- 我的歌单列表 -->
    <view class="playlist-section" v-if="userStore.isLoggedIn">
      <view class="section-header">
        <text class="section-title">我的歌单 ({{ myPlaylists.length }})</text>
      </view>
      <view class="playlist-list">
        <view
          class="playlist-item"
          v-for="item in myPlaylists"
          :key="item.id"
          @click="goToPlaylist(item.id)"
          @longpress="handleLongPress(item)"
        >
          <image :src="item.cover_url || '/static/default-avatar.png'" class="playlist-cover" mode="aspectFill"></image>
          <view class="playlist-info">
            <text class="playlist-name">{{ item.name }}</text>
            <text class="playlist-count">{{ item.song_count || 0 }} 首</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section" v-if="userStore.isLoggedIn">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
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
      // 后端返回400，说明是明确的业务错误
      uni.showToast({ title: res.message || '创建失败', icon: 'none' });
    }
  } catch (error) {
    // 后端返回500，大概率是重名冲突
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
  padding: 40rpx;
  color: #fff;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}
.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}
.avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  margin-bottom: 20rpx;
  border: 2px solid #00f2ea;
}
.nickname {
  font-size: 32rpx;
}
.action-list {
  background-color: #1a1a1a;
  border-radius: 15rpx;
  margin-bottom: 40rpx;
}
.action-item {
  display: flex;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1px solid #2a2a2a;
  cursor: pointer;
}
.action-item:last-child {
  border-bottom: none;
}
.arrow {
  color: #555;
}

/* 歌单列表 */
.playlist-section {
  margin-bottom: 40rpx;
}
.section-title {
  font-size: 30rpx;
  color: #aaa;
  margin-bottom: 20rpx;
  display: block;
}
.playlist-list {
  background-color: #1a1a1a;
  border-radius: 15rpx;
}
.playlist-item {
  display: flex;
  padding: 20rpx;
  border-bottom: 1px solid #2a2a2a;
  align-items: center;
}
.playlist-item:last-child {
  border-bottom: none;
}
.playlist-cover {
  width: 100rpx;
  height: 100rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
  background-color: #333;
}
.playlist-info {
  display: flex;
  flex-direction: column;
}
.playlist-name {
  font-size: 30rpx;
  color: #fff;
  margin-bottom: 10rpx;
}
.playlist-count {
  font-size: 24rpx;
  color: #666;
}

.logout-section {
  padding: 0 20rpx;
}
.logout-btn {
  background-color: #333;
  color: #ff5555;
  border: 1px solid #ff5555;
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
}
.modal-content {
  width: 80%;
  background-color: #2a2a2a;
  border-radius: 20rpx;
  padding: 40rpx;
}
.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 30rpx;
  display: block;
  text-align: center;
}
.modal-input {
  background-color: #1a1a1a;
  color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  border: 1px solid #333;
}
.modal-textarea {
  background-color: #1a1a1a;
  color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 40rpx;
  border: 1px solid #333;
  height: 150rpx;
  width: 100%;
  box-sizing: border-box;
}
.modal-btns {
  display: flex;
  justify-content: space-between;
}
.modal-btn {
  padding: 15rpx 40rpx;
  border-radius: 10rpx;
  font-size: 30rpx;
}
.modal-btn.cancel {
  color: #aaa;
}
.modal-btn.confirm {
  color: #00f2ea;
}

/* 封面上传 */
.cover-upload-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30rpx;
}
.cover-preview {
  width: 160rpx;
  height: 160rpx;
  border-radius: 15rpx;
  overflow: hidden;
  position: relative;
  border: 2px dashed #555;
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
  padding: 4rpx 0;
}
</style>
