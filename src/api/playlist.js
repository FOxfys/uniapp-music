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
 * 获取用户歌单详情
 * @param {number} playlist_id - 歌单ID
 */
export const getUserPlaylistDetail = (playlist_id) => {
  return request({
    url: `/user/playlist/${playlist_id}`,
    method: 'GET'
  });
};

/**
 * 创建歌单
 * @param {Object} data - { name, description, cover_url }
 */
export const createPlaylist = (data) => {
  return request({
    url: '/user/create_playlist',
    method: 'POST',
    data: data
  });
};

/**
 * 更新歌单信息
 * @param {number} playlist_id - 歌单ID
 * @param {Object} data - { name, cover_url }
 */
export const updatePlaylist = (playlist_id, data) => {
  return request({
    url: `/user/playlist/${playlist_id}`,
    method: 'PUT',
    data: data
  });
};

/**
 * 删除歌单
 * @param {number} playlist_id - 歌单ID
 */
export const deletePlaylist = (playlist_id) => {
  return request({
    url: `/user/playlist/${playlist_id}`,
    method: 'DELETE'
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
 * 从歌单删除歌曲
 * @param {number} playlist_id - 歌单ID
 * @param {number} song_id - 歌曲ID
 */
export const removeSongFromPlaylist = (playlist_id, song_id) => {
  return request({
    url: `/user/playlist/${playlist_id}/remove_song/${song_id}`,
    method: 'DELETE'
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
 * @param {Object} songData - { song_id }
 */
export const savePlayHistory = (songData) => {
	return request({
		url: '/user/save_history',
		method: 'POST',
		data: songData
	});
};
