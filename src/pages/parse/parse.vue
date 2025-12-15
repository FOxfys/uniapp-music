<template>
  <view class="parse-container">
    <view class="header">
      <text class="title">音乐/歌单解析</text>
      <text class="subtitle">支持网易云音乐链接或ID</text>
    </view>

    <view class="input-section">
      <input class="parse-input" placeholder="粘贴链接或输入ID" v-model="inputValue" />
      <view class="btn-group">
        <button class="action-btn paste" @click="handlePaste">粘贴</button>
        <button class="action-btn clear" @click="inputValue = ''" v-if="inputValue">清空</button>
      </view>
    </view>

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
    </view>

    <button class="parse-btn" @click="handleParse">开始解析</button>

    <!-- 提示信息 -->
    <view class="tips">
      <text>提示：</text>
      <text>1. 歌单解析后可一键转存到我的歌单</text>
      <text>2. 单曲解析直接播放</text>
    </view>

    <MusicPlayerWidget />
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { playerStore } from '@/store/player.js';
import { getSongUrl } from '@/api/music.js'; // 用于测试单曲有效性
import MusicPlayerWidget from '@/components/MusicPlayerWidget.vue';

onShow(() => {
  setTimeout(() => {
    uni.showTabBar({ animation: true });
  }, 200);
});

const inputValue = ref('');
const parseType = ref('playlist'); // 默认歌单，因为这是核心功能

const handlePaste = () => {
  uni.getClipboardData({
    success: (res) => {
      inputValue.value = res.data;
      // 简单的正则尝试自动识别类型
      if (res.data.includes('playlist')) {
        parseType.value = 'playlist';
      } else if (res.data.includes('song')) {
        parseType.value = 'song';
      }
      uni.showToast({ title: '已粘贴', icon: 'none' });
    }
  });
};

const extractId = (str) => {
  // 尝试匹配 id=123456
  const match = str.match(/id=(\d+)/);
  if (match) return match[1];

  // 尝试匹配 /playlist/123456
  const match2 = str.match(/\/playlist\/(\d+)/);
  if (match2) return match2[1];

  // 尝试匹配 /song/123456
  const match3 = str.match(/\/song\/(\d+)/);
  if (match3) return match3[1];

  // 如果全是数字，直接返回
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
    // 跳转到歌单详情页，类型为 music (网易云歌单)
    uni.navigateTo({
      url: `/pages/playlist/detail?id=${id}&type=music`
    });
  } else {
    // 单曲解析：直接尝试播放
    // 这里我们构造一个临时的 song 对象，先只给 id，让 playerStore 去加载详情
    // 注意：playerStore.setSongAndPlay 内部会调用 getSongUrl，但它需要 song.name 等信息
    // 为了体验更好，我们应该先调用 search 或者 song_detail 接口获取信息
    // 但为了简化，我们先直接传 ID，让 playerStore 尽力而为（它有默认值）
    const tempSong = {
      id: id,
      name: '解析中...',
      ar: [{ name: '未知歌手' }],
      al: { picUrl: '' }
    };
    playerStore.setSongAndPlay(tempSong);
  }
};
</script>

<style scoped>
.parse-container {
  padding: 40rpx;
  background-color: #121212;
  min-height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  margin-bottom: 60rpx;
  text-align: center;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #00f2ea;
  display: block;
  margin-bottom: 10rpx;
}
.subtitle {
  font-size: 28rpx;
  color: #888;
}
.input-section {
  width: 100%;
  margin-bottom: 40rpx;
}
.parse-input {
  background-color: #2a2a2a;
  border: 1px solid #333;
  border-radius: 15rpx;
  padding: 30rpx;
  color: #fff;
  font-size: 32rpx;
  margin-bottom: 20rpx;
}
.btn-group {
  display: flex;
  justify-content: flex-end;
}
.action-btn {
  font-size: 24rpx;
  padding: 10rpx 30rpx;
  margin-left: 20rpx;
  background-color: #333;
  color: #ccc;
  border-radius: 30rpx;
}
.action-btn.paste {
  color: #00f2ea;
  border: 1px solid #00f2ea;
  background-color: transparent;
}

.type-selector {
  display: flex;
  background-color: #2a2a2a;
  border-radius: 50rpx;
  padding: 10rpx;
  margin-bottom: 60rpx;
}
.type-item {
  padding: 15rpx 60rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  color: #888;
  transition: all 0.3s;
}
.type-item.active {
  background-color: #00f2ea;
  color: #121212;
  font-weight: bold;
}

.parse-btn {
  width: 80%;
  background-image: linear-gradient(45deg, #00f2ea, #00c2b8);
  color: #121212;
  font-weight: bold;
  border-radius: 50rpx;
  font-size: 36rpx;
  margin-bottom: 60rpx;
}

.tips {
  width: 100%;
  padding: 30rpx;
  background-color: #1a1a1a;
  border-radius: 15rpx;
}
.tips text {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}
</style>
