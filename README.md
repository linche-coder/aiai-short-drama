# 爱爱短剧

## v1.1.0 · 会员充值页焕新（2026-09-18）

- 按新版方案呈现免费用户、悦享会员、尊享会员、四档积分补充与两档年卡。
- 新增霓虹光轨、粒子、悬浮光效和按钮扫光，适配手机与减少动态效果设置。
- 选购弹层保留套餐金额、登录回跳及原剧集上下文；会员中心续费入口连接新版方案页。
- 本次业务界面改动限于会员充值相关页面；真实支付服务仍未开放，不创建虚假订单或扣款。
- 版本记录见 [CHANGELOG.md](CHANGELOG.md)。线上版本号可通过 `/version.json` 查询。

[打开会员充值页](https://aiai-drama-showcase.docile-shell-2494.chatgpt.site/membership?view=plans)

以下日期章节是历史开发记录，其“未发布”状态仅描述对应轮次。

## 2026-09-17 登录注册弹窗与正式界面修订

账号入口现已统一为覆盖当前页面的登录/注册/找回密码弹窗，普通用户界面不再提供测试身份、沙盒注册、假支付或开发验收入口。认证、注册、找回密码、评论和反馈只认真实 HTTP 接口结果；当前外部服务未接通时会显示简洁的不可用反馈。无正式片源时不再播放彩条或标记为可播放。本轮未发布线上版本。

- 修改、验证与外部依赖：[docs/auth-modal/DELIVERY.md](docs/auth-modal/DELIVERY.md)
- 自动化：`$env:PW_TEST_CHANNEL='chrome'; npx.cmd playwright test tests/auth-modal.spec.ts`

## 2026-09-17 查漏补缺开发交付

本轮在保留现有品牌、首页风格、公开路由与可用功能的基础上，补齐了认证、订单与权益、评论互动、用户留存、帮助反馈及最小运营后台的可审阅本地实现。正式认证、片源、支付、通知和云端数据服务尚未接入；开发环境中的测试身份、测试视频、订单回调和互动数据均位于明确隔离的浏览器沙箱，生产构建会关闭测试身份、移除测试视频并隐藏演示后台。本轮没有发布线上版本、不会发起真实扣款或发送真实通知。

- 当前进度与阻塞：[PROGRESS.md](PROGRESS.md)
- 页面地图、真实/演示边界、接口与验收说明：[docs/closure/DELIVERY.md](docs/closure/DELIVERY.md)
- 核心自动化：`$env:PW_TEST_CHANNEL='chrome'; npx.cmd playwright test tests/closure.spec.ts`
- 生产边界冒烟：先运行 `npm.cmd run preview`，再运行 `node scripts/smoke-closure.mjs`

以下章节保留此前轮次的历史记录；若与本节冲突，以本轮交付文档为准。

## 2026-09-16 首页粒子入场（仅本地）

React 19 + TypeScript + Vite 构建的短剧界面项目，包含普通区、18+专区、Banner 轮播、播放页、选集、收藏及品牌开屏动画。

## 在线预览

[打开网站](https://aiai-drama-showcase.docile-shell-2494.chatgpt.site)

## 首页入场体验

首页使用原品牌 LOGO 分组显现和粉紫粒子环绕，静音等待用户点击“进入爱爱”。点击后约 1.68 秒内完成粒子汇聚、品牌提示音、LOGO 移向页头和首页显现。仅保留一个进入按钮，同一标签页会话成功进入后不重复展示。

粒子按桌面与手机分别使用 280 / 144 颗，并限制画布像素密度。支持键盘导航、减少动态效果、慢加载和音频失败降级；鼠标或触屏进入后不会给页头 LOGO 留下焦点框。

原创音效的 WAV 母版与 MP3 位于 `public/assets/audio/aiai-orbit*`。安装 FFmpeg 后运行 `node scripts/render-intro-orbit.mjs` 可重新生成，声画共用 `src/motion/introTimeline.json`。手机扬声器、耳机的实体听感试听尚未完成。

专项测试：`npx playwright test tests/intro-sound.spec.ts`。测试默认使用 Playwright Chromium，也可通过 `PW_TEST_CHANNEL=chrome` 使用已安装的 Chrome。

## 本地运行

需要 Node.js 22 或更新版本。

```bash
npm ci
npm run dev
```

浏览器打开终端显示的本地地址。

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物在 `dist/`。部署至静态托管时，需要将站内路由回退到 `index.html`。

## 项目结构

- `src/components/`：共享界面、播放器与播放页
- `src/adult/`：专区 Banner、导航及卡片
- `src/data/`：展示数据与视频配置
- `src/dev/assets/catalog/`：专区封面
- `public/assets/`：品牌、Banner、普通区封面和音效

## 当前功能范围

这是用于展示和检查样式的前端项目。正式作品片源、认证服务和会员支付尚未接入生产服务；无正式片源时页面显示不可播放状态。开发预览账号和演示数据与生产构建明确隔离，收藏等部分状态保存在浏览器中。

仓库包含当前运行所需素材，不包含本地缓存、账号凭据或工作备份。素材使用权不因仓库公开而自动转授。

## 替换素材

Banner 配置：`src/data/adultBanners.ts`  
专区目录：`src/dev/adultPreview.ts`  
正式视频配置：`src/data/videoSources.ts`  
占位播放配置：`src/data/demoPlayback.ts`
