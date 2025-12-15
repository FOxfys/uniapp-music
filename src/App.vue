<template>
  <view class="app-container">
    <!-- 页面内容 -->
    <router-view></router-view>
  </view>
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { userStore } from '@/store/user.js';

onLaunch(() => {
  console.log('App Launch');
  const cookie = uni.getStorageSync('session_cookie');
  if (cookie) {
    console.log('Found cookie, attempting to fetch user info...');
    userStore.fetchUserInfo();
  }
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style>
/* 强制覆盖小程序的默认背景色 */
page {
  background-color: #121212;
  min-height: 100vh;
}

/* 每个页面公共css */
.app-container {
  padding-bottom: 0;
  background-color: #121212; /* 双重保险 */
  min-height: 100vh;
}
</style>
