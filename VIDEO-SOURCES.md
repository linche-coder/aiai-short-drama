# 接入真实短剧视频

配置文件：[`src/data/videoSources.ts`](src/data/videoSources.ts)。目前正式映射为空。仓库中的 `public/media/demo/landscape.mp4` 与 `portrait.mp4` 是历史自动化素材，不再进入普通用户播放路径；生产构建还会删除 `dist/media/demo`，不会发布这些文件。无正式片源时播放器区域只显示“该集暂时无法播放”。

视频必须是用户提供的实际作品片源。`docs/round-*/motion-review.mp4` 是验收录屏，`tests/fixtures/player-test.mp4` 是合成测试图案，二者均不属于短剧，也没有接入生产页面。现有概念作品的封面、标题与 36 集数量不能作为真实发行、授权或逐集片源证明。

## 单个视频

将自己的视频放在 `public/media/`，然后在配置中填写真实文件名；也可以填浏览器可访问的视频 URL。以下路径只是配置示例，不是已存在的片源：

```ts
export const videoSources: Record<string, DramaMedia> = {
  'drama-05': {
    sources: [
      { src: '/media/替换为真实视频文件.mp4', type: 'video/mp4' },
    ],
  },
};
```

访问 [`/play/drama-05`](http://localhost:5173/play/drama-05) 后，播放器会替代无片源说明。支持浏览器原生播放、暂停、进度、音量和全屏操作；不自动播放。视频内容使用 `object-fit: contain`，按实际视频比例完整显示，不使用封面比例裁剪视频。

## 真实选集

只有提供实际集数资料时才填写 `episodes`，页面按数组内容生成选集；不要添加占位集。配置 `episodes` 时，播放选中的集数来源；否则使用作品级 `sources`。

```ts
export const videoSources: Record<string, DramaMedia> = {
  'drama-05': {
    episodes: [
      {
        id: '替换为真实集ID',
        title: '替换为真实集名',
        sources: [{ src: '/media/替换为该集视频.mp4', type: 'video/mp4' }],
      },
    ],
  },
};
```

服务端应返回正确的 Content-Type，并支持 HTTP Range/206，以便浏览器可靠定位进度。网络不可用或格式不支持时显示错误和“重新加载”；加载/缓冲超过 15 秒会进入可重试错误状态。

当前使用原生 HTML5 video，实测了 H.264 MP4。其他格式依赖浏览器本身的支持，没有添加 HLS/DASH 解码库、DRM、字幕服务或播放记录后台。

## 部署路由

Vite 开发与预览服务器支持 `/play/:dramaId` 的刷新与直接访问。部署到其他静态服务器时，需要将非文件路由回退到 `index.html`；真实视频文件和静态素材请求仍返回各自文件，不回退为 HTML。
