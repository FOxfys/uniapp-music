<template>
  <view class="login-container">
    <h1 class="title">{{ isLoginMode ? '登录' : '注册' }}</h1>

    <view class="input-group">
      <input type="text" v-model="username" placeholder="请输入用户名" class="input-field" />
      <input type="password" v-model="password" placeholder="请输入密码" class="input-field" />
      <input v-if="!isLoginMode" type="password" v-model="confirmPassword" placeholder="请确认密码" class="input-field" />
    </view>

    <button class="submit-btn" @click="handleSubmit">{{ isLoginMode ? '登 录' : '注 册' }}</button>

    <view class="switch-mode">
      <text @click="isLoginMode = !isLoginMode">
        {{ isLoginMode ? '还没有账号？去注册' : '已有账号？去登录' }}
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { login, register } from '@/api/auth.js';
import { userStore } from '@/store/user.js';

const isLoginMode = ref(true);
const username = ref('');
const password = ref('');
const confirmPassword = ref('');

const handleSubmit = async () => {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '处理中...' });

  try {
    if (isLoginMode.value) {
      // 登录
      const res = await login({ username: username.value, password: password.value });
      if (res.code === 200) {
        // 假设登录成功返回 user_id 和 token
        // 注意：你的文档只返回了 user_id，这里我们先模拟一个 token
        const token = `fake-token-for-${res.user_id}`;
        userStore.login({ username: username.value, id: res.user_id }, token);

        uni.showToast({ title: '登录成功', icon: 'success' });
        uni.navigateBack(); // 返回上一页
      }
    } else {
      // 注册
      if (password.value !== confirmPassword.value) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
      }
      const res = await register({ username: username.value, password: password.value, confirm_password: confirmPassword.value });
      if (res.code === 200) {
        uni.showToast({ title: '注册成功，请登录', icon: 'success' });
        isLoginMode.value = true; // 切换到登录模式
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    uni.hideLoading();
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  padding: 80rpx 50rpx;
  background-color: #121212;
  min-height: 100vh;
  color: #fff;
}
.title {
  font-size: 60rpx;
  color: #00f2ea;
  text-align: center;
  margin-bottom: 100rpx;
}
.input-group {
  margin-bottom: 50rpx;
}
.input-field {
  background-color: #2a2a2a;
  border-radius: 15rpx;
  padding: 25rpx;
  margin-bottom: 30rpx;
  color: #fff;
  font-size: 30rpx;
}
.submit-btn {
  background-image: linear-gradient(45deg, #00f2ea, #00c2b8);
  color: #121212;
  font-weight: bold;
  border-radius: 15rpx;
  padding: 25rpx;
}
.switch-mode {
  margin-top: 40rpx;
  text-align: center;
  color: #888;
  font-size: 28rpx;
}
</style>
