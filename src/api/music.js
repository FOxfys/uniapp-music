// src/api/music.js
import { request } from './request';

/**
 * 音乐搜索
 * @param {string} name - 搜索关键词
 * @param {number} page - 页码
 */
export const searchMusic = (params) => {
  return request({
    url: '/music/search',
    method: 'GET',
    data: params
  });
};

/**
 * 音乐解析
 * @param {Object} params - { ids, level, type }
 */
export const parseMusic = (params) => {
  return request({
    url: '/music/jx',
    method: 'GET', // 或者 'POST'，根据你的后端配置
    data: params
  });
};

/**
 * 获取热门歌单 (原始接口)
 */
export const getHotPlaylists = () => {
  return request({
    url: '/music/hot_playlists',
    method: 'GET'
  });
};

/**
 * 获取热门歌单 (带缓存)
 */
export const getHotPlaylistsWithCache = () => {
  const CACHE_KEY = 'hot_playlists_cache';
  const EXPIRATION_MS = 1 * 60 * 60 * 1000; // 1小时

  return new Promise((resolve, reject) => {
    const cachedData = uni.getStorageSync(CACHE_KEY);

    if (cachedData && (Date.now() - cachedData.timestamp < EXPIRATION_MS)) {
      console.log('[Cache] Hit: Returning cached hot playlists.');
      resolve(cachedData.data);
      return;
    }

    console.log('[Cache] Miss: Fetching new hot playlists.');
    request({
      url: '/music/hot_playlists',
      method: 'GET'
    }).then(res => {
      uni.setStorageSync(CACHE_KEY, {
        data: res,
        timestamp: Date.now()
      });
      resolve(res);
    }).catch(err => {
      // 如果请求失败，但有旧的缓存，也返回旧缓存，保证可用性
      if (cachedData) {
        console.warn('[Cache] API failed, returning stale cache.');
        resolve(cachedData.data);
      } else {
        reject(err);
      }
    });
  });
};


/**
 * 获取歌单详情 (网易云的歌单)
 * @param {number} sid - 歌单ID
 */
export const getPlaylistDetail = (sid) => {
  return request({
    url: `/music/playlist/${sid}`,
    method: 'GET'
  });
};

/**
 * 获取歌曲播放URL
 * @param {number} song_id - 歌曲ID
 */
export const getSongUrl = (song_id) => {
  return request({
    url: `/music/song/url/${song_id}`,
    method: 'GET'
  });
};

/**
 * 获取歌词
 * @param {number} song_id - 歌曲ID
 */
export const getLyric = (song_id) => {
  return request({
    url: `/music/song/lyric/${song_id}`,
    method: 'GET'
  });
};

/**
 * 获取歌曲封面
 * @param {number} song_id - 歌曲ID
 */
export const getSongCover = (song_id) => {
  return request({
    url: `/music/song/cover/${song_id}`,
    method: 'GET'
  });
};

/**
 * 获取网易云用户歌单
 * @param {number} uid - 用户ID
 */
export const getUserPlaylistsMusic = (uid) => {
  return request({
    url: `/music/userlist/${uid}`,
    method: 'GET'
  });
};
