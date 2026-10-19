# usn0m3.github.io

个人网站：作品集、博客和简历。基于 Astro 构建，推送到 `main` 分支后会自动发布到 https://usn0m3.github.io 。

## 本地预览

```bash
npm install      # 第一次运行时需要
npm run dev      # 打开 http://localhost:4321 ，改完文件页面会自动刷新
```

## 写一篇文章

在 `src/content/blog/` 下新建 `文章名.md`。如果需要配图，就新建文件夹 `文章名/`，把正文写进其中的 `index.md`，图片放在同一个文件夹里。

```markdown
---
title: My post title
description: One sentence shown in lists and search results.
pubDate: 2026-10-18
tags: [nodejs, performance]
draft: true        # 写完删掉这一行才会发布
---

正文……  ![图片说明](./diagram.png)
```

## 加一个项目

在 `src/content/projects/` 下新建 `项目名.md`。如果有封面图，就改用文件夹形式 `项目名/index.md`，封面图放在同一个文件夹里。

```markdown
---
title: Project name
summary: One-line description.
stack: [TypeScript, React]
repo: https://github.com/usn0m3/xxx     # 可选
demo: https://xxx.example.com            # 可选
cover: ./cover.png                       # 可选，建议 16:9
featured: true                           # 在首页展示（最多显示 3 个）
order: 1                                 # 数字越小越靠前
---

## Problem
## Approach
## Results
```

## 修改个人信息和简历

- 个人信息在 `src/data/profile.yaml`。年月要写成带引号的 `"2023-07"`，在职的结束时间写 `present`。
- 简历：用你自己的 PDF 替换 `public/resume.pdf`，文件名保持不变。

## 发布

```bash
npm run verify   # 本地完整检查：类型、构建、测试
git add -A
git commit -m "post: my new article"
git push
```

推送后 GitHub Actions 会自动构建，一两分钟后网站更新。进度可以在仓库的 Actions 页面查看。

## 构建失败怎么办

报错信息会指出出错的文件和字段，例如 `blog → my-post` 的 `title: Required`。按提示改好后重新推送即可。构建失败期间，线上会保留上一个能正常构建的版本。

## 测试

- `npm test`：单元测试，覆盖排序、日期格式化和内容校验规则。
- `npm run test:build`：检查构建结果，适用于任何内容（死链、草稿是否泄漏、RSS、sitemap、每页的 SEO 信息）。CI 每次部署前都会运行。
- `npm run test:sample`：只针对仓库自带的示例内容（Jane Doe、示例文章和项目）。把这些换成你自己的内容后，这组测试会失败，属于正常现象，可以直接删除 `tests/sample/` 文件夹。CI 不会运行这组测试。

## 设计

视觉规范见 `DESIGN.md`（基于 Ferrari 的设计语言），颜色和间距定义在 `src/styles/tokens.css`。
