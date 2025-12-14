// src/utils/format.js

/**
 * 格式化歌曲时长 (毫秒 -> mm:ss)
 * @param {number} duration - 毫秒数
 */
export function formatDuration(duration) {
  const minutes = Math.floor(duration / 60000);
  const seconds = ((duration % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
