# 积分功能交付与验收

完成日期：2026-09-19。修改仅在本地项目中完成，未发布、未部署线上版本。

## 已实现

- 页头顺序为积分胶囊、会员中心、头像；访客只显示会员中心与登录。没有折扣 Tag。
- 深色积分浮层展示真实会话等级、完整余额、签到和使用详情。支持 Hover、点击、Tab、Enter、Space、Escape、外部点击、触屏；鼠标离开延迟 180ms，动画 180ms，支持减少动态效果。
- 每日签到先确认，再领取 5 积分；包含加载、失败重试、重复签到及其他设备先签到的反馈。
- 积分解锁剧集，余额不足时根据身份引导开通会员或充值。尊享会员按 80% 向上取整；服务端发现确认价格与当前价格不同会拒绝扣费并提示重新确认。
- 解锁成功自动进入目标集播放；永久解锁关系、扣分和明细同时保存。
- `/me/points` 提供当前余额、等级、月度额度、签到、已解锁与积分明细；支持封面、消耗、时间和继续观看。未登录保留回跳地址。
- 复用原会员方案和充值区域，`/membership?view=points#points-topup` 定位充值。预览会话可完成明确标注的演示购买，余额即时更新并返回原剧集；正式支付不可用时仍显示不可用。
- 用户可见会员名称统一为免费用户、悦享会员、尊享会员；内部 `basic` 标识保留。

## 主要文件

| 文件 | 职责 |
| --- | --- |
| `src/services/pointsModel.ts` | 数据类型、北京时间、月发放、签到、折扣、解锁、充值及退款规则 |
| `server/previewPoints.ts` | 隔离预览账本、服务端定价、账户隔离、原子持久化 |
| `vite.config.ts` | 将积分接口接入现有预览 Cookie 会话；仅开发服务器提供演示接口 |
| `src/services/points.ts` | 单一订阅状态，登录/登出切换、请求竞态、错误处理及刷新 |
| `src/services/backend.ts` | HTTP 契约与业务错误码 |
| `src/components/PointsMenu.tsx` | 页头积分入口与浮层 |
| `src/components/CheckInDialog.tsx` | 确认签到及成功、已签到、失败状态 |
| `src/components/EpisodeUnlockDialog.tsx` | 解锁确认、折扣展示与余额不足引导 |
| `src/pages/PointsPage.tsx` | 已解锁列表和积分明细 |
| `src/components/Header.tsx`、`PlayPage.tsx` | 页头排列、选集、播放与积分解锁接入 |
| `src/pages/MembershipPage.tsx` | 充值定位、演示购买与原播放页回跳 |
| `src/App.tsx`、`src/styles/points.css` | 路由注册、响应式与无障碍样式 |
| `src/data/demoPlayback.ts`、`videoSources.ts` | 集中配置的演示价格与剧集价格字段 |

已检查原 `demoStore.ts`。当前正式风格登录界面使用 `accountService` 与预览服务端 Cookie 会话，因此没有把积分接到旧的浏览器沙盒账号上，也没有创建第二个余额来源。现有 `DialogShell` 继续负责弹窗焦点和关闭逻辑；现有 Router 直接支持新路径和参数，无需重建路由系统。

## 数据和幂等性

每个用户只有一个 `PointsWallet.pointsBalance: number`，必须是非负安全整数。其余字段均为记录，不是余额池：

```ts
interface PointsWallet {
  pointsBalance: number
  grants: MonthlyPointsGrant[]
  checkIns: string[]
  transactions: PointsTransaction[]
  unlocks: EpisodeUnlock[]
  requests: Record<string, string>
}
```

- 月度额度：free=40、basic=320、premium=960。按北京时间年月查找 `grantedAmount`，只补当前额度与已发金额的正差额。降级不追回，跨月不清零，年卡逐月领取。
- 签到：北京时间日期作为唯一业务键；重复请求返回当前余额，实际新发奖励为 0，界面提示今日已签到。
- 解锁：用户账本内的 `contentId + episodeId` 永久唯一，同时校验请求幂等键。服务端根据目录、集中价格和当前会话等级计算金额，不接受客户端伪造的价格或等级。
- 充值：只接受服务端套餐表中的 offerId，同一幂等键只增加一次。
- 退款：业务层 `refundUnlock` 按解锁记录唯一退款，余额和流水同步增加，永久解锁关系保留。未新增面向用户的自行退款按钮。
- 写操作先克隆账本，完成检查和全部变更，再写临时文件并原子替换。失败不会留下半次扣款；单个 Vite 进程内的同步提交使并发请求串行落账。
- 预览账本存放于 `.local/preview-points.json`，不进入源码提交，禁止经 Vite 静态路径读取。重启后账本恢复，会话需重新登录。
- 客户端通过一个 `useSyncExternalStore` 状态供所有页面使用；失效请求通过版本号和用户身份检查丢弃。切换账号立即清除旧余额，回到页面或窗口聚焦时刷新，前台每分钟检查日期与外部变更。

## 接口

```text
GET  /api/v1/me/points                       # 一致性快照：摘要、流水、解锁
GET  /api/v1/me/points/summary
GET  /api/v1/me/points/transactions
GET  /api/v1/me/unlocks
POST /api/v1/me/points/check-in
POST /api/v1/contents/:contentId/episodes/:episodeId/unlock
POST /api/v1/me/points/demo-purchase         # 仅预览，非真实支付
```

解锁提交 `idempotencyKey` 和用户确认的 `quotedCost`。服务端重新计算实际价格；不一致返回 `price_changed`，余额不足返回 `insufficient_points`，不可用内容返回 `content_unavailable`。

## 验证结果

生产构建 `npm run build` 通过。

新增 `tests/points-rules.spec.ts`、`points-api.spec.ts`、`points.spec.ts`。更新登录、会员充值、预览账号及旧会员名称相关断言。

最终功能回归：**32 项通过**（积分规则、真实 HTTP 并发、积分 UI、登录弹窗、会员方案）；随后新增的最大安全整数余额及 320/820/1440px 页头检查 **1 项通过**。现有真实预览账号测试 **2 项通过**，生产隔离边界测试 **1 项通过**，合计 **36 项不同测试通过**。最后的会员文案调整和大数格式调整也分别重跑了对应的 4 项、5 项测试，全部通过。

覆盖：月发放幂等、三种升级差额、跨月累计、北京时间跨日、充值与签到共用余额、重复/并发解锁、退款去重、价格伪造、确认期间价格变化、账户隔离、持久化恢复、服务不可用、其他设备先签到和先消费、内容下架、登出和切换账号、充值返回原集数、触屏/键盘、长剧名、大余额、低高度、减少动态效果以及当前 18+ 导航和分页。

功能回归命令（本次开发服务在 5174）：

```powershell
$env:PW_BASE_URL='http://127.0.0.1:5174'
$env:PW_TEST_CHANNEL='chrome'
npx playwright test points-api.spec.ts points-rules.spec.ts points.spec.ts auth-modal.spec.ts membership-recharge.spec.ts
```

对额外历史测试的检查发现既有不一致，不能声称全仓库测试全绿：

- `adult-edge.spec.ts` 仍寻找已移除的“本地流程演示”入口。
- `adult-pagination.spec.ts` 仍断言固定 6 张首页卡片和每页 8 行；修改前 HEAD 已采用随屏幕列数展示首页卡片、每页 5 行。
- `m4/rules.spec.ts` 的一个断言仍要求旧的 12 项目录；修改前 HEAD 已恢复 18 项封面目录。
- `restored-covers.spec.ts` 包含旧播放器、清空搜索后列表和登录关闭焦点断言。使用修改前 HEAD 的独立快照复现了旧分页断言及登录焦点失败，并直接对照确认“返回后清空搜索，列表仍为空”在修改前后完全相同。本次未扩大范围修改这些既有问题。

## 视觉检查

已实际打开检查 1440px 桌面、390px 手机的积分浮层、签到弹窗、尊享解锁弹窗、详情、流水及 18+ 页头截图。深色粉紫风格一致，无横向滚动；低高度浮层与弹窗内部可滚动。新增 UI 测试未发现未捕获的浏览器错误。

截图位于 `.local/points-1440.png`、`points-390.png`、`points-checkin-390.png`、`points-unlock-390.png`、`points-unlocks-390.png`、`points-transactions-390.png`、`points-adult-header-390.png`。

## 正式环境边界

当前完成的是现有架构下可运行、可持久化、可并发验证的隔离预览实现。正式环境仍需接入数据库事务和唯一索引、真实支付订单/回调与退款授权、正式账户服务及授权片源/播放凭证。文件账本适用于一个本地预览服务进程，不作为分布式生产数据库使用。

演示充值明确说明不会真实扣款，不写入正式订单服务；退款规则已提供但真实退款必须经支付/后台服务授权。预览播放器只使用现有本地测试片段，并明确标注；生产包继续移除演示片源与演示服务，不把积分记录冒充正式片源授权。
