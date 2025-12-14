// src/api/playlist.js
import { request } from './request';

/**
 * 获取用户歌单列表
 */
export const getUserPlaylists = () => {
  return request({
    url: '/user/playlists',
    method: 'GET'
  });
};

/**
 * 创建歌单
 * @param {string} name - 歌单名称
 */
export const createPlaylist = (name) => {
  return request({
    url: '/user/create_playlist',
    method: 'POST',
    data: { name }
  });
};

/**
 * 添加歌曲到歌单
 * @param {number} playlist_id - 歌单ID
 * @param {Object} songData - 歌曲信息
 */
export const addSongToPlaylist = (playlist_id, songData) => {
  return request({
    url: `/user/playlist/${playlist_id}/add_song`,
    method: 'POST',
    data: songData
  });
};

/**
 * 获取播放历史
 * @param {Object} params - { page, limit }
 */
export const getPlayHistory = (params) => {
	return request({
		url: '/user/get_history',
		method: 'GET',
		data: params
	});
};

/**
 * 保存播放历史
 * @param {Object} songData - { song_id, song_name, artist, album }
 */
export const savePlayHistory = (songData) => {
	return request({
		url: '/user/save_history',
		method: 'POST',
		data: songData
	});
};
