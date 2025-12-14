// src/store/user.js
import { reactive } from 'vue';

export const userStore = reactive({
  isLoggedIn: uni.getStorageSync('token') ? true : false,
  userInfo: uni.getStorageSync('userInfo') || {},
  token: uni.getStorageSync('token') || '',

  login(userData, token) {
    this.isLoggedIn = true;
    this.userInfo = userData;
    this.token = token;
    uni.setStorageSync('token', token);
    uni.setStorageSync('userInfo', userData);
  },

  logout() {
    this.isLoggedIn = false;
    this.userInfo = {};
    this.token = '';
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');
  }
});
