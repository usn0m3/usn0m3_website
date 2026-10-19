# usn0m3_website

个人网站：作品集和博客。基于 Astro 构建，推送到 `main` 分支后会自动发布到 https://usn0m3.github.io/usn0m3_website/ 。

## 本地预览

```bash
npm install      # 第一次运行时需要
npm run dev      # 打开 http://localhost:4321/usn0m3_website/ ，改完文件页面会自动刷新
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

## 修改个人信息

个人信息在 `src/data/profile.yaml`：名字、定位、首页标题、简介、About 页的介绍、邮箱、GitHub 和 LinkedIn。网站不放工作经历、技能和教育背景，这些放在 LinkedIn 上；首页和 About 页的 LinkedIn 按钮会链接过去。如果删掉 `linkedin` 那一行，按钮会自动隐藏。

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

项目和博客暂时为空时也能正常构建：首页会隐藏对应区块（Hero 区也不会显示 View projects 按钮），列表页会显示“即将更新”的提示。`src/content/blog/` 和 `src/content/projects/` 里的 `.gitkeep` 用来让 git 保留这两个空文件夹，加了内容之后也不用删。

## 设计

视觉规范见 `DESIGN.md`（基于 Ferrari 的设计语言），颜色和间距定义在 `src/styles/tokens.css`。

## 网址和子路径

仓库名是 `usn0m3_website`，所以 GitHub Pages 把网站放在子路径 `/usn0m3_website/` 下。`astro.config.mjs` 里的 `base` 就是这个子路径。站内链接一律写成 `url('/about/')` 的形式（来自 `src/lib/url.ts`），不要直接写 `/about/`，否则会漏掉子路径而导致 404。CI 的死链检查会拦住这种错误。

如果以后把仓库改名，或者绑定了自己的域名，只需要改 `astro.config.mjs` 里的 `base`（用自己的域名时改成 `''`，同时把 `site` 改成新域名）。
