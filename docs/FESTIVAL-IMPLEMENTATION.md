# 中秋国庆双节活动

本地预览：<http://127.0.0.1:5174/festival>。未发布线上。

## 第二版视觉调整

- 活动主视觉改为全宽、占满页头以下首屏，取消外部留白和圆角框；按实际页头高度适配。
- 900px 以下使用竖版主视觉；艺术字仍独立叠加、完整显示。
- 奖励区使用金属边框、红金领奖券和灯笼进度。移除英文小标题、装饰性副标题及本地预览提示；生产环境边界保留在本文档，不改变后端隔离。
- 使用 imagegen 生成透明月亮礼盒素材 `public/assets/festival/moon-gift.png`，用于页头入口和参与奖励。手机页头保留44px可访问入口。
- 参考：[王者荣耀周年庆专题](https://pvp.qq.com/cp/a20171015act/pageweb.html)、[中秋活动视觉](https://game.xiaomi.com/viewpoint/1321927285_1631885041267_16)。仅借鉴活动分区和节日视觉方向，未复制第三方素材。
- 本轮不改动积分和邀请规则。

## 页面与素材

- `/festival` 为四个入口的统一站内目的地：首页轮播、18+轮播、页头礼物入口、热门推荐上方横条。
- 保留已有剧集轮播内容、专区确认、搜索、积分菜单及会员入口。
- 三张指定 PNG 原样复制到 `public/assets/festival/`，未生成或改写图片。横图 1942×809，竖图 1122×1402，透明标题 1536×1024 RGBA，保留 Alpha。
- `FestivalArtwork` 将背景 picture、透明标题 img、CSS 轻量动效独立分层；活动页900px 以下切换竖构图，其他入口700px 切换。首页竖海报卡独立使用竖版构图。没有重复主标题或 banner LOGO。
- 手机端页头活动入口仅显示礼物图标，保留 44px 点击区域及“双节福利”可访问名称。支持减少动态效果，不播放声音。
- 活动页包含参与领奖、5格邀请进度、复制与手动复制、活动奖励汇总/流水、完整规则。积分明细跳转 `/me/points?tab=transactions`。

## 统一钱包与一致性

没有增加活动钱包。活动余额变更仍写入 `PointsWallet.pointsBalance` 和原有 `transactions`；客户端通过原有 `pointsService.refresh()` / `usePoints()` 同步页头、积分菜单与积分页。

新增流水类型：`festival_participation`、`festival_invitation`。每条流水带 `activityId`、`rewardId`，邀请流水另带 `invitationId`。活动累计从活动奖励记录求和，不使用当前余额。

本地 `previewPoints` 在同一状态快照中保存钱包、注册账号、邀请关系与奖励记录，整次变更通过临时文件和原子重命名提交。领取按活动/账号去重；新注册账号与被邀请用户唯一性均由服务端校验；每位邀请人计奖上限5位。超过5位仍记录有效注册，奖励不再增加。保存失败不替换内存状态。

活动奖励记录可查询恢复；响应中的 `awarded` 区分本次到账与历史领取。只有本次到账显示成功动效。页面数据按账号隔离，异步版本号过滤过期响应，切换账号重建任务状态。BroadcastChannel 同步同源标签页；活动页定期/重新获得焦点时查询邀请到账并刷新统一积分。

## 邀请及预览注册

- `GET /api/v1/festival`：查询状态、专属邀请码、邀请数与活动记录，游客仅获得公开状态。
- `POST /api/v1/festival/claim`：已登录账号领取参与奖励；忽略客户端金额、会员等级。
- `POST /api/v1/festival/referral`：验证专属邀请码，将首次有效邀请归属保存为 HttpOnly/SameSite cookie。已存在有效归属时不允许后来的链接覆盖。
- `POST /api/v1/auth/register`：沿用账号密码表单，本地预览补齐注册。账号创建、邀请记录和邀请奖励同一提交。预览密码使用带随机 salt 的 scrypt 保存；注册账号重启后可登录。既有配置账号不得重新注册。
- 注册前等待邀请绑定请求，失败可重试；未完成绑定的候选邀请码保存在会话存储，站内跳转/刷新后继续处理。有效归属以服务端为准。支持 Web Locks 的浏览器串行处理跨标签页首次绑定。
- 复制、打开链接、老用户登录均不发奖；注册为既有账号或同名账号的请求被拒绝。没有手机号或新增邮箱验证。
- 开发接口仅由 Vite `apply: 'serve'` 插件提供，不进入生产前端包。`.local` 数据不允许通过开发静态服务访问；没有新增面向正式用户的测试按钮。

## 时间与生产接入

集中配置在 `src/services/festivalModel.ts`：活动 ID、参与20、邀请20、最多5、`startsAt`、`endsAt`、`enabled`。正式默认关闭，起止时间为空，显示“活动时间待公布”，未编造日期/倒计时。开发预览在 `server/previewFestival.ts` 明确使用开启覆盖。根据本轮要求，前台移除预览说明；服务环境隔离仍保留。结束只停止新增奖励，不回收已发积分。

上线前需要正式后端实现上述接口和邀请绑定、注册联动，并配置真实活动时间。生产应以数据库事务/锁及唯一约束实现同样规则：

1. 参与奖励唯一键 `(activity_id, user_id, participation)`。
2. 被邀请人唯一键 `(activity_id, invitee_id)`，邀请奖励唯一键 `(activity_id, invitation_id)`，积分流水关联奖励唯一 ID。
3. 注册成功与邀请归属、奖励、积分流水原子提交；邀请人计奖数量在事务内锁定并校验最多5位。
4. 使用正式会话、CSRF、密码存储与注册防滥用设施；多实例部署不能共享本地 JSON 作为数据库。

当前预览存储只适用于**单个 Vite 进程**；原子文件替换不等于生产数据库的多进程事务。预览 cookie、注册账号和邀请链接不是生产账号/生产邀请服务。正式部署不应复制 `.local` 数据。

## 验证

- `npm.cmd run build`。
- Playwright：`festival.spec.ts`、`points-rules.spec.ts`、`points-api.spec.ts`、`points.spec.ts`、`auth-modal.spec.ts`、`membership-recharge.spec.ts`，43项通过。
- 独立临时预览服务和临时账本进行活动写入测试，没有重置现有账号积分/记录。
- 覆盖并发领取唯一流水、5人/6人邀请上限、注册重复请求、首次归属不可覆盖、自邀/老用户不计奖、新用户本人领奖、写失败回滚、响应丢失恢复、服务重启读取、未开始/结束、登录领奖续接、复制失败、跨页面注册邀请、双标签同步、迟到响应账号隔离。
- 320、390、768、1440宽度检查无横向溢出且标题完整；减少动态、触屏、原有18+确认与分页、积分菜单键盘操作均验证。
- 桌面/手机截图：`.local/festival-verified-1440.png`、`.local/festival-verified-390.png`；专区截图 `.local/festival-adult-1440.png`、`.local/festival-adult-390.png`。

运行示例（PowerShell）：

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5174
$env:PW_BASE_URL='http://127.0.0.1:5174'
$env:PW_TEST_CHANNEL='chrome'
node node_modules/@playwright/test/cli.js test festival.spec.ts points-rules.spec.ts points-api.spec.ts points.spec.ts auth-modal.spec.ts membership-recharge.spec.ts --reporter=line --output=.local/festival-tests
```
