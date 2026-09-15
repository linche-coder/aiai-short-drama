# 爱爱短剧

React 19 + TypeScript + Vite 构建的短剧界面项目，包含普通区、18+专区、Banner 轮播、播放页、选集、收藏及品牌开屏动画。

## 在线预览

[打开网站](https://aiai-drama-showcase.docile-shell-2494.chatgpt.site)

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
- `public/media/demo/`：本地占位视频

## 当前功能范围

这是用于展示和检查样式的前端项目。播放页使用内置占位视频；登录、会员支付和正式作品片源未接入生产服务。收藏等状态主要保存在浏览器中。

仓库包含当前运行所需素材，不包含本地缓存、账号凭据或工作备份。素材使用权不因仓库公开而自动转授。

## 替换素材

Banner 配置：`src/data/adultBanners.ts`  
专区目录：`src/dev/adultPreview.ts`  
正式视频配置：`src/data/videoSources.ts`  
占位播放配置：`src/data/demoPlayback.ts`
