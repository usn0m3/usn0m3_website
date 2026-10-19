# 个人网站设计文档

- 日期：2026-10-18
- 状态：待审阅

## 1. 目标

一个**英文**的开发者个人网站，用于**求职 / 接活**。访客（招聘方、客户）能快速了解：你是谁、做过什么项目、怎么联系你或下载简历。

**成功标准**

- 招聘方 30 秒内能看懂你的定位和代表作。
- 新增一篇文章或一个项目，只需要新建一个 `.md` 文件，然后 `git push`。
- 内容写错（缺字段、日期格式不对、链接无效）时构建失败，线上保持上一个正常版本。
- 桌面端和手机端（宽度 375px）都能正常浏览，页面不出现横向滚动。

## 2. 范围

**做：**首页、项目列表、项目详情、博客列表、文章页、About 页、404 页；RSS、sitemap、每页的 SEO 和社交分享信息（Open Graph）；GitHub Pages 自动部署。

**不做（以后需要再加）：**标签筛选页、评论、站内搜索、多语言、联系表单、浅色模式切换、访问统计。

## 3. 技术选型

| 项 | 选择 | 说明 |
|---|---|---|
| 框架 | Astro（当前最新稳定版） | 生成纯静态 HTML，默认不输出客户端 JS |
| 内容 | Astro Content Collections（Content Layer：`glob` / `file` loader） | 用 zod 定义 schema，在构建时校验 |
| 样式 | 原生 CSS，配合 CSS 变量（design tokens） | 不引入 Tailwind，tokens 直接对应 DESIGN.md |
| 字体 | Inter Variable，用 `@fontsource-variable/inter` 自托管 | 替代授权字体 FerrariSans；不请求外部字体服务 |
| 代码高亮 | Astro 内置 Shiki，使用 `github-dark` 主题 | 用 CSS 把代码块底色覆盖为 `#303030` |
| 图片 | `astro:assets` | 自动压缩，并输出 WebP |
| RSS / sitemap | `@astrojs/rss`、`@astrojs/sitemap` | |
| 部署 | GitHub Actions（`withastro/action`）→ GitHub Pages | |
| 运行环境 | Node 24（本机已安装） | |

## 4. 页面与路由

| 路由 | 页面 | 内容 |
|---|---|---|
| `/` | 首页 | Hero 区：身份小标签（role · location）、大标题、简介；一个红色主按钮 *View Projects*、一个描边按钮 *Download Résumé*（规范要求每屏最多一主一辅），外加一个文字链接 *Get in touch →*（`mailto:`）。下面依次是精选项目（`featured: true`，按 `order` 排序，最多 3 个）和最新 3 篇文章 |
| `/projects/` | 项目列表 | 所有项目卡片，按 `order` 升序排列 |
| `/projects/<slug>/` | 项目详情 | 标题、简介、技术栈、GitHub / Demo 链接、封面图、Markdown 正文 |
| `/blog/` | 博客列表 | 已发布的文章按 `pubDate` 倒序排列，每条显示标题、日期、摘要、标签 |
| `/blog/<slug>/` | 文章页 | 标题、日期（有更新时显示更新日期）、阅读时间、标签、正文 |
| `/about/` | 关于 | 简介、技能分组、工作经历时间线、教育背景、简历下载、联系方式 |
| `/404` | 404 | 提示页面不存在，并提供返回首页的链接 |
| `/rss.xml` | RSS | 已发布文章 |
| `/sitemap-index.xml` | sitemap | 自动生成 |

**导航栏：**左侧是红色小方块加大写的名字（链接到首页）；右侧是 PROJECTS · BLOG · ABOUT，当前页面的链接有高亮。手机端也直接显示这三个链接，不做汉堡菜单。

**页脚：**GitHub / LinkedIn / Email 图标链接、RSS 链接和版权行。

## 5. 内容模型

### 目录结构

```
src/content/
  blog/<slug>.md  或  blog/<slug>/index.md（文件夹里可以放配图）
  projects/<slug>.md  或  projects/<slug>/index.md
src/data/profile.yaml
public/resume.pdf
```

slug 取自文件名或文件夹名。

### blog schema

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | |
| `description` | string | 是 | 用于列表摘要和 SEO |
| `pubDate` | date | 是 | |
| `updatedDate` | date | 否 | |
| `tags` | string[] | 否，默认 `[]` | |
| `draft` | boolean | 否，默认 `false` | 为 `true` 时生产构建会排除，开发模式下可见 |

### projects schema

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | |
| `summary` | string | 是 | 一句话简介 |
| `stack` | string[] | 是，至少 1 项 | 技术栈 |
| `repo` | URL | 否 | |
| `demo` | URL | 否 | |
| `cover` | image | 否 | 相对路径，由 `image()` 校验；没有封面时卡片顶部显示 `#303030` 色块和项目名 |
| `featured` | boolean | 否，默认 `false` | |
| `order` | number | 否，默认 `100` | 数字越小越靠前；`order` 相同时按标题字母排序 |

### profile.yaml（只有一份）

```yaml
name: Jane Doe
role: Software Engineer
location: Shanghai
headline: "Built for speed. Engineered to last."   # 首页大标题
intro: "I build fast, reliable web apps…"          # 首页简介（1–3 句）
bio: |                                              # About 页的详细介绍，支持 Markdown
  …
email: you@example.com
links:
  github: https://github.com/usn0m3
  linkedin: https://www.linkedin.com/in/…           # 可选
skills:
  - group: Languages
    items: [TypeScript, Go, Python]
experience:
  - company: Acme
    role: Software Engineer
    start: 2023-07
    end: present                                    # 或 YYYY-MM
    summary: "…"
    highlights: ["…", "…"]
education:
  - school: …
    degree: …
    start: 2019-09
    end: 2023-06
```

使用 `file()` loader 加载，并用 zod schema 校验：`email` 和 `links.*` 必须符合格式，`start` / `end` 必须是 `YYYY-MM` 或 `present`。

### 阅读时间

按正文英文单词数 ÷ 200 计算，向上取整，最少显示 1 分钟。

## 6. 视觉设计（基于 Ferrari DESIGN.md）

设计规范来源：`design-refs/awesome-design-md/design-md/ferrari/DESIGN.md`，实现时复制到项目根目录，命名为 `DESIGN.md`。

### 照搬

- **颜色 tokens：**canvas `#181818`（不用纯黑）、ink `#ffffff`、body `#969696`、muted `#666666` / `#8f8f8f`、hairline `#303030`、surface-card `#303030`、primary（Rosso Corsa）`#da291c`，hover 状态 `#9d2211`，按下状态 `#b01e0a`。
- 红色只用于：主按钮、导航栏里的名字标识方块、当前导航项的下划线、正文链接 hover。不做大面积铺色。
- **圆角：**按钮、卡片、色块一律 0px；只有输入框（暂无）可以用 4px。
- **字体层级：**display 字重 500，不使用粗体标题。按钮、导航、小标签用大写，并加宽字距（按钮 1.4px，标签 1.1px，导航 0.65px）。
- **间距：**8px 阶梯（4 / 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128）。大区块之间留 96px，手机端缩到 64px。
- **内容宽度：**最大 1280px；文章正文最大约 70ch。

### 改造

| 原规范 | 改造后 | 原因 |
|---|---|---|
| FerrariSans | Inter Variable，标题字距 -1% | 授权字体；规范本身推荐 Inter 作为替代 |
| 全屏赛车照片 Hero | 大字号标题作为主视觉（桌面约 80px，手机约 44px，用 `clamp()` 缩放） | 个人站没有这类照片素材 |
| “电影感”图片 | 放到项目卡片：截图铺满卡片顶部（16:9） | 让项目成为视觉重点 |
| Cavallino 跃马 logo | 8px 红色方块加大写名字 | 不使用品牌标识 |
| 正文 `#969696` | 文章页正文提亮到 `#e0e0e0`，行高 1.7 | 长文阅读更舒服 |

### 可访问性

- 文字对比度：`#969696` 在 `#181818` 上约 6:1，白字在 `#da291c` 上约 4.9:1，都满足 WCAG AA。
- 所有可交互元素都有可见的 focus 样式（2px 白色 outline，偏移 2px）。
- 图片必须写 alt；纯图标链接要加 `aria-label`。
- 尊重 `prefers-reduced-motion`：只用颜色过渡，不做位移动画。

## 7. 代码结构

```
astro.config.mjs            site、integrations（sitemap）、Shiki 主题
src/
  content.config.ts         三个 collection 的 schema
  lib/
    content.ts              getPublishedPosts / getSortedProjects / getFeaturedProjects / readingTime
  styles/
    tokens.css              所有 design tokens（CSS 变量）
    global.css              重置、基础排版、focus 样式
    prose.css               文章和项目正文样式（标题、列表、代码块、引用、图片）
  layouts/
    BaseLayout.astro        <head>（SEO / OG / 字体 / RSS link）+ Header + slot + Footer
    ProseLayout.astro       文章页和项目详情页共用的正文排版
  components/
    Header.astro  Footer.astro
    Hero.astro              读取 profile
    Button.astro            variant: primary | outline；渲染为 <a>
    Label.astro             大写小标签
    ProjectCard.astro
    PostListItem.astro
    Timeline.astro          About 页的经历时间线
  pages/
    index.astro  404.astro  rss.xml.ts
    projects/index.astro  projects/[...slug].astro
    blog/index.astro      blog/[...slug].astro
    about.astro
public/
  resume.pdf（占位）  favicon.svg（红色方块）
.github/workflows/deploy.yml
DESIGN.md
```

**边界约定：**页面不直接调用 `getCollection`，统一通过 `src/lib/content.ts` 获取数据，草稿过滤和排序规则都只写在这一处。组件只接收 props，不自己读取内容。

## 8. 部署

- 仓库为 `usn0m3/usn0m3.github.io`，`astro.config.mjs` 中设置 `site: 'https://usn0m3.github.io'`，不需要设置 `base`。
- `.github/workflows/deploy.yml`：推送到 `main` 时触发，依次执行 checkout → `withastro/action`（安装依赖、运行 `astro check`、build）→ `actions/deploy-pages`。
- `.gitignore`：`node_modules/`、`dist/`、`.astro/`、`design-refs/`。
- **由 Claude 通过 `gh` 完成（用户已登录 usn0m3）：**创建公开仓库 `usn0m3.github.io`；推送代码；把 Pages 的构建来源设为 GitHub Actions（`gh api` 调用 `POST /repos/usn0m3/usn0m3.github.io/pages`，参数 `build_type=workflow`）。创建仓库和每次推送前都会先征求用户同意。
- 推送到远程前会先征求用户同意。

## 9. 出错处理

| 情况 | 结果 |
|---|---|
| frontmatter 缺少必填字段或类型错误 | `astro build` 失败，报错指出文件和字段；不会部署 |
| `profile.yaml` 格式错误 | 同上 |
| `cover` 指向的图片不存在 | 构建失败 |
| 访问不存在的路径 | GitHub Pages 返回 `404.html` |
| 没有任何已发布文章或精选项目 | 首页隐藏对应区块；列表页显示一行说明文字 |
| `resume.pdf` 仍是占位文件 | 照常可以下载；README 里提醒替换 |

## 10. 测试与验证

1. `npm run check`（`astro check`）没有错误。
2. `npm run build` 成功，`dist/` 中包含所有路由、`rss.xml`、`sitemap-index.xml` 和 `404.html`。
3. **故意制造内容错误**（删掉某篇文章的 `title`），确认构建失败且报错信息清楚，然后恢复。
4. 确认草稿文章在生产构建中不出现，在 `npm run dev` 下可见。
5. 用浏览器分别在 1280px 和 375px 宽度下逐页检查：没有横向滚动、没有控制台报错、所有链接可以点击、focus 样式可见。
6. RSS 文件是有效的 XML，并且只包含已发布文章。

## 11. 初始占位内容

- `profile.yaml`：Jane Doe 的占位信息。
- 2 个示例项目（都设为 featured，其中 1 个带封面图）。
- 1 篇示例文章，演示代码块、图片和标题层级。
- 1 篇 `draft: true` 的示例草稿。
- `resume.pdf`：一页占位 PDF。
- `README.md`：用中文说明怎么写文章、加项目、改个人信息、本地预览和部署。
