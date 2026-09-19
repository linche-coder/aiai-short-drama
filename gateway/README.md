# 爱爱短剧 · 前置线路入口（独立子项目）

## 与主站的区分

本目录是**前置线路入口页**，不是主站首页，也不属于主站的 React 路由。它在独立域名展示 6 条访问线路；主站负责剧集、播放、会员等业务。

| 项目 | 前置入口页 | 主站 |
| --- | --- | --- |
| 仓库位置 | `gateway/` | 仓库根目录 |
| 工程 | `gateway/package.json`（独立版本 1.0.0） | 根目录 `package.json`（主站版本） |
| 源码 / 静态资源 | `gateway/src/`、`gateway/public/` | 根目录 `src/`、`public/` |
| 构建产物 | `gateway/dist/` | 根目录 `dist/` |
| 部署配置 | `gateway/.openai/hosting.json` | 根目录 `.openai/hosting.json` |
| 线上网站 | [线路入口](https://aiai-drama-gateway.docile-shell-2494.chatgpt.site) | [主站](https://aiai-drama-showcase.docile-shell-2494.chatgpt.site) |

入口页目前公开访问，无需 GPT 登录。6 条线路仍为明确占位内容，等待实际地址，不执行跳转。

从仓库根目录开发入口页：

```sh
cd gateway
npm run dev
```

也可在仓库根目录运行 `npm --prefix gateway test` 或 `npm --prefix gateway run build`。此项目没有 npm 依赖，无需安装主站依赖。托管平台的项目根目录应选择 `gateway`，构建命令为 `npm run build`，输出目录为 `dist`（相对于 gateway）。

**部署入口页必须使用本目录的配置与构建产物，不使用或覆盖根目录主站的配置。** 已发布的主站 `v1.1.1` 标签保持原样；入口页使用独立包名和版本维护。

纯静态单页，无运行时依赖、第三方字体、CDN、音频或目标主站资源请求。使用 Node.js 20+。

## 可交互预览

```sh
npm run dev
```

打开 http://127.0.0.1:4188 。修改源文件后刷新页面即可。`PORT` 环境变量可更换端口。Windows PowerShell 如果禁止运行 npm.ps1，请使用 `npm.cmd run dev`，无需修改系统执行策略。

## 维护线路

仅修改 `src/lines.json`，`lines` 数组顺序就是展示顺序，必须恰好 6 项。
每条包含 `name` 和 `url`。尚未确认的地址保持 `null`：显示“地址待配置 · 暂未开放”，保留键盘焦点供预览，但没有 href，也不会跳转。填入真实 HTTP(S) 地址后自动生成整张卡片可点击、Enter 可打开的原生链接，当前标签页跳转。

不检测、不暗示线路可用性或速度。网址完整显示并可换行。页面不携带任何目标网站登录状态。

## 构建与发布

```sh
npm test
npm run build
npm run preview
```

`dist/` 是独立静态产物，可部署到任意静态托管。HTML 已含全部线路，禁用 JavaScript、Canvas 不可用或 LOGO 加载失败均不会阻止真实链接访问。源文件中的相对资源路径也支持子目录托管。

当前已获准将占位版本发布到 Sites 系统分配域名；6 条线路保持不可跳转，并保留 noindex 标记。站点绑定信息位于 `.openai/hosting.json`，后续更新复用同一站点。 用户确认 6 个真实地址及固定域名后，填写 `deploymentOrigin`（例如 HTTPS origin 的格式，不含路径/末尾斜杠），运行 `npm run build:release`。正式构建检查是否还存在空地址或保留测试域名，并移除预览的 noindex 标记；该命令本身不会上传或发布。然后将 `dist/` 全部文件上传到已确认域名的站点根目录，配置 HTTPS 和 DNS。建议 HTML 使用 no-cache，其他资源采用短缓存或部署时统一刷新，以便及时更新线路。

## 主站跳过重复欢迎页：待对接

目前 `entryMarker.enabled` 为 `false`，不擅自修改目标地址。建议双方约定查询参数 `entry=aiai-gateway`。目标主站确认支持后再启用：构建器通过 URL API 添加参数，保留原查询参数与 hash；屏幕展示的仍是维护者配置的网址。

目标主站应在首次挂载欢迎动画之前读取参数，仅跳过品牌欢迎动画，直接渲染主站首页；不得借此跳过登录、访问权限或其他必要流程。处理后可通过 history.replaceState 移除该参数。入口标记是公开 UI 提示，不是身份凭据。不依赖跨域 localStorage/sessionStorage。本项目未修改本地参考主站，双方的行为验收仍需对接完成后进行。

## 品牌与动效来源

- `public/assets/logo.svg` 原样复制自 `../public/assets/brand/logo.svg`，图形、路径、文字、比例、颜色均未修改。
- `src/particles.js` 适配主站 `../src/motion/introParticles.ts`：保留种子 421、椭圆轨迹与粉紫橙配色，加入轻微鼠标偏移；移除欢迎动画收拢阶段和粒子拖尾，只绘制光点。
- 恢复第一版全页柔和渐变背景。原版 LOGO 使用居中 Flex 布局及等比尺寸，容器不裁切；周围只保留呼吸柔光和粒子光点，移除 SVG 光弧、椭圆线框、装饰刻线。6 张线路卡片收于渐变细框面板，配有左侧渐变短线、顶部高光和圆角箭头底座。没有两侧星座、晶体、流星和边缘粒子。
- 手机粒子从 210 降至 100，绘制帧率/DPR 降低。页面后台停止 Canvas 动画，LOGO 离屏停止轨道绘制。系统减少动态效果时只绘制静态帧，禁用所有 CSS 动画、入场、跟随和位移动效。鼠标柔光仅存在于中央 LOGO 区域。
- 所有装饰层忽略指针事件，无音频。动画不承担任何点击拦截或跳转逻辑。
