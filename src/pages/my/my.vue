<template>
  <view class="my-container">
    <!-- 登录/用户信息 -->
    <view class="user-profile" @click="handleLogin">
      <image class="avatar" :src="userStore.userInfo.avatarUrl || '/static/default-avatar.png'"></image>
      <text class="nickname">{{ userStore.isLoggedIn ? userStore.userInfo.username : '点击登录' }}</text>
    </view>

    <!-- 功能列表 -->
    <view class="action-list">
      <view class="action-item" @click="goToHistory">
        <text>播放历史</text>
        <text class="arrow">></text>
      </view>
      <view class="action-item" @click="createPlaylist">
        <text>创建歌单</text>
        <text class="arrow">></text>
      </view>
       <view class="action-item" @click="goToAbout">
        <text>关于我们</text>
        <text class="arrow">></text>
      </view>
    </view>

    <!-- 全局播放器控件 -->
    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { userStore } from '@/store/user.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

const goToHistory = () => {
  uni.navigateTo({ url: '/pages/my/history' });
};

const goToAbout = () => {
  uni.navigateTo({ url: '/pages/about/about' });
};

const handleLogin = () => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/login' });
  }
};

const createPlaylist = () => {
  uni.showToast({ title: '功能开发中...', icon: 'none' });
};
</script>

<style scoped>
.my-container {
  padding: 40rpx;
  color: #fff;
}
.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
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
</style>
