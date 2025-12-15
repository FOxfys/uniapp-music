// src/store/user.js
import { reactive } from 'vue';
import { logout as logoutApi, getUserInfo } from '../api/auth.js';

const storedUserInfo = uni.getStorageSync('userInfo') || {};
const hasLogin = Object.keys(storedUserInfo).length > 0;

export const userStore = reactive({
  isLoggedIn: hasLogin,
  userInfo: storedUserInfo,

  // 设置登录状态
  setLoginState(userData) {
    this.isLoggedIn = true;
    this.userInfo = { ...this.userInfo, ...userData };
    uni.setStorageSync('userInfo', this.userInfo);
    console.log('User state updated:', this.userInfo);
  },

  // 从后端拉取真实用户信息
  async fetchUserInfo() {
    try {
      const res = await getUserInfo();
      // 后端返回结构: { message: '...', data: { id: ..., username: ... } }
      // request.js 可能会把 res.data 这一层解包，也可能不会，取决于具体实现
      // 我们这里做个兼容
      const userData = res.data || res;
      
      if (userData && userData.id) {
        this.setLoginState(userData);
        return userData;
      }
    } catch (error) {
      console.error('Fetch user info failed:', error);
    }
    return null;
  },

  async logout() {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      this.isLoggedIn = false;
      this.userInfo = {};
      uni.removeStorageSync('userInfo');
      uni.removeStorageSync('loginHistory');
      uni.removeStorageSync('session_cookie');
      console.log('User logged out');
    }
  }
});
