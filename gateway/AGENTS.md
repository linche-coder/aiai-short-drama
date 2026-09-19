# 前置入口页维护范围

本文件适用于 gateway/ 及其子目录。

- gateway 是独立线路入口项目；仓库根目录是主站。除非任务明确要求联动，不修改主站 src/、public/、package.json 或 .openai/hosting.json。
- 在 gateway/ 下运行 npm run dev、npm test、npm run build；无外部 npm 依赖。
- 线路只在 src/lines.json 中维护，始终保留 6 项。未确认地址使用 null，不生成有效链接。
- 复用现有 public/assets/logo.svg，不重新设计 LOGO。
- 发布项目根目录必须为 gateway/，输出为 gateway/dist/，使用 gateway/.openai/hosting.json 的 project_id。不要混用主站的 Site ID、配置或产物。
- 入口页线上地址：https://aiai-drama-gateway.docile-shell-2494.chatgpt.site 。当前访问权限为 public，后续部署保持该权限。
- 主站欢迎动画跳过参数仅在双方约定后启用；不依赖跨域浏览器存储。
- 入口页包版本独立于主站版本。不要移动或覆盖主站 v1.1.1 标签。
