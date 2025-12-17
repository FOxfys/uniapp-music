<template>
  <view class="parse-container">
    <!-- 动态背景 -->
    <view class="bg-gradient"></view>
    <view class="bg-noise"></view>

    <view class="content-wrapper">
      <!-- 标题 -->
      <view class="header">
        <text class="main-title">DATA PORT</text>
        <text class="sub-title">音乐数据解析端口</text>
      </view>

      <!-- 输入核心区 -->
      <view class="input-core">
        <view class="core-glow"></view>
        <textarea
          class="parse-textarea"
          :placeholder="placeholderText"
          v-model="inputValue"
          maxlength="-1"
        />
        <view class="btn-group">
          <text class="action-btn paste" @click="handlePaste">粘贴</text>
          <text class="action-btn clear" @click="inputValue = ''" v-if="inputValue">清空</text>
        </view>
      </view>

      <!-- 类型选择 -->
      <view class="type-selector">
        <view
          class="type-item"
          :class="{ active: parseType === 'song' }"
          @click="parseType = 'song'"
        >
          <text>单曲</text>
        </view>
        <view
          class="type-item"
          :class="{ active: parseType === 'playlist' }"
          @click="parseType = 'playlist'"
        >
          <text>歌单</text>
        </view>
        <view
          class="type-item"
          :class="{ active: parseType === 'user' }"
          @click="parseType = 'user'"
        >
          <text>用户</text>
        </view>
      </view>

      <!-- 解析按钮 -->
      <view class="parse-btn-wrapper">
        <button class="parse-btn" @click="handleParse">
          <text>开始解析</text>
        </button>
      </view>
    </view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { playerStore } from '@/store/player.js';
import { parseMusic } from '@/api/music.js';
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

onShow(() => {
  setTimeout(() => {
    uni.showTabBar({ animation: true });
  }, 200);
});

const inputValue = ref('');
const parseType = ref('playlist');

const placeholderText = computed(() => {
  if (parseType.value === 'song') return '粘贴歌曲链接或输入ID...';
  if (parseType.value === 'playlist') return '粘贴歌单链接或输入ID...';
  if (parseType.value === 'user') return '粘贴用户主页链接或输入ID...';
  return '粘贴内容...';
});

const handlePaste = () => {
  uni.getClipboardData({
    success: (res) => {
      inputValue.value = res.data;
      if (res.data.includes('playlist')) {
        parseType.value = 'playlist';
      } else if (res.data.includes('song')) {
        parseType.value = 'song';
      } else if (res.data.includes('user')) {
        parseType.value = 'user';
      }
      uni.showToast({ title: '已粘贴', icon: 'none' });
    }
  });
};

const extractId = (str) => {
  const matchId = str.match(/id=(\d+)/);
  if (matchId) return matchId[1];

  const matchPlaylist = str.match(/\/playlist\/(\d+)/);
  if (matchPlaylist) return matchPlaylist[1];

  const matchSong = str.match(/\/song\/(\d+)/);
  if (matchSong) return matchSong[1];

  const matchUser = str.match(/\/user\/home\?id=(\d+)/);
  if (matchUser) return matchUser[1];

  if (/^\d+$/.test(str)) return str;

  return null;
};

const handleParse = async () => {
  const input = inputValue.value.trim();
  if (!input) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }

  const id = extractId(input);
  if (!id) {
    uni.showToast({ title: '无法识别ID', icon: 'none' });
    return;
  }

  if (parseType.value === 'playlist') {
    uni.navigateTo({
      url: `/pages/playlist/detail?id=${id}&type=music`
    });
  } else if (parseType.value === 'user') {
    uni.navigateTo({
      url: `/pages/parse/user_playlists?uid=${id}`
    });
  } else {
    uni.showLoading({ title: '解析中...' });
    try {
      const res = await parseMusic({ ids: id, level: 'standard', type: 'json' });

      if (res.status === 200) {
        const song = {
          id: id,
          name: res.name,
          url: res.url,
          ar: [{ name: res.ar_name }],
          al: { name: res.al_name, picUrl: res.pic },
          picUrl: res.pic,
          artist: res.ar_name,
          album: res.al_name
        };

        playerStore.setSongAndPlay(song);

        uni.navigateTo({
          url: '/pages/player/player'
        });
      } else {
        uni.showToast({ title: res.message || '解析失败', icon: 'none' });
      }
    } catch (error) {
      console.error(error);
      uni.showToast({ title: '解析请求失败', icon: 'none' });
    } finally {
      uni.hideLoading();
    }
  }
};
</script>

<style scoped>
.parse-container {
  min-height: 100vh;
  background-color: #121212;
  color: #fff;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

/* 动态背景 */
.bg-gradient {
  position: absolute;
  top: -20%;
  left: -20%;
  width: 140%;
  height: 140%;
  background: radial-gradient(circle at 50% 100%, #1a2a3a, #121212 60%);
  z-index: 0;
}
.bg-noise {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  pointer-events: none;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}
.main-title {
  font-size: 60rpx;
  font-weight: 900;
  color: #00f2ea;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(0, 242, 234, 0.4);
}
.sub-title {
  font-size: 24rpx;
  color: #888;
  margin-top: 10rpx;
}

/* 输入核心区 */
.input-core {
  width: 100%;
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30rpx;
  padding: 40rpx;
  box-sizing: border-box;
  margin-bottom: 40rpx;
  backdrop-filter: blur(10px);
}
.core-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 30rpx;
  border: 2px solid #00f2ea;
  opacity: 0.5;
  animation: pulse 4s infinite;
  pointer-events: none;
}
.parse-textarea {
  width: 100%;
  height: 200rpx;
  background: transparent;
  color: #fff;
  font-size: 32rpx;
  line-height: 1.6;
}
.btn-group {
  display: flex;
  justify-content: flex-end;
  margin-top: 20rpx;
  gap: 20rpx;
}
.action-btn {
  font-size: 24rpx;
  padding: 10rpx 25rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 30rpx;
  color: #ccc;
}

/* 类型选择 */
.type-selector {
  display: flex;
  background-color: rgba(0,0,0,0.3);
  border-radius: 50rpx;
  padding: 10rpx;
  margin-bottom: 60rpx;
  border: 1px solid rgba(255,255,255,0.1);
}
.type-item {
  padding: 15rpx 40rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  color: #888;
  transition: all 0.3s;
}
.type-item.active {
  background-color: #00f2ea;
  color: #121212;
  font-weight: bold;
  box-shadow: 0 0 15px rgba(0, 242, 234, 0.4);
}

/* 解析按钮 */
.parse-btn-wrapper {
  width: 100%;
  padding: 0 40rpx;
  box-sizing: border-box;
}
.parse-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(90deg, #00f2ea, #00c2b8);
  color: #121212;
  font-weight: bold;
  border-radius: 50rpx;
  font-size: 36rpx;
  box-shadow: 0 10px 20px rgba(0, 242, 234, 0.3);
  transition: transform 0.2s;
}
.parse-btn:active {
  transform: scale(0.98);
}

@keyframes pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}
</style>
