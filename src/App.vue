<template>
  <view class="app-container">
    <!-- 页面内容 -->
    <router-view></router-view>
  </view>
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('App Launch');
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style>
/* 每个页面公共css */
.app-container {
  /* 这里的 padding-bottom 可以保留，防止内容被底部 TabBar 遮挡 */
  padding-bottom: 0;
}
</style>
