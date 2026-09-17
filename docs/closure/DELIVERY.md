# 查漏补缺交付说明

## 运行预览

```powershell
npm.cmd run dev
# http://localhost:5173/account/login
```

本地开发模式提供测试用户 A（免费）和 B（高级）。全部账号、订单、评论、通知和工单写入 `aiai:isolated-sandbox:v1` 浏览器命名空间；会话只在当前标签页保存。生产构建禁用这些身份并剔除测试视频。

## 实际页面地图

| 路由 | 状态 | 说明 |
| --- | --- | --- |
| `/`、`/shorts`、`/comics`、`/free`、`/search`、`/rankings`、`/collections/*` | 保留并增强 | 首页可显示继续观看；已有搜索、筛选、片单继续复用 |
| `/play/:id?episode=:episodeId` | 增强 | 准确分集链接、演示媒体标识、权限边界、自动下一集偏好、进度、评论 |
| `/account/login`、`register`、`forgot-password`、`verify`、`reset-password`、`session-expired` | 新增 | 完整界面状态；真实认证待接入，本地身份仅 DEV |
| `/membership`、`/checkout`、`/payment-result` | 新增/增强 | 方案、当前权益、结算确认、状态恢复；真实支付关闭 |
| `/me/orders`、`/me/orders/:id` | 增强/新增 | 状态筛选、快照、金额、权益状态、归属校验 |
| `/me`、`/me/favorites`、`/me/history`、`/me/profile`、`/me/comments`、`/me/messages`、`/me/privacy` | 新增/增强 | 私有数据按测试账号隔离；游客收藏显式合并 |
| `/support/*` | 新增 | 帮助、反馈、我的工单与详情 |
| `/terms`、`/privacy`、`/membership-guide`、`/copyright`、`/about` | 新增草稿 | 未编造经营主体、资质、联系方式或退款承诺 |
| `/admin/content`、`/admin/moderation`、`/admin/support`、`/admin/analytics` | DEV 演示 | 本地角色门槛；生产构建返回 404 |
| `/18plus/*` | 保留 | 只保留既有主动确认与隐私隔离；未生成或扩充内容 |

## 数据与接口

正式建议职责：`profiles` 管资料；`dramas/episodes` 管作品和稳定分集；`plans` 管确认后的方案；`orders` 保存金额与方案快照；`entitlements` 管生效/延迟/失败；`favorites/watch_progress` 管留存；`comments/comment_likes/reports` 管互动审核；`notifications` 只由真实事件产生；`support_tickets` 管服务请求。当前未创建数据库迁移，避免在没有后端选型时制造伪表。

`src/services/backend.ts` 已给出 `/api/v1` 的认证、资料、内容、播放许可、报价、订单、评论、进度、通知、工单和管理契约。写请求使用 same-origin Cookie、CSRF、幂等键；客户端状态、URL 与浏览器存储都不作为授权证据。

待配置环境变量（名称示例，不含密钥）：

- `AUTH_ISSUER_URL`、`AUTH_CLIENT_ID`、`AUTH_CLIENT_SECRET`
- `SESSION_SECRET`、`CSRF_SECRET`
- `DATABASE_URL` 或 Sites D1 `DB` 绑定
- `MEDIA_BUCKET`/`BUCKET`、`MEDIA_SIGNING_KEY`
- `PAYMENT_MERCHANT_ID`、`PAYMENT_WEBHOOK_SECRET`、`PAYMENT_API_KEY`
- `MAIL_PROVIDER_API_KEY`、`MAIL_FROM`
- `PUBLIC_APP_ORIGIN`

## 真实 / 沙盒 / 不可用

- 真实：现有公开内容浏览、搜索筛选、片单路由、品牌资源；本地 UI 行为和生产构建隔离。
- 隔离沙盒：测试身份、会员边界、订单回调、评论互动、历史、通知、工单、审核。
- 纯界面契约：注册验证、找回/重置密码、支付结果恢复、政策草稿。
- 暂不可用：真实账号、正片播放、真实扣款/退款、云端持久化、邮件短信推送、真实运营后台和榜单统计。

## 验证

2026-09-17：TypeScript/Vite 生产构建通过；核心 Playwright 5/5 通过；生产预览 smoke 通过；关键页面已在 390、768、1440 宽度检查。浏览器扩展前台被其他扩展浮层阻止后，改用独立 Chrome 测试进程完成自动化与截图，没有操作用户现有登录标签页。
