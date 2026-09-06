# 肌动发布说明

本项目分别发布源码、Cloudflare 前端和飞书妙搭前端。两个站点使用相同业务代码与初始体验档案，个人记录保存在各自浏览器中。

## 源码入口

- GitHub：<https://github.com/super-yu-netizen/jidong-workbench>（私有仓库，2026-09-06 已上传）
- 初次应用提交：`db5deb4`。
- 发布前验证：46 项数据检查全部通过；隔离目录独立构建与正式产物逐文件哈希一致；六张原创场景素材检查通过。

## Cloudflare 公开应用

- 稳定地址：<https://jidong-workbench.pages.dev>
- 本次版本：<https://50e2341e.jidong-workbench.pages.dev>
- 2026-09-06 发布完成，应用版本对应 `db5deb4` 的源码；本次发布时仅部署说明有未提交修改。
- 无登录 HTTP 验证：16 个页面、程序及素材文件均为 200，内容 SHA256 与本地构建完全一致；`sw.js` 响应为 `Cache-Control: no-cache`。

## 飞书妙搭发布版

- 发布地址：<https://xcnj7y0pahwg.feishu.cn/page/SVRBm6d7BdZuU2ai5x0c20wanRd>
- 应用 ID：`app_17dkfxx53bk`，发布 ID：`7682374958311394499`。
- 发布状态为 `finished`，运行提交 `7e24fd0e5304f9a8f92dff2e1b2e96503722671e`。原数据 46 项检查和平台适配检查通过。
- 已公开：`link_share_entity=anyone_readable`，`external_access_entity=open`。全新无痕窗口无需飞书登录，可进入完整应用。
- 实际操作验证：新增 250 ml 补水后，1,400 ml → 1,650 ml，首页进度 70% → 73%，最近记录同步；刷新并重新打开仍保留。验证只使用独立无痕档案，关闭后清除，没有改动正常浏览器里的个人记录。
- 六类核心素材（哑铃、动作连拍、餐盘、体测、补水瓶、恢复）均逐个打开大图检查，Logo 和主视觉也正常显示。
- 10 个原创图片和 SVG 已上传该妙搭应用的独立文件存储，最终引用平台返回的 `/spark/` 地址。素材由实际应用容器宿主提供，无外部图片依赖，不使用到期签名链接。不要把路径拼到飞书文档的租户域名，也不要改为 Cloudflare 图片外链；妙搭容器的图片策略会拦截外部域名。
- 妙搭的托管容器不注册根目录 Service Worker，因此不承诺断网后重新打开页面。个人记录仍保存在浏览器中，完整备份可与本机和 Cloudflare 版本迁移。

## 发布方式

- GitHub 保存源代码，仓库保持私有。
- Cloudflare Pages 直接上传 `npm run build` 生成的 `dist/`。
- 飞书妙搭在独立派生目录适配托管路径，原创图片上传至该应用文件存储，经过 Git 推送后创建发布版本。
- 上传代码不包含用户在本机浏览器新增的记录、个人文件、环境凭证或测试截图。

## 后续更新

先执行 `node scripts/check-data.mjs` 与 `npm run build`，确认无误后提交并推送源代码，再执行：

```sh
npx wrangler pages deploy dist --project-name jidong-workbench --branch main
```

Cloudflare 使用直接上传方式，推送 GitHub 不会自动更新站点。飞书妙搭需要单独同步派生版本并完成发布。

## 个人数据

Cloudflare、飞书妙搭和本机地址分别拥有独立的浏览器存储空间。需要迁移时，在原入口的个人设置导出完整数据，再在新入口恢复。不要把个人导出的 JSON 或图片提交到代码仓库。

关闭网页后不会发送系统通知，提醒在应用打开时按记录的下一次日期计算。
