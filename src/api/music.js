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
 * 获取热门歌单
 */
export const getHotPlaylists = () => {
  return request({
    url: '/music/hot_playlists',
    method: 'GET'
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
