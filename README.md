# UniMusic - 沉浸式跨平台音乐播放器

## 1. 项目简介

**UniMusic** 是一款基于 **UniApp + Vue 3 + Vite** 开发的高性能跨平台音乐播放器应用。项目采用暗黑赛博朋克风格设计，注重沉浸式播放体验。

核心亮点包括：
*   **全局无缝播放**：通过全局状态管理实现跨页面音频续播。
*   **智能悬浮胶囊**：全应用覆盖的可拖拽悬浮球，支持吸附与记忆位置。
*   **高精度歌词同步**：毫秒级歌词解析与滚动算法。
*   **流畅的交互动画**：原生级的转场与手势交互体验。

---

## 2. 技术栈 (Tech Stack)

*   **核心框架**: [UniApp](https://uniapp.dcloud.io/) (基于 Vue 3)
*   **构建工具**: [Vite](https://vitejs.dev/) (极速构建与热更新)
*   **编程语言**: JavaScript (ES6+)
*   **状态管理**: Vue 3 `reactive` (轻量级全局 Store 模式)
*   **样式处理**: CSS3 Animations, Flexbox, Glassmorphism (毛玻璃效果)
*   **音频能力**: `uni.getBackgroundAudioManager` (支持后台播放)
*   **网络请求**: 封装 `uni.request` (支持拦截器、Token 管理)

---

## 3. 核心功能与代码实现

### 3.1 全局播放控制 (Player Store)

摒弃复杂的 Vuex/Pinia，采用 Vue 3 的 `reactive` 构建轻量级全局状态管理，直接驱动音频播放核心。

**核心代码 (`src/store/player.js`):**

```javascript
import { reactive } from 'vue';
const audioManager = uni.getBackgroundAudioManager();

export const playerStore = reactive({
  isPlaying: false,
  currentSong: null,
  playMode: 'sequence', // sequence, loop, random
  
  // 核心播放逻辑：统一入口，处理音频、封面、歌词的并行加载
  async setSongAndPlay(song) {
    this.currentSong = song;
    
    // 1. 并行请求优化加载速度
    const playAudioPromise = this._playAudio(song.url); // 音频流
    const lyricPromise = getLyric(song.id);             // 歌词
    const coverPromise = getSongCover(song.id);         // 高清封面
    
    await Promise.all([playAudioPromise, lyricPromise, coverPromise]);
  },

  // 播放器事件监听
  initAudioEvents() {
    audioManager.onTimeUpdate(() => {
      this.currentTime = audioManager.currentTime;
    });
    audioManager.onEnded(() => {
      this.playNext(true); // 自动播放下一首
    });
  }
});
```

### 3.2 可拖拽悬浮球 (Floating Widget)

实现了类似系统级悬浮窗的效果，支持全屏拖拽、边缘吸附（可选）以及播放状态下的律动光效。

**实现逻辑 (`src/components/MusicPlayerWidget.vue`):**

*   **位置记忆**: 坐标保存在 Store 中，页面切换不重置。
*   **防误触**: 区分“点击”与“拖拽”事件。

```javascript
// 触摸移动处理
const onTouchMove = (e) => {
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;

  // 简单的防抖阈值，防止点击时的微小抖动被判定为拖拽
  if (Math.abs(currentX - startX) > 5 || Math.abs(currentY - startY) > 5) {
    isDragging = true;
    // 实时更新 DOM 位置
    position.x = currentX - touchStart.x;
    position.y = currentY - touchStart.y;
  }
};

// 触摸结束
const onTouchEnd = () => {
  if (isDragging) {
    // 保存最终位置到全局 Store
    playerStore.updateWidgetPosition(position.x, position.y);
  }
};
```

### 3.3 LRC 歌词解析与滚动

实现了标准的 LRC 格式解析，并利用 `scroll-view` 的 `scroll-into-view` 属性实现平滑滚动。

**解析算法 (`src/store/player.js`):**

```javascript
const parseLyric = (lrcText) => {
  const lines = lrcText.split(/[\n\r]+/);
  const timeReg = /\[(\d{1,2}):(\d{1,2})(\.(\d{1,3}))?\](.*)/;
  
  return lines.map(line => {
    const match = line.match(timeReg);
    if (match) {
      // 将时间转换为秒 (00:01.50 -> 1.5)
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = match[4] ? parseFloat("0." + match[4]) : 0;
      return {
        time: min * 60 + sec + ms,
        text: match[5].trim()
      };
    }
  }).filter(Boolean);
};
```

### 3.4 搜索与历史记录 (Search Module)

*   **UI 优化**: 搜索框采用矢量图标，解决了 Flex 布局下的文本溢出问题。
*   **本地存储**: 使用 `uni.setStorageSync` 缓存搜索历史。
*   **交互**: 热门搜索标签支持交错动画 (`animation-delay`) 进场。

**样式优化技巧 (`src/pages/search/search.vue`):**

```css
/* 解决右侧内容溢出挤压左侧序号的问题 */
.song-info {
  flex: 1;
  min-width: 0; /* 关键：允许 Flex 子项收缩到内容宽度以下 */
  margin-right: 10rpx;
}
.song-index {
  flex-shrink: 0; /* 防止序号被压缩 */
}
```

### 3.5 播放历史与分页 (Pagination)

实现了自定义的下拉刷新控件和分页加载逻辑，提升大数据量下的列表性能。

**分页逻辑 (`src/pages/my/history.vue`):**

```javascript
const fetchHistory = async (page) => {
  const res = await getPlayHistory({ page: page, limit: 100 });
  // 更新列表与分页状态
  songList.value = res.history;
  currentPage.value = res.page;
  totalPages.value = res.total_pages;
};

// 自定义下拉刷新动画逻辑
const onTouchMove = (e) => {
  // 计算下拉距离，动态改变 loading 图标的旋转角度和容器高度
  refresherHeight.value = Math.min(deltaY, 200);
};
```

---

## 4. UI/UX 设计亮点

1.  **动态背景**: 使用 CSS `radial-gradient` 配合 SVG 噪点滤镜 (`feTurbulence`)，营造出有质感的磨砂黑背景。
2.  **呼吸光效**: 播放时，悬浮球和封面周围会有随节奏律动的光晕 (`box-shadow` 动画)。
3.  **转盘动画**: 经典的黑胶唱片旋转效果，暂停时自动停止 (`animation-play-state`)。

---

## 5. 目录结构

```text
uniapp-music/
├── src/
│   ├── api/             # 网络请求层 (music.js, playlist.js, request.js)
│   ├── components/      # 公共组件 (MusicPlayerWidget.vue)
│   ├── pages/           # 页面视图
│   │   ├── index/       # 首页
│   │   ├── player/      # 全屏播放页
│   │   ├── search/      # 搜索页
│   │   └── my/          # 个人中心 & 播放历史
│   ├── store/           # 全局状态管理 (player.js, user.js)
│   ├── static/          # 静态资源 (图标, 默认图)
│   ├── App.vue          # 应用入口
│   └── main.js          # Vue 初始化
└── manifest.json        # UniApp 配置
```

---

## 6. 总结

本项目展示了如何使用现代前端技术构建一个功能完备的音乐应用。通过合理的架构设计（Store 模式）、精细的交互打磨（手势、动画）以及对细节的极致追求（溢出处理、加载时机优化），实现了接近原生应用的用户体验。
