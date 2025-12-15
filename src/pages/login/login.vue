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
import { ref, onMounted } from 'vue';
import { login, register } from '@/api/auth.js';
import { userStore } from '@/store/user.js';

const isLoginMode = ref(true);
const username = ref('');
const password = ref('');
const confirmPassword = ref('');

onMounted(() => {
  const history = uni.getStorageSync('loginHistory');
  if (history) {
    username.value = history.username || '';
    password.value = history.password || '';
  }
});

const handleSubmit = async () => {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '处理中...' });

  try {
    if (isLoginMode.value) {
      const loginRes = await login({ username: username.value, password: password.value });
      if (loginRes.code === 200) {
        // 登录成功后，立即获取用户信息
        const userInfo = await userStore.fetchUserInfo();

        if (userInfo) {
          uni.setStorageSync('loginHistory', {
            username: username.value,
            password: password.value
          });

          uni.showToast({ title: '登录成功', icon: 'success' });

          setTimeout(() => {
            uni.switchTab({ url: '/pages/my/my' });
          }, 1000);
        } else {
          uni.showToast({ title: '获取用户信息失败', icon: 'none' });
        }
      } else {
        uni.showToast({ title: loginRes.message || '登录失败', icon: 'none' });
      }
    } else {
      // 注册逻辑
      const regRes = await register({ username: username.value, password: password.value, confirm_password: confirmPassword.value });
      if (regRes.code === 200) {
        uni.showToast({ title: '注册成功，请登录', icon: 'success' });
        isLoginMode.value = true;
      } else {
        uni.showToast({ title: regRes.message || '注册失败', icon: 'none' });
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
