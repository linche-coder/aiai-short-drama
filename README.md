# 爱爱短剧 · M4

React 19 + TypeScript + Vite，沿用原始品牌、暗色粉紫视觉、五卡 Banner 与品牌开屏。普通内容、18+门槛、会员、隐私、CMS 和指标页面已分开；业务后端尚未接入。本轮为本地可运行结果，没有线上发布。

## 启动与验收

```powershell
npm.cmd run dev
# http://localhost:5173
npm.cmd run build
npm.cmd run preview
# http://localhost:4173（生产预览不提供开发场景和管理页面）
$env:PW_TEST_CHANNEL = 'chrome'
npm.cmd test
```

依赖已安装；换机器先 `npm.cmd install`，并安装 Playwright 所需浏览器。测试使用独立 Chrome，不读取个人浏览资料。生产检查：`node scripts/audit-m4.mjs`（先启动 preview）。录屏及交互截图：`node scripts/capture-m4.mjs`；新页面截图库：`node scripts/screenshots-m4.mjs`（均先启动 dev）。

主导航：首页、短剧、漫剧、排行榜、18+专区、我的。会员入口在顶部，免费/片单入口在首页。`/me` 下展开“开发预览场景 · 仅本地”，可选择内容加载、地区、会员、价格实验和独立后台角色。只有主动勾选并确认、且模拟地区允许时才显示中性专区卡片；刷新、撤销或到期后重新检查。生产构建因无真实资格服务而拒绝进入。

## 数据和真实能力

当前首页已按用户要求恢复旧版 18 部作品的封面、标题和顺序。封面从本地快照恢复，题材与简介仍为展示编排，正式分级、授权与片源没有完成接入。原始素材与历史备份保留。

片源配置不再仅靠旧 `videoSources` ID 映射。必须先从内容服务取得符合域/发布/授权条件的作品，再获得服务端播放许可。开发服务器为内部测试提供独立的中性演示视频与 36 个演示集数，卡片标注“体验演示 / 演示片源”。演示配置不写入正式 `Content.media`，不改变发布与授权判断；生产构建关闭演示播放。演示浏览也不写入真实观看历史。

会员方案是价格与包含关系的本地界面预览；不扣费，不创建订单，不计算虚构升级差价。CMS 本地草稿和正式发布严格区分，任何输入 proofId 都不能代替服务端核验。分析默认暂无业务数据；本地记录不计成绩。

## 文档

- [M4 完整验收与页面入口](M4-VERIFICATION.md)
- [旧作品迁移清单](docs/m4/MIGRATION.md)
- [接口契约与真实接入状态](docs/m4/API-CONTRACTS.md)
- [部署层保护示例及未应用说明](docs/m4/DEPLOYMENT.md)
- [备份与恢复](docs/m4/RESTORE.md)

`ROUND5-VERIFICATION.md` 及更早轮次是历史记录。M4 保留第五轮的 ±2 外侧 hover 规则、中心 5 / 内侧 4 / 外侧 3 层级、440ms 轮播和首次访问策略；LOGO reveal 1550ms、hold 412ms、transition 1900ms、flight 1150ms，总时长 3862ms。本轮没有再缩短。

## 本轮内部产品测试

运行 `npm.cmd run dev`，访问 http://localhost:5173/。查看 [本轮验收说明](PRODUCT-TEST-VERIFICATION.md)。标签筛选、中文面包屑、播放控件和 36 集演示配置均已接入；免费 1–6 集、基础 1–30 集、高级全部，账号切换位于选集下方。所有视频均为中性色条测试素材，非作品正式视频。

专项检查：`npx.cmd playwright test tests/product-test.spec.ts tests/restored-covers.spec.ts`。旧 M4、ROUND 文档和测试中与概念目录数量、无源界面绑定的断言属于历史版本，不能当成本轮完整验收结果。
