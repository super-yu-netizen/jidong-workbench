# 肌动发布说明

本项目分别发布源码、Cloudflare 前端和飞书妙搭前端。两个站点使用相同业务代码与初始体验档案，个人记录保存在各自浏览器中。

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
