# 首页粒子入场 · 本地交付

日期：2026-09-16。未执行部署、提交、推送或覆盖原有未提交资料。

## 版本核对

以当前工作区为基础。修改前 Intro.tsx 在挂载时启动声音，使用 3862ms 自动时间轴；HomePage 在数据加载时只显示黑幕。原音频为 aiai-intro-reveal-v4.wav。

只读下载了项目历史文档中的线上地址 https://aiai-drama-showcase.docile-shell-2494.chatgpt.site/ 及其公开脚本 /assets/index-CFwD2ywe.js：仍引用 V4，声音音量 0.65，未找到“点击开启声音”或“静音进入”。无法据此确认其他地址或缓存版本的行为。没有将线上打包文件覆盖到本地。

## 最终流程

- 等待：原始分组 SVG 渐进显现，粒子静音环绕。按钮从第一帧可操作；不计时退出。原品牌文件未修改。
- 点击：同步记录 performance.now()，在真实点击函数内恢复 AudioContext 并开始已解码的音频，粒子沿各自带偏移的螺旋轨迹向中心聚拢。
- 离场：LOGO 小幅提亮，连续移动到页头，黑幕淡出；不会再次播放 LOGO 出现动画。
- 最新调整：移除“静音进入”，仅保留“进入爱爱”；Tab / Shift+Tab 均保持在唯一的进入按钮上。等待期间仍不发声。
- 减少动态效果：静态粒子、完整 LOGO、无持续旋转或飞行；主动点击使用专门的 320ms 柔和短音和 360ms 淡出。
- 首次进入策略：仅成功结束后写入 aiai:intro-seen=yes。同一标签页会话刷新、返回首页不重复展示。
- 数据加载与欢迎界面分离。数据迟到或失败不影响按钮；进入后继续显示加载或错误状态。

## 声画时间表

所有时间均从点击“进入爱爱”开始，和页面打开后的等待时长无关。唯一共享参数源：src/motion/introTimeline.json。

| 时间 | 画面 | 声音 |
|---|---|---|
| 等待 | 原 SVG 0–1550ms 显现后保持；粉紫颗粒缓慢环绕 | 无声，后台预加载/解码 |
| 0ms | 按钮回应，开始加速 | 圆润的短启动声 |
| 160–820ms | 每颗粒子不同起点、不同延迟，旋转汇入中心 | 带细颗粒的滤波空气声聚拢 |
| 820ms | 汇聚完成，LOGO 轻微提亮 | C5/E5/A5 温暖和声记忆点，9ms 柔和起音 |
| 900–1540ms | LOGO 移至真实页头位置 | 干声衰减，短空间反射尾音 |
| 940–1620ms | 深黑遮罩平滑淡出 | 尾音渐收，1620ms 音频自然结束 |
| 1680ms | 移除欢迎层、解除 inert 和滚动锁；鼠标/触屏焦点移至首页容器，键盘焦点移至品牌链接 | 不补播 |

## 音频交付与复现

全新程序合成，没有读取旧音频，也没有使用第三方采样。由加法合成音色、确定性噪声、颗粒包络和短立体声早期反射组成。

- public/assets/audio/aiai-orbit-v1.wav：48kHz / 24-bit / 立体声，1.62 秒 WAV 母版，466604 字节。
- public/assets/audio/aiai-orbit-v1.mp3：160kbps 网页播放版，33644 字节。
- public/assets/audio/aiai-orbit-soft-v1.wav 与 .mp3：减少动态效果的短版，0.32 秒；网页文件 7724 字节。
- 生成脚本：scripts/render-intro-orbit.mjs。
- 重做音频：调整共享时间轴或脚本后运行 `node scripts/render-intro-orbit.mjs`。需要已安装的 FFmpeg，无 npm 新依赖。

WAV 峰值 −6 dBFS，主版 RMS −23.70 dBFS，首尾采样为零。MP3 解码峰值约 −6.44 dBFS，无削波、NaN 或无穷值。主版单声道 RMS 与立体声相差约 0.06dB，相关性约 0.981，未发现明显相位抵消。网页播放额外使用 0.8 增益。分析数据见 audio-analysis.json。

## 播放与清理

音频仅预加载，不在加载完成事件、页面点击、键盘全局事件中补播。真实进入点击直接调用 resume 和 source.start。未解码、API 不可用、资源失败、恢复被拒绝，均继续视觉流程；恢复超过 100ms 则取消，防止错位补播。同步防重入标记防止连点叠加。

正常尾音在组件离场前结束；卸载或隐藏页面会停止声源、断开节点、关闭上下文、取消网络请求和监听器。进入后的保护定时器仅用于动画卡死，没有等待期间自动关闭的定时器。

桌面最多 280 颗粒子，小屏 144 颗（较首版约增加 75%），粒子半径约增大 50%；收紧辉光范围和小屏轨道边距，保持 LOGO 与按钮清晰。Canvas 像素比上限分别为 2 和 1.5，约 30fps 绘制，隐藏页面停止帧循环。没有引入 3D 或音频库。

## 验证与试听边界

实际使用独立 Chrome / Playwright 页面运行交互，并查看 320、390、768、1440px 截图。截图在本目录 waiting-*、gather-*、home-from-*。检查了 LOGO 可读性、轨道范围、按钮位置、无横向溢出及变更尺寸后的退场。

音频单独验证：通过接往浏览器真实 AudioDestinationNode 的 AnalyserNode 读取渲染 PCM，而非只统计函数调用。观察到非零输出，正常结束事件及同步节点；详细逐帧数据见 browser-audio.json。一次实测启动约 28ms、品牌峰约 861ms、尾音约 1635ms；环境调度会产生数十毫秒变化。这验证浏览器渲染了音频，不证明物理扬声器实际发声或主观听感。

**没有完成实际听感试听。手机扬声器、耳机及实体 iOS/Safari 的清晰度、舒适音量、输出延迟仍需人工确认。** 当前工具无法接收实体音频输出，不能把波形检测称为耳听。单声道与频段设计只是兼容性准备。

可直接打开本地首页 http://localhost:5173/ 体验。已看过开场的标签页可新开独立会话，或在开发者工具执行 `sessionStorage.removeItem('aiai:intro-seen'); location.reload()`；没有向产品加入调试按钮。浏览器扩展预览交接曾被另一个扩展 UI 阻挡，因此视觉与音频客观检测使用项目的独立 Chrome 测试浏览器完成。
## 最终测试结果

- `npm.cmd run build`：通过（TypeScript 与 Vite 生产构建）。
- 相关 Playwright 回归：**22 passed，约 1.2 分钟**。完整机器报告见 test-results.json。
- 覆盖：等待不自动退出/无播放、键盘焦点与背景隔离、同步音频输出、防连点、仅显示主入口、音频拒绝/资源失败/资源迟到、慢内容/错误内容、四个视口、触屏与 DPR 3、减少动态效果及动态切换、延迟音频恢复、等待时后台返回、进入后后台停止、音频 API 缺失与帧循环卡死保护、卸载滚动恢复、会话返回不重复拦截、原 SVG 分组时序以及原有品牌入口回归。
- 本次按变更范围运行相关测试，未宣称整个历史测试库全部通过。
- `git diff --check`：通过。原始 public/assets/brand/logo.svg 与 src/assets/intro-logo.svg 未修改，package.json/lockfile 未增加依赖。

复跑（PowerShell）：

```powershell
$env:PW_TEST_CHANNEL='chrome'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='docs/intro-orbit/test-results.json'
npx.cmd playwright test tests/intro-sound.spec.ts tests/lifecycle.spec.ts tests/adult-edge.spec.ts tests/round5.spec.ts --grep 'intro|separate brand|waiting|welcome exposes|audio|content service|responsive|reduced motion|motion preference|background switch|touch entry|late AudioContext|post-click|returning while' --reporter=list,json
```

测试中的音频输出探针仅存在于测试注入代码，不进入生产包。延迟 resume 测试同时容许 Chrome 在真实用户手势中通过 source.start 自行解锁：若有输出，必须及时开始，不能延迟到首页后重新播放。

### 入场后的 LOGO 焦点框修正

此前统一将焦点移到品牌链接，会继承欢迎层的 focus-visible 状态，导致鼠标进入后仍出现粉色框。现在按触发方式交接焦点：鼠标/触屏进入后聚焦无装饰的首页容器，键盘或辅助技术进入后聚焦品牌链接并保留可见提示。后续 Tab 顺序保持正常，没有全局禁用焦点样式。构建和 3 项相关浏览器回归通过；无粉框截图见 home-pointer-focus.png。
