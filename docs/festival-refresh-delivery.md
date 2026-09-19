# 双节活动改造交付（2026-09-19）

已在现有项目上完成修改，未部署、未发布。

## 活动规则

- 北京时间 2026-09-19 00:00:00 开始，2026-10-08 00:00:00 截止，左闭右开。活动页保留未开始、进行中、已结束状态。
- 参与奖励 50 积分，每账号一次；有效新用户邀请每位 50 积分，最多计奖 5 位，邀请最高 250 积分。
- App 专享预留 50 积分，非充值任务最高 350 积分。会员加赠没有账号次数上限，不宣传整个活动的固定总上限。
- 悦享月卡、尊享月卡、悦享年卡、尊享年卡每笔分别加赠 100／300／1000／3000 积分。普通积分包不参加。
- 金额、日期、下载地址、方案对应关系集中在 [festivalModel.ts](../src/services/festivalModel.ts)。各入口、任务、弹窗、规则和进度从配置派生。

## 页面与素材

- 首页 `FestivalStrip` 改为约 170px 高的三部分横幅：左侧节日场景、中间奖励文字、右侧加赠提示与 CTA。手机改为紧凑纵向卡片，装饰放右上。
- 复用桌面／手机节日背景和 `moon-gift.png`，通过 CSS 背景裁切、透明渐变和前景叠放组合圆月、桂花、灯笼、烟花、礼盒、飘带、星点与积分币；未引入网络图片。
- 按后续确认恢复原版金色立体艺术字，仅将图中“120”改为“350”，使用 `aiai-festival-title-350-transparent.png`。首页和 18+ 轮播共用标题；删除主视觉新增副标题、日期和活动页左下角领奖按钮。
- 全横幅链接、Enter 打开、焦点框、轻微 hover、减少动态效果均保留；装饰不朗读、不截获点击。
- 活动任务扩展为四项，桌面 2×2、手机单列；奖励统计为六项，手机两列。
- 会员页保留既有方案，增加活动横幅、月／年卡加赠说明、完整活动区和购买弹窗说明。悦享 320、尊享 960 积分/月及年卡逐月发放逻辑保留。
- `/membership?campaign=festival#festival-recharge` 可定位活动区，已付费会员也能进入方案页面；活动到期时自动移除加赠区与角标。

## 订单、积分与退款

- [festivalOrders.ts](../server/festivalOrders.ts) 接收可信服务端订单快照，按订单方案和 `paidAt` 计算活动加赠，客户端不能指定金额。
- 本地预览购买先生成服务端订单，再在同一份账本提交中写入会员权益、活动奖励和统一积分流水。请求幂等键防止重复创建订单，活动 ID＋订单 ID 防止重复加赠。
- 未支付、处理中、失败、取消、关闭、无有效支付时间及活动期外支付均不发奖；建单时间不决定资格。
- 全额退款钩子 `refundOrder` 创建一次反向流水；余额不足时最多扣到 0，记录 `insufficient_balance` 和未回收数量。重复退款及退款后的重复支付通知不重复处理。
- 奖励统计只包含本活动记录；充值统计与累计统计按已实际回收的积分净额展示。月度发放、签到、普通积分包不计入活动奖励。
- 订单历史、订单详情和积分明细保留活动奖励关联。流水可展开活动 ID、奖励 ID、邀请／订单 ID；退款异常显示未回收数量。订单接口只返回当前账号的记录。
- 现有预览账本以单进程同步变更、临时文件写入和原子替换实现提交。它不是生产数据库或真实支付网关。

## 主要文件

- 规则与账本：`src/services/festivalModel.ts`、`src/services/pointsModel.ts`、`server/festivalOrders.ts`、`server/previewFestival.ts`、`server/previewPoints.ts`、`vite.config.ts`。
- 页面与入口：`src/components/FestivalArtwork.tsx`、`Header.tsx`、`Carousel.tsx`、`src/adult/AdultHero.tsx`、`src/pages/FestivalPage.tsx`、`MembershipPage.tsx`、`PointsPage.tsx`、`AccountPages.tsx`、`CommercePages.tsx`。
- 状态与样式：`src/hooks/useFestivalPhase.ts`、`src/services/backend.ts`、`src/styles/festival-refresh.css`、`membership-recharge.css`、`src/App.tsx`。
- `HomePage.tsx` 继续使用原位置的 `FestivalStrip`；既有积分与活动客户端服务继续负责刷新和账号切换。

## 验证结果

生产构建 `npm.cmd run build` 通过；`git diff --check` 通过。

55 项开发测试通过，另 1 项生产边界测试在 `vite preview` 的构建产物上通过，共 56 项：

- `tests/festival-recharge.spec.ts`：新增 11 项，覆盖北京时间边界、四方案金额、重复订单、多笔续费、支付状态／时间、退款不足、持久化失败回滚、App 空链接、会员锚点、活动结束自动隐藏和响应式。
- `tests/festival.spec.ts`：更新原 9 项，新增 1 项 HTTP 并发购买、账号订单隔离、订单详情和积分流水界面验证；保留并发领奖、邀请上限、登录回跳、刷新、跨页与跨标签同步验证。
- `tests/membership-recharge.spec.ts`：4 项通过，更新年卡定位以区分原年卡入口与新增活动入口。
- `tests/points-api.spec.ts`：1 项通过，基础积分回归显式关闭活动，独立验证原始会员积分逻辑。
- `tests/points-rules.spec.ts`：6 项通过。
- `tests/points.spec.ts`：15 项通过，含播放解锁、充值回跳、积分明细、触屏、18+ 确认及分页。
- `tests/auth-modal.spec.ts`：8 项通过。
- `tests/production-boundary.spec.ts`：1 项通过，单独在生产预览运行，验证无演示播放、无演示后台。

320／390／768／1440 宽度的首页、活动页、会员页无横向溢出。已人工查看桌面、手机最终截图，检查文字、CTA、装饰层次、四任务布局与会员加赠；相关页面未出现新增 JavaScript 运行错误。窗口切换尺寸的测试等待浏览器完成媒体查询布局后再判断溢出。

最终截图保存在本机 `.local/festival-final/`：

| 页面 | 桌面 1440 | 手机 390 |
| --- | --- | --- |
| 首页活动横幅 | [桌面](../.local/festival-final/home-1440.png) | [手机](../.local/festival-final/home-390.png) |
| 活动页 | [桌面](../.local/festival-final/festival-1440.png) | [手机](../.local/festival-final/festival-390.png) |
| 会员活动区 | [桌面](../.local/festival-final/membership-1440.png) | [手机](../.local/festival-final/membership-390.png) |

## 本期边界

`appDownloadUrl` 仍为空。点击下载只显示“下载页面即将上线”，不刷新、不跳顶、不新增积分；未实现 App 来源识别、App 领奖接口或伪造领取状态。

真实认证、积分、订单与支付后端仍属于项目原有未接入能力。本次完成的是现有本地预览服务中的真实账本变更和可复用服务端订单结算逻辑；正式界面继续显示支付不可用。退款入口是服务端钩子，没有开放浏览器伪造退款接口。以后接入真实支付时需由可信支付服务传入订单快照，并在生产数据库事务和唯一约束中接入这套奖励规则。

## 艺术字恢复修订

按用户后续要求，直接沿用原版“月满中秋／礼遇国庆”艺术字，仅把底部 120 改为 350，不增加其他主视觉文字。去掉活动页左下角按钮和日期；活动未开始／已结束状态放在任务区上方。

使用内置 imagegen 编辑原标题素材，最终资源：[aiai-festival-title-350-transparent.png](../public/assets/festival/aiai-festival-title-350-transparent.png)。编辑提示核心：仅将原图 120 改为 350，保留其余文字、字体、金色立体材质、粉紫描边、桂花与光带、构图及透明背景，不新增文字。

本轮生产构建通过，桌面 1440 与手机 390 主视觉截图已检查，无横向溢出，已确认没有新增标题文字、左下按钮或时间。截图：`.local/festival-title-revision/hero-1440.png`、`hero-390.png`。

## 透明底修复

上一版文件虽有 alpha 通道，但只有 7 个像素完全透明，文字周围保留了棕金色背景。已使用内置 imagegen 做背景移除，保持原艺术字和 350 文案。最终资源：`public/assets/festival/aiai-festival-title-350-transparent.png`；旧版移出公开素材目录。

编辑提示：仅移除黑、棕、金粉色背景与宽幅光雾；字间、字内空隙必须 alpha=0，保留金色立体文字、粉紫边缘、桂花、细光带与星点，不改文字和构图。

核验：修复版 859835 个像素完全透明（54.7%），已在棋盘格和实际页面检查字内空隙、文字周围与边缘。对比图 `.local/festival-title-revision/alpha-comparison.png`；最终页面截图 `transparent-hero-1440.png`、`transparent-hero-390.png`。两种尺寸均无横向溢出，无新增主视觉文案、左下角按钮或时间。
