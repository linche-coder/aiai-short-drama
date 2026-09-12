# 爱爱短剧 · 第四轮

React + TypeScript + Vite。首页保留品牌开屏、Banner、搜索题材筛选、广告与账号会员入口；所有短剧卡片改为直接链接到独立播放页。

**播放页已完成，真实短剧片源尚未接入。** 无视频的作品显示明确说明，不显示伪播放器、假进度或虚构选集。

## 运行

```powershell
npm.cmd install
npm.cmd run dev
```

首页：http://localhost:5173/#home 。播放示例：http://localhost:5173/play/drama-05 。

```powershell
npm.cmd run build
npm.cmd run preview
```

生产预览默认 http://localhost:4173 。PowerShell 禁用脚本执行时使用 `npm.cmd`。

## 片源接入

编辑 [`src/data/videoSources.ts`](src/data/videoSources.ts)，按剧目 ID 配置作品级 `sources` 或真实 `episodes`。目前该映射为空。

[视频源结构、选集、格式与服务器要求](VIDEO-SOURCES.md)。支持原生 video 播放/暂停/进度/音量/全屏，视频完整显示；有加载、失败和重试状态。只对实际配置的集数生成选集。没有 HLS/DASH 解码库或 DRM。

`docs/round-*/motion-review.mp4` 为验收录屏，`tests/fixtures/player-test.mp4` 为隔离测试的合成图案，均未接入生产作品。

## 代码位置

| 文件 | 职责 |
| --- | --- |
| `src/App.tsx` | 首页/播放页选择、账号与会员弹窗 |
| `src/navigation/Router.tsx` | 集中 History API、真实链接、前进后退、区块导航、滚动恢复 |
| `src/navigation/homeState.ts` | 会话内搜索、题材、索引、暂停和滚动状态 |
| `src/HomePage.tsx` | 首页内容、搜索防抖、筛选、开屏和广告 |
| `src/components/Carousel.tsx` | 确定槽位、单组布局动画、最新目标、边缘绕回与计时器清理 |
| `src/components/CardInfo.tsx` | Banner 与列表复用的非交互信息层 |
| `src/components/DramaGrid.tsx` | 普通卡片整卡链接和稳定重排标识 |
| `src/components/PlayPage.tsx` | 播放区域、真实选集、作品信息和未找到页面 |
| `src/components/Modal.tsx` | 仅账号/会员提示，统一关闭与焦点恢复 |
| `src/motion/transitions.ts` | 筛选结果过渡、最新选择优先、路由离开时取消 |
| `src/styles/play.css` | 共享卡片材质、真实 hover/focus 规则、播放页响应式布局 |
| `src/styles/motion.css` | Banner 基础布局、品牌开屏和通用提示弹窗 |
| `src/data/dramas.ts` | 作品资料、题材、首页分组 |
| `src/config.ts` | 广告开关与动效时长 |

轮播不再保留每张卡片的 hover/focus 布尔值。鼠标使用实际 `:hover`，键盘使用 `:focus-visible`；布局切换、窗口失焦和返回首页不会恢复旧的临时预览。侧卡点击直接进入播放页，切换由箭头、指示器、方向键和自动轮播负责。

轮播每次布局动画约 440 ms，进行中仅保存最新目标；绕回卡片先淡出再换边，不经过中央可见区域。宽度不足 1200px 时显示 3 张。整卡链接保留 Enter、Ctrl/中键新标签页及复制地址的原生能力。

短剧信息弹窗、封面飞行与来源 DOM 引用已移除；筛选重排动画继续保留。导航离开首页时清理计时器、防抖和结果过渡。

## 素材、开屏和广告

仍使用原来的 18 张封面和原始 Logo；海报为 300/540/651 px 响应式 WebP，列表懒加载。`public/assets/manifest.json` 保存素材映射。题材、简介和编排为演示资料。

完整品牌开屏约 4 秒，同标签页一次；右下角“重放开屏 / DEV”仅在开发环境显示。播放页返回不重放完整开屏。减少动态效果时跳过位移动画。原始 SVG 未重绘；分组与局部光效由 `scripts/prepare-intro.mjs` 生成。

广告在 `src/config.ts` 配置，顶部默认开启，中部默认关闭；关闭时不保留空位。账号与会员保持提示入口，未接入登录、支付或会员购买。

## 验证与交付

```powershell
$env:PW_TEST_CHANNEL = 'chrome'
npm.cmd test
```

使用独立 Chrome，不读取个人浏览资料。当前 21 项用例包含三种桌面宽度各前后 30 次、绕回逐帧采样、快速混合、整卡热区、路由与浏览恢复、播放器和手机触摸模拟。前轮测试已归档到 `docs/round-3/`。

- [第四轮验收与性能记录](ROUND4-VERIFICATION.md)
- [约 14 秒实际交互录屏](docs/round-4/motion-review.mp4)
- 录屏：`node scripts/record-round4.mjs`，需要系统 `ffmpeg`。
- 性能：`node scripts/profile-round3.mjs after docs/round-4`，记录 Banner 与热门推荐的 rAF 和 CDP 轨迹。
- [第二轮记录](ROUND2-VERIFICATION.md)与[第三轮记录](ROUND3-VERIFICATION.md)作为历史资料保留，不代表当前仍有短剧弹窗。

Vite 支持播放页刷新。部署到其他静态服务器时，应把非文件路由回退到 `index.html`，素材和视频请求照常返回文件。
