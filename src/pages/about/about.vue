<template>
  <view class="about-container">
    <h1 class="title">关于我们</h1>
    <view class="content">
      <text class="paragraph">
        这是一款模仿网易云音乐的微信小程序，旨在提供流畅的音乐体验和便捷的音乐解析功能。
      </text>
      <text class="paragraph">
        项目基于 UniApp 和 Vue 3 开发，后端服务由 Flask 强力驱动。
      </text>
      <h2 class="subtitle">温馨提示</h2>
      <text class="paragraph">
        1. 本项目仅供学习和技术交流使用，请勿用于商业用途。
      </text>
      <text class="paragraph">
        2. 所有音乐资源版权归原作者所有，请支持正版音乐。
      </text>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.about-container {
  padding: 40rpx;
  color: #e0e0e0;
  text-align: center;
}
.title {
  font-size: 48rpx;
  color: #00f2ea;
  margin-bottom: 50rpx;
}
.content {
  text-align: left;
}
.subtitle {
  font-size: 36rpx;
  color: #fff;
  margin-top: 60rpx;
  margin-bottom: 30rpx;
  border-left: 4px solid #00f2ea;
  padding-left: 15rpx;
}
.paragraph {
  display: block;
  font-size: 28rpx;
  line-height: 1.8;
  margin-bottom: 20rpx;
}
</style>
