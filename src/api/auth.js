// src/api/auth.js
import { request } from './request';

// 用户登录
export const login = (data) => {
  return request({
    url: '/user/login',
    method: 'POST',
    data
  });
};

// 用户注册
export const register = (data) => {
  return request({
    url: '/user/register',
    method: 'POST',
    data
  });
};

// 用户登出
export const logout = () => {
  return request({
    url: '/user/logout',
    method: 'GET'
  });
};

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/user/get_user_info',
    method: 'GET'
  });
};
