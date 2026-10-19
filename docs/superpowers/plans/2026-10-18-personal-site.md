# 个人网站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Astro 搭建一个英文开发者个人网站（作品集、博客、简历），视觉采用 Ferrari DESIGN.md 风格，内容用 Markdown 编写，推送后通过 GitHub Actions 自动发布到 `https://usn0m3.github.io`。

**Architecture:** 纯静态 Astro 站点。内容放在三个 Content Collection 中（`blog`、`projects`、`profile`），schema 单独写在 `src/schemas.ts`，可以脱离 Astro 做单元测试。排序、过滤等纯函数放在 `src/lib/content.ts`，页面只通过 `src/lib/collections.ts` 取数据。样式用原生 CSS 加 design tokens（CSS 变量）。测试分两层：Vitest 单元测试（纯函数和 schema），以及读取 `dist/` 的构建产物测试。

**Tech Stack:** Astro 7.4、TypeScript 6、Vitest 5、zod 4（通过 `astro/zod` 引入）、yaml 2、sharp、@astrojs/rss、@astrojs/sitemap、Astro Fonts API（Fontsource 提供的 Inter），部署用 GitHub Actions 和 GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-10-18-personal-site-design.md`

**与 spec 的细微差异（均为实现层面的选择，已在调研中验证）：**
1. 字体改用 Astro 7 内置的 Fonts API，配合 `fontProviders.fontsource()`，替代 `@fontsource-variable/inter` 包。构建时同样会下载并自托管字体，另外还会自动生成 preload 和回退字体度量。
2. CI 不使用 `withastro/action`，改为显式写出每一步。这样才能在部署前运行单元测试和构建产物测试。
3. `profile.bio` 只支持纯文本段落（用空行分段），不支持 Markdown。这样可以少引入一个 Markdown 渲染依赖。
4. 页脚改用大写文字链接（GITHUB · LINKEDIN · EMAIL · RSS），不用图标。这与 Ferrari 的导航风格一致，也不需要图标库。
5. 示例项目从 2 个改为 3 个。第 3 个不设为 featured，用来测试“非精选项目不出现在首页”。

## Global Constraints

- Node `>=22.22.0`（本机为 24）；`astro@^7.4.0`；`typescript@^6`（`@astrojs/check@0.9.10` 的 peer 依赖要求 `^5 || ^6`，**不能装 TS 7**）；`vitest@^5.0.5`。
- `site: 'https://usn0m3.github.io'`，不设置 `base`。站内链接一律以 `/` 开头并以 `/` 结尾（如 `/blog/`），文件除外（如 `/resume.pdf`）。
- 网站文字全部为英文，`<html lang="en">`。源码中的文案用句首大写（sentence case），需要全大写的地方只用 CSS 的 `text-transform: uppercase` 实现。
- 颜色只能用以下 tokens：canvas `#181818`、surface/hairline `#303030`、ink `#ffffff`、body `#969696`、prose `#e0e0e0`、muted `#8f8f8f`、primary `#da291c`、primary-hover `#9d2211`、primary-active `#b01e0a`。
- 所有按钮、卡片和色块的圆角都是 `0`。标题字重 500，不使用粗体标题。
- 红色 `#da291c` 只用于：主按钮、名字标识方块、当前导航项下划线、正文链接下划线和 hover、引用块左边框、选中文字背景。
- 不输出任何客户端 JavaScript：`dist/` 中的 HTML 不能包含 `<script`。
- 页面和组件不直接调用 `getCollection` / `getEntry`，统一通过 `src/lib/collections.ts`。组件只通过 props 接收数据（例外：`BaseLayout` 会调用 `getProfile()`）。
- 内容最大宽度 1280px，正文最大宽度 70ch。宽度为 375px 时页面不能出现横向滚动。
- 每次提交的 commit message 末尾加上：`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## Review Focus

1. **草稿泄漏**：`draft: true` 的文章在生产构建中不能出现在任何地方，包括博客列表、首页、RSS、sitemap，也不能生成它自己的页面。→ Task 7 的 `draft never leaks` 测试会扫描整个 `dist/`。
2. **项目没有封面图**：卡片应显示 `#303030` 占位色块和项目名，不能出现坏图或空的 `<img>`；详情页不能渲染封面区域。→ Task 5 和 Task 6 的测试。
3. **站内死链**：尾斜杠、文件夹形式的 slug（`post/index.md`）、`/resume.pdf`、`/_astro/` 资源和 RSS 链接都必须指向 `dist/` 中真实存在的文件。→ Task 9 的链接检查测试。
4. **窄屏溢出**：正文中的超长 URL 或长代码行，在 375px 宽度下不能撑出横向滚动。→ Task 6 的示例内容故意包含这两种情况，测试会检查 CSS 规则；Task 9 再用浏览器实测。
5. **可选字段缺失**：没有 `demo`、`linkedin`、`updatedDate`、`cover` 时，HTML 中不能出现 `href=""`、`href="undefined"` 或空的按钮。→ Task 9 的 `no empty attributes` 测试。

---

## 文件结构

```
.github/workflows/deploy.yml     CI：构建、测试、部署
.gitignore
DESIGN.md                        从 design-refs 复制的 Ferrari 设计规范
README.md                        中文使用说明
astro.config.mjs                 site、sitemap、Fonts、Shiki 配置
package.json / tsconfig.json / vitest.config.ts
public/favicon.svg  public/resume.pdf
src/
  content.config.ts              三个 collection 的 loader 和 schema 绑定
  schemas.ts                     zod schema（可单独测试）
  data/profile.yaml
  content/blog/…  content/projects/…
  lib/content.ts                 纯函数：排序、过滤、阅读时间、日期格式化、分段
  lib/collections.ts             对 astro:content 的薄封装
  styles/tokens.css  global.css  prose.css
  layouts/BaseLayout.astro  ProseLayout.astro
  components/Header  Footer  Hero  Button  Label  ProjectCard  PostListItem  Timeline (.astro)
  pages/index  about  404 (.astro)  rss.xml.ts
  pages/projects/index.astro  [...slug].astro
  pages/blog/index.astro  [...slug].astro
tests/
  unit/content.test.ts  unit/schemas.test.ts
  build/helpers.ts  smoke  layout  home  projects  blog  about  site (.test.ts)
```

所有 shell 命令都在 Git Bash 中执行，工作目录为 `E:\selfuse website`（Git Bash 路径为 `/e/selfuse website`）。

---

### Task 1: 项目脚手架和 git 初始化

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/pages/index.astro`（临时页面）, `public/favicon.svg`, `DESIGN.md`, `tests/build/helpers.ts`, `tests/build/smoke.test.ts`

**Interfaces:**
- Produces: npm scripts `dev` / `build`（先运行 `astro check` 再 `astro build`）/ `preview` / `test`（单元测试）/ `test:build`（构建产物测试）/ `verify`；`tests/build/helpers.ts` 导出 `DIST`、`exists(file)`、`read(file)`、`page(route)`、`htmlFiles()`、`between(html, start, end)`、`cssText(html)`。

- [ ] **Step 1: 初始化 git**

```bash
cd "/e/selfuse website" && git init -b main && git config user.name && git config user.email
```

Expected：输出 `Initialized empty Git repository`，以及已配置的用户名和邮箱。**如果用户名或邮箱为空，停下来问用户该填什么，不要自己编造。**

- [ ] **Step 2: 写 `.gitignore`**

```gitignore
node_modules/
dist/
.astro/
design-refs/
*.log
.DS_Store
```

- [ ] **Step 3: 写 `package.json`**

```json
{
  "name": "usn0m3-site",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=22.22.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "test": "vitest run tests/unit",
    "test:build": "vitest run tests/build",
    "verify": "npm run build && npm test && npm run test:build",
    "astro": "astro"
  }
}
```

- [ ] **Step 4: 安装依赖**

```bash
npm i astro@^7.4.0 @astrojs/rss@^4.0.19 @astrojs/sitemap@^3.7.4 sharp yaml@^2.9.1
npm i -D @astrojs/check@^0.9.10 typescript@^6 vitest@^5.0.5 @types/node@^24
```

Expected：两条命令都正常结束，没有 `ERESOLVE` 报错。

- [ ] **Step 5: 写 `astro.config.mjs`**

```js
// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	site: 'https://usn0m3.github.io',
	integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Inter',
			cssVariable: '--font-inter',
			weights: ['100 900'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
	],
	markdown: {
		shikiConfig: { theme: 'github-dark' },
	},
});
```

- [ ] **Step 6: 写 `tsconfig.json` 和 `vitest.config.ts`**

`tsconfig.json`：

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "design-refs", "node_modules"]
}
```

`vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'node',
	},
});
```

- [ ] **Step 7: 写临时首页 `src/pages/index.astro`，以及 `public/favicon.svg`**

```astro
---
---

<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Coming soon</title>
	</head>
	<body>
		<p>Coming soon</p>
	</body>
</html>
```

`public/favicon.svg`：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#181818"/><rect x="10" y="10" width="12" height="12" fill="#da291c"/></svg>
```

- [ ] **Step 8: 复制设计规范**

```bash
cp design-refs/awesome-design-md/design-md/ferrari/DESIGN.md DESIGN.md
```

- [ ] **Step 9: 写构建测试的辅助函数 `tests/build/helpers.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const DIST = join(process.cwd(), 'dist');

if (!existsSync(DIST)) {
	throw new Error('dist/ not found. Run `npm run build` before `npm run test:build`.');
}

export function exists(file: string): boolean {
	return existsSync(join(DIST, file));
}

export function read(file: string): string {
	return readFileSync(join(DIST, file), 'utf8');
}

/** '/blog/' -> dist/blog/index.html, '/' -> dist/index.html */
export function page(route: string): string {
	const trimmed = route.replace(/^\/+|\/+$/g, '');
	return read(trimmed ? `${trimmed}/index.html` : 'index.html');
}

/** All .html files under dist/, as forward-slash paths relative to dist/. */
export function htmlFiles(dir: string = DIST): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) return htmlFiles(full);
		return entry.name.endsWith('.html') ? [relative(DIST, full).split(sep).join('/')] : [];
	});
}

/** The slice of `html` from the first `start` marker up to the next `end` marker. */
export function between(html: string, start: string, end: string): string {
	const i = html.indexOf(start);
	if (i === -1) throw new Error(`Marker not found: ${start}`);
	const j = html.indexOf(end, i + start.length);
	return html.slice(i, j === -1 ? undefined : j);
}

/** Inline <style> blocks of a page plus every bundled stylesheet in dist/_astro. */
export function cssText(html: string): string {
	const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
	const astroDir = join(DIST, '_astro');
	const files = existsSync(astroDir)
		? readdirSync(astroDir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(astroDir, f), 'utf8'))
		: [];
	return [inline, ...files].join('\n');
}
```

- [ ] **Step 10: 写冒烟测试 `tests/build/smoke.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { exists } from './helpers';

describe('build smoke', () => {
	it('produces the home page', () => {
		expect(exists('index.html')).toBe(true);
	});
});
```

- [ ] **Step 11: 构建并运行测试**

```bash
npm run build && npm run test:build
```

Expected：`astro check` 显示 `0 errors`，构建输出 `Complete!`，Vitest 显示 `1 passed`。

- [ ] **Step 12: 提交**

```bash
git add -A && git commit -m "chore: scaffold Astro project with test harness" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

运行 `git status --short` 确认 `design-refs/` 没有被提交。

---

### Task 2: 内容工具函数（TDD）

**Files:**
- Create: `src/lib/content.ts`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Produces（`src/lib/content.ts`）：
  - `selectPosts<T extends { data: { pubDate: Date; draft: boolean } }>(posts: readonly T[], opts: { includeDrafts: boolean }): T[]`：按 `pubDate` 倒序排列，不修改输入数组
  - `sortProjects<T extends { data: { title: string; order: number; featured: boolean } }>(projects: readonly T[]): T[]`：按 `order` 升序，相同时按标题排序
  - `selectFeatured<T …同上>(projects: readonly T[], limit?: number /* 默认 3 */): T[]`
  - `readingTime(body: string | undefined): number`：按每分钟 200 词计算，向上取整，最少 1
  - `formatDate(date: Date): string`：返回如 `"Oct 18, 2026"`（按 UTC）
  - `isoDate(date: Date): string`：返回如 `"2026-10-18"`
  - `formatYearMonth(value: string): string`：`"2023-07"` → `"Jul 2023"`，`"present"` → `"Present"`
  - `paragraphs(text: string): string[]`：按空行分段，去掉首尾空白，丢弃空段

- [ ] **Step 1: 写失败测试 `tests/unit/content.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import {
	formatDate,
	formatYearMonth,
	isoDate,
	paragraphs,
	readingTime,
	selectFeatured,
	selectPosts,
	sortProjects,
} from '../../src/lib/content';

const post = (id: string, pubDate: string, draft = false) => ({ id, data: { pubDate: new Date(pubDate), draft } });
const project = (id: string, order: number, featured = false, title = id) => ({
	id,
	data: { title, order, featured },
});

describe('selectPosts', () => {
	const posts = [post('old', '2025-01-01'), post('draft', '2026-12-01', true), post('new', '2026-06-01')];

	it('drops drafts and sorts newest first', () => {
		expect(selectPosts(posts, { includeDrafts: false }).map((p) => p.id)).toEqual(['new', 'old']);
	});

	it('keeps drafts when asked', () => {
		expect(selectPosts(posts, { includeDrafts: true }).map((p) => p.id)).toEqual(['draft', 'new', 'old']);
	});

	it('does not mutate its input', () => {
		const before = posts.map((p) => p.id);
		selectPosts(posts, { includeDrafts: false });
		expect(posts.map((p) => p.id)).toEqual(before);
	});
});

describe('sortProjects', () => {
	it('sorts by order, then by title', () => {
		const list = [project('c', 2), project('b', 1, false, 'Beta'), project('a', 1, false, 'Alpha'), project('d', 100)];
		expect(sortProjects(list).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
	});
});

describe('selectFeatured', () => {
	it('keeps featured projects only, sorted, capped at the limit', () => {
		const list = [project('x', 5, true), project('y', 1, true), project('z', 0, false), project('w', 3, true), project('v', 4, true)];
		expect(selectFeatured(list, 3).map((p) => p.id)).toEqual(['y', 'w', 'v']);
	});

	it('defaults to a limit of 3', () => {
		const list = [1, 2, 3, 4].map((n) => project(`p${n}`, n, true));
		expect(selectFeatured(list)).toHaveLength(3);
	});

	it('returns an empty array when nothing is featured', () => {
		expect(selectFeatured([project('a', 1)])).toEqual([]);
	});
});

describe('readingTime', () => {
	const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

	it('rounds up at 200 words per minute', () => {
		expect(readingTime(words(200))).toBe(1);
		expect(readingTime(words(201))).toBe(2);
		expect(readingTime(words(401))).toBe(3);
	});

	it('counts words across newlines and repeated spaces', () => {
		expect(readingTime(`${words(150)}\n\n   ${words(100)}`)).toBe(2);
	});

	it('is at least 1 minute, even for empty bodies', () => {
		expect(readingTime('')).toBe(1);
		expect(readingTime(undefined)).toBe(1);
	});
});

describe('date formatting', () => {
	it('formats dates in UTC', () => {
		expect(formatDate(new Date('2026-10-18'))).toBe('Oct 18, 2026');
		expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('Jan 1, 2026');
	});

	it('produces ISO calendar dates', () => {
		expect(isoDate(new Date('2026-10-18'))).toBe('2026-10-18');
	});

	it('formats year-month values', () => {
		expect(formatYearMonth('2023-07')).toBe('Jul 2023');
		expect(formatYearMonth('2019-12')).toBe('Dec 2019');
		expect(formatYearMonth('present')).toBe('Present');
	});
});

describe('paragraphs', () => {
	it('splits on blank lines, trims, and drops empty paragraphs', () => {
		expect(paragraphs('First line\nstill first\n\n  Second  \n\n\n')).toEqual(['First line\nstill first', 'Second']);
	});

	it('returns an empty array for blank text', () => {
		expect(paragraphs('  \n ')).toEqual([]);
	});
});
```

- [ ] **Step 2: 运行测试，确认失败**

运行：`npm test`
Expected：失败，报错 `Failed to resolve import "../../src/lib/content"`。

- [ ] **Step 3: 实现 `src/lib/content.ts`**

```ts
type DatedEntry = { data: { pubDate: Date; draft: boolean } };
type OrderedEntry = { data: { title: string; order: number; featured: boolean } };

const WORDS_PER_MINUTE = 200;

export function selectPosts<T extends DatedEntry>(posts: readonly T[], opts: { includeDrafts: boolean }): T[] {
	return posts
		.filter((post) => opts.includeDrafts || !post.data.draft)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function sortProjects<T extends OrderedEntry>(projects: readonly T[]): T[] {
	return [...projects].sort(
		(a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'en'),
	);
}

export function selectFeatured<T extends OrderedEntry>(projects: readonly T[], limit = 3): T[] {
	return sortProjects(projects.filter((project) => project.data.featured)).slice(0, limit);
}

export function readingTime(body: string | undefined): number {
	const words = (body ?? '').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	timeZone: 'UTC',
});

const yearMonthFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });

export function formatDate(date: Date): string {
	return dateFormat.format(date);
}

export function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function formatYearMonth(value: string): string {
	if (value === 'present') return 'Present';
	const [year, month] = value.split('-').map(Number);
	return yearMonthFormat.format(new Date(Date.UTC(year, month - 1, 1)));
}

export function paragraphs(text: string): string[] {
	return text
		.split(/\n\s*\n/)
		.map((part) => part.trim())
		.filter(Boolean);
}
```

注意：`filter` 会返回新数组，所以在它后面调用 `sort` 不会修改调用方传入的数组。

- [ ] **Step 4: 运行测试，确认通过**

运行：`npm test`
Expected：`tests/unit/content.test.ts` 全部通过（15 个测试）。

- [ ] **Step 5: 提交**

```bash
git add src/lib/content.ts tests/unit/content.test.ts && git commit -m "feat: add content sorting, filtering and formatting helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 内容 schema、collections 和示例内容

**Files:**
- Create: `src/schemas.ts`, `src/content.config.ts`, `src/lib/collections.ts`, `src/data/profile.yaml`
- Create: `src/content/blog/building-this-site/index.md`, `src/content/blog/building-this-site/architecture.png`, `src/content/blog/notes-on-testing.md`, `src/content/blog/draft-ideas.md`
- Create: `src/content/projects/task-manager/index.md`, `src/content/projects/task-manager/cover.png`, `src/content/projects/edge-cache.md`, `src/content/projects/cli-toolkit.md`
- Test: `tests/unit/schemas.test.ts`

**Interfaces:**
- Consumes: Task 2 提供的 `selectPosts`、`sortProjects`、`selectFeatured`。
- Produces：
  - `src/schemas.ts`：`postSchema`、`projectSchema(image)`、`profileSchema`
  - `src/lib/collections.ts`：`type Post = CollectionEntry<'blog'>`、`type Project = CollectionEntry<'projects'>`、`type Profile = CollectionEntry<'profile'>['data']`；`getPosts(): Promise<Post[]>`（开发模式下包含草稿）、`getProjects(): Promise<Project[]>`、`getFeaturedProjects(limit?: number): Promise<Project[]>`、`getProfile(): Promise<Profile>`
  - 示例内容的 slug：文章 `building-this-site`、`notes-on-testing`、`draft-ideas`（草稿）；项目 `task-manager`（order 1，featured，有封面）、`edge-cache`（order 2，featured，没有封面和 demo）、`cli-toolkit`（未设置 order，默认为 100；不是 featured）

- [ ] **Step 1: 写失败测试 `tests/unit/schemas.test.ts`**

```ts
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { postSchema, profileSchema, projectSchema } from '../../src/schemas';

// Stand-in for Astro's image() helper, which only exists inside content.config.ts.
const project = projectSchema(() => z.string());

const validProfile = {
	name: 'Jane Doe',
	role: 'Software Engineer',
	location: 'Shanghai',
	headline: 'Built for speed.',
	intro: 'I build things.',
	bio: 'Hello.',
	email: 'hello@example.com',
	links: { github: 'https://github.com/usn0m3' },
	skills: [{ group: 'Languages', items: ['TypeScript'] }],
	experience: [{ company: 'Acme', role: 'Engineer', start: '2023-07', end: 'present', summary: 'Work.' }],
	education: [{ school: 'Uni', degree: 'B.S.', start: '2019-09', end: '2023-06' }],
};

describe('postSchema', () => {
	it('accepts a minimal post and applies defaults', () => {
		const post = postSchema.parse({ title: 'T', description: 'D', pubDate: '2026-10-18' });
		expect(post.tags).toEqual([]);
		expect(post.draft).toBe(false);
		expect(post.pubDate).toBeInstanceOf(Date);
	});

	it('rejects a missing or empty title', () => {
		expect(postSchema.safeParse({ description: 'D', pubDate: '2026-10-18' }).success).toBe(false);
		expect(postSchema.safeParse({ title: '', description: 'D', pubDate: '2026-10-18' }).success).toBe(false);
	});

	it('rejects a date that cannot be parsed', () => {
		expect(postSchema.safeParse({ title: 'T', description: 'D', pubDate: 'yesterday' }).success).toBe(false);
	});
});

describe('projectSchema', () => {
	it('accepts a minimal project and applies defaults', () => {
		const p = project.parse({ title: 'P', summary: 'S', stack: ['Go'] });
		expect(p.featured).toBe(false);
		expect(p.order).toBe(100);
	});

	it('rejects an empty stack', () => {
		expect(project.safeParse({ title: 'P', summary: 'S', stack: [] }).success).toBe(false);
	});

	it('rejects links that are not full URLs', () => {
		expect(project.safeParse({ title: 'P', summary: 'S', stack: ['Go'], repo: 'github.com/x/y' }).success).toBe(false);
	});

	it('passes the cover through the image helper', () => {
		expect(project.parse({ title: 'P', summary: 'S', stack: ['Go'], cover: './cover.png' }).cover).toBe('./cover.png');
	});
});

describe('profileSchema', () => {
	it('accepts a valid profile and defaults highlights to []', () => {
		const profile = profileSchema.parse(validProfile);
		expect(profile.experience[0].highlights).toEqual([]);
	});

	it('rejects an invalid email', () => {
		expect(profileSchema.safeParse({ ...validProfile, email: 'not-an-email' }).success).toBe(false);
	});

	it('requires a GitHub link', () => {
		expect(profileSchema.safeParse({ ...validProfile, links: {} }).success).toBe(false);
	});

	it('rejects year-months that are not YYYY-MM, with a helpful message', () => {
		const result = profileSchema.safeParse({
			...validProfile,
			experience: [{ ...validProfile.experience[0], start: '2023-7' }],
		});
		expect(result.success).toBe(false);
		expect(JSON.stringify(result.error?.issues)).toContain('YYYY-MM');
	});

	it('allows "present" only as an end date', () => {
		const badStart = { ...validProfile.experience[0], start: 'present' };
		expect(profileSchema.safeParse({ ...validProfile, experience: [badStart] }).success).toBe(false);
	});
});
```

- [ ] **Step 2: 运行测试，确认失败**

运行：`npm test`
Expected：`schemas.test.ts` 失败，报错 `Failed to resolve import "../../src/schemas"`。

- [ ] **Step 3: 实现 `src/schemas.ts`**

```ts
import { z } from 'astro/zod';

const yearMonth = z
	.string()
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use "YYYY-MM" in quotes, for example "2023-07"');
const endYearMonth = z.union([yearMonth, z.literal('present')]);

export const postSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	tags: z.array(z.string()).default([]),
	draft: z.boolean().default(false),
});

export function projectSchema<I extends z.ZodType>(image: () => I) {
	return z.object({
		title: z.string().min(1),
		summary: z.string().min(1),
		stack: z.array(z.string()).min(1),
		repo: z.url().optional(),
		demo: z.url().optional(),
		cover: image().optional(),
		featured: z.boolean().default(false),
		order: z.number().default(100),
	});
}

export const profileSchema = z.object({
	name: z.string().min(1),
	role: z.string().min(1),
	location: z.string().min(1),
	headline: z.string().min(1),
	intro: z.string().min(1),
	bio: z.string().min(1),
	email: z.email(),
	links: z.object({
		github: z.url(),
		linkedin: z.url().optional(),
	}),
	skills: z.array(z.object({ group: z.string().min(1), items: z.array(z.string()).min(1) })),
	experience: z.array(
		z.object({
			company: z.string().min(1),
			role: z.string().min(1),
			start: yearMonth,
			end: endYearMonth,
			summary: z.string().min(1),
			highlights: z.array(z.string()).default([]),
		}),
	),
	education: z.array(
		z.object({
			school: z.string().min(1),
			degree: z.string().min(1),
			start: yearMonth,
			end: endYearMonth,
		}),
	),
});
```

- [ ] **Step 4: 运行测试，确认通过**

运行：`npm test`
Expected：`content.test.ts` 和 `schemas.test.ts` 全部通过。

- [ ] **Step 5: 写 `src/content.config.ts` 和 `src/lib/collections.ts`**

`src/content.config.ts`：

```ts
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { parse } from 'yaml';
import { postSchema, profileSchema, projectSchema } from './schemas';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
	schema: postSchema,
});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
	schema: ({ image }) => projectSchema(image),
});

// profile.yaml is a single object; wrap it as one entry with id "main".
const profile = defineCollection({
	loader: file('src/data/profile.yaml', { parser: (text) => [{ id: 'main', ...parse(text) }] }),
	schema: profileSchema,
});

export const collections = { blog, projects, profile };
```

`src/lib/collections.ts`：

```ts
import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { selectFeatured, selectPosts, sortProjects } from './content';

export type Post = CollectionEntry<'blog'>;
export type Project = CollectionEntry<'projects'>;
export type Profile = CollectionEntry<'profile'>['data'];

/** Published posts, newest first. Drafts are included only in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
	return selectPosts(await getCollection('blog'), { includeDrafts: import.meta.env.DEV });
}

export async function getProjects(): Promise<Project[]> {
	return sortProjects(await getCollection('projects'));
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
	return selectFeatured(await getCollection('projects'), limit);
}

export async function getProfile(): Promise<Profile> {
	const entry = await getEntry('profile', 'main');
	if (!entry) throw new Error('src/data/profile.yaml is missing or empty.');
	return entry.data;
}
```

- [ ] **Step 6: 写 `src/data/profile.yaml`**

```yaml
# 个人信息，全站共用（首页、About 页、页脚）。
# 年月一律写成带引号的 "YYYY-MM"；在职的 end 写 present。
name: Jane Doe
role: Software Engineer
location: Shanghai
headline: Built for speed. Engineered to last.
intro: I build fast, reliable web apps with TypeScript and Go. Currently open to full-time roles and freelance projects.
bio: |
  I'm a software engineer who cares about performance, reliability and clear code. Over the past few years I've shipped products used by thousands of people every day.

  Outside work I write about what I learn on this blog, contribute to open source, and tinker with developer tools.
email: hello@example.com
links:
  github: https://github.com/usn0m3
  linkedin: https://www.linkedin.com/in/your-profile
skills:
  - group: Languages
    items: [TypeScript, Go, Python, SQL]
  - group: Frontend
    items: [React, Astro, CSS]
  - group: Backend and infrastructure
    items: [Node.js, PostgreSQL, Redis, Docker]
experience:
  - company: Acme Corp
    role: Software Engineer
    start: "2023-07"
    end: present
    summary: Building the real-time collaboration platform used by 40,000 teams.
    highlights:
      - Cut p95 API latency by 60% with a distributed cache layer.
      - Led the migration from REST polling to WebSockets.
  - company: Startup Inc
    role: Software Engineering Intern
    start: "2022-06"
    end: "2022-09"
    summary: Shipped internal tooling for the data team.
education:
  - school: Example University
    degree: B.S. in Computer Science
    start: "2019-09"
    end: "2023-06"
```

- [ ] **Step 7: 生成示例图片（封面图和文章配图）**

```bash
mkdir -p src/content/projects/task-manager src/content/blog/building-this-site
node --input-type=module <<'EOF'
import sharp from 'sharp';

const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
<rect width="1600" height="900" fill="#181818"/>
<rect x="120" y="120" width="420" height="660" fill="#242424"/>
<rect x="590" y="120" width="420" height="660" fill="#242424"/>
<rect x="1060" y="120" width="420" height="660" fill="#242424"/>
<rect x="150" y="160" width="160" height="14" fill="#da291c"/>
<rect x="620" y="160" width="160" height="14" fill="#969696"/>
<rect x="1090" y="160" width="160" height="14" fill="#969696"/>
<rect x="150" y="210" width="360" height="120" fill="#303030"/>
<rect x="150" y="350" width="360" height="120" fill="#303030"/>
<rect x="620" y="210" width="360" height="120" fill="#303030"/>
<rect x="1090" y="210" width="360" height="120" fill="#303030"/>
<rect x="1090" y="350" width="360" height="120" fill="#303030"/>
<rect x="1090" y="490" width="360" height="120" fill="#303030"/>
</svg>`;

const diagram = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">
<rect width="1200" height="600" fill="#181818"/>
<rect x="80" y="240" width="260" height="120" fill="#303030"/>
<rect x="470" y="240" width="260" height="120" fill="#303030"/>
<rect x="860" y="240" width="260" height="120" fill="#303030"/>
<rect x="470" y="240" width="260" height="6" fill="#da291c"/>
<rect x="340" y="298" width="130" height="4" fill="#969696"/>
<rect x="730" y="298" width="130" height="4" fill="#969696"/>
</svg>`;

await sharp(Buffer.from(cover)).png().toFile('src/content/projects/task-manager/cover.png');
await sharp(Buffer.from(diagram)).png().toFile('src/content/blog/building-this-site/architecture.png');
console.log('images written');
EOF
```

Expected：输出 `images written`，两个 PNG 文件都已生成。

- [ ] **Step 8: 写示例文章**

`src/content/blog/building-this-site/index.md`（故意包含超长 URL 和长代码行，用来测试窄屏溢出，见 Review Focus 第 4 条）：

````markdown
---
title: Building this site
description: How I built a fast, zero-JavaScript portfolio with Astro, Markdown and a Ferrari-inspired design system.
pubDate: 2026-10-18
tags: [astro, design]
---

This site is plain HTML and CSS generated by [Astro](https://astro.build). Every page ships **zero JavaScript**.

## Architecture

Content lives in Markdown files. A build step validates them, renders pages, and GitHub Actions publishes the result.

![Diagram of the build pipeline: Markdown, Astro build, GitHub Pages](./architecture.png)

### Content validation

Each collection has a schema, so a missing title fails the build instead of shipping a broken page:

```ts
export const postSchema = z.object({ title: z.string().min(1), description: z.string().min(1), pubDate: z.coerce.date() });
```

## Design

> Sharp corners, one red, and a lot of black.

The design tokens come from a `DESIGN.md` file. Long links still wrap on small screens: https://example.com/a/really/long/path/that/keeps/going/and/going/without/any/natural/break/points/to/test/wrapping

- Near-black canvas
- Rosso Corsa for primary actions only
- Inter for all text
````

`src/content/blog/notes-on-testing.md`：

```markdown
---
title: Notes on testing static sites
description: Testing the build output instead of the framework, with Vitest and a few string checks.
pubDate: 2026-09-02
tags: [testing]
---

Static sites are easy to test: build once, then assert on the files in `dist/`.

## What I check

- Every internal link points to a file that exists.
- Drafts never reach production.
- Pages ship no `<script>` tags.
```

`src/content/blog/draft-ideas.md`：

```markdown
---
title: Unpublished draft ideas
description: This draft must never appear in a production build.
pubDate: 2026-10-20
draft: true
---

Work in progress.
```

- [ ] **Step 9: 写示例项目**

`src/content/projects/task-manager/index.md`：

```markdown
---
title: Task Manager
summary: Real-time collaborative to-do app for small teams.
stack: [TypeScript, React, PostgreSQL, WebSockets]
repo: https://github.com/usn0m3/task-manager
demo: https://task-manager.example.com
cover: ./cover.png
featured: true
order: 1
---

## Problem

Small teams juggled tasks across chat threads and spreadsheets, and nobody knew what was current.

## Approach

A React client syncs over WebSockets with a Node.js server. PostgreSQL stores tasks, and every change is broadcast to connected clients within 100 ms.

## Results

- Used daily by 12 teams during the pilot.
- Median sync latency of 45 ms.
```

`src/content/projects/edge-cache.md`：

```markdown
---
title: Edge Cache
summary: Distributed cache layer that cut API latency by 60%.
stack: [Go, Redis, Docker]
repo: https://github.com/usn0m3/edge-cache
featured: true
order: 2
---

## Problem

Read-heavy endpoints hit the primary database on every request.

## Approach

A Go service in front of the API caches responses in Redis with tag-based invalidation.

## Results

p95 latency dropped from 420 ms to 170 ms.
```

`src/content/projects/cli-toolkit.md`：

```markdown
---
title: Dev CLI Toolkit
summary: A grab bag of command-line tools that automate everyday chores.
stack: [Rust]
repo: https://github.com/usn0m3/cli-toolkit
---

Small, fast utilities for renaming files, cleaning branches, and bumping versions.
```

- [ ] **Step 10: 构建，确认内容通过校验**

运行：`npm run build`
Expected：`0 errors`，构建成功（首页仍是临时页面）。

- [ ] **Step 11: 故意写错内容，确认构建失败**

把 `src/content/blog/notes-on-testing.md` 中的 `title:` 那一行删掉，然后运行：

```bash
npm run build 2>&1 | grep -E "InvalidContentEntryDataError|title"
```

Expected：输出中包含 `InvalidContentEntryDataError`、`blog → notes-on-testing` 和 `title`。

然后用 `git diff` 确认改动范围，把 `title: Notes on testing static sites` 这一行恢复，再运行一次 `npm run build`，确认构建成功。

- [ ] **Step 12: 提交**

```bash
git add -A && git commit -m "feat: add content schemas, collections and sample content" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Design tokens、全局样式和页面骨架

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`
- Modify: `src/pages/index.astro`（替换成使用 BaseLayout 的临时版本）
- Test: `tests/build/layout.test.ts`

**Interfaces:**
- Consumes: Task 3 提供的 `getProfile()` 和 `Profile`。
- Produces：
  - `BaseLayout` props：`{ title?: string; description?: string; type?: 'website' | 'article' }`。不传 `title` 时，页面标题为 `"{name} — {role}"`；传了则为 `"{title} — {name}"`。不传 `description` 时使用 `profile.intro`。
  - 全局 CSS 类：`.container`、`.section`、`.section-head`、`.section-heading`、`.section-link`、`.page-header`、`.page-title`、`.page-intro`、`.grid-cards`、`.actions`、`.empty`、`.skip-link`
  - CSS 变量：见 `tokens.css`（`--color-*`、`--space-1`…`--space-9`、`--container`、`--gutter`、`--section-gap`、`--measure`、`--font-sans`）

- [ ] **Step 1: 写失败测试 `tests/build/layout.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { page } from './helpers';

describe('base layout', () => {
	const html = page('/');

	it('declares language and title', () => {
		expect(html).toContain('<html lang="en"');
		expect(html).toContain('<title>Jane Doe — Software Engineer</title>');
	});

	it('has SEO and social meta', () => {
		expect(html).toMatch(/<meta name="description" content="I build fast, reliable web apps/);
		expect(html).toMatch(/<link rel="canonical" href="https:\/\/usn0m3\.github\.io\/"/);
		expect(html).toMatch(/<meta property="og:title" content="Jane Doe — Software Engineer"/);
		expect(html).toMatch(/<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/rss\.xml"/);
	});

	it('preloads the Inter font', () => {
		expect(html).toMatch(/<link rel="preload"[^>]*as="font"/);
	});

	it('renders navigation with all sections', () => {
		for (const href of ['/projects/', '/blog/', '/about/']) {
			expect(html).toContain(`href="${href}"`);
		}
		expect(html).toContain('<nav aria-label="Main"');
	});

	it('renders the footer links and a skip link', () => {
		expect(html).toContain('href="https://github.com/usn0m3"');
		expect(html).toContain('href="mailto:hello@example.com"');
		expect(html).toContain('href="#main"');
	});
});
```

- [ ] **Step 2: 运行测试，确认失败**

运行：`npm run build && npx vitest run tests/build/layout.test.ts`
Expected：失败，因为临时页面的 `<title>` 是 `Coming soon`，也没有导航。

- [ ] **Step 3: 写 `src/styles/tokens.css`**

```css
:root {
	--color-canvas: #181818;
	--color-surface: #303030;
	--color-hairline: #303030;
	--color-ink: #ffffff;
	--color-body: #969696;
	--color-prose: #e0e0e0;
	--color-muted: #8f8f8f;
	--color-primary: #da291c;
	--color-primary-hover: #9d2211;
	--color-primary-active: #b01e0a;

	--font-sans: var(--font-inter), system-ui, sans-serif;
	--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

	--space-1: 4px;
	--space-2: 8px;
	--space-3: 16px;
	--space-4: 24px;
	--space-5: 32px;
	--space-6: 48px;
	--space-7: 64px;
	--space-8: 96px;
	--space-9: 128px;

	--container: 1280px;
	--gutter: clamp(16px, 4vw, 48px);
	--section-gap: var(--space-8);
	--measure: 70ch;
}

@media (max-width: 720px) {
	:root {
		--section-gap: var(--space-7);
	}
}
```

- [ ] **Step 4: 写 `src/styles/global.css`**

```css
*,
*::before,
*::after {
	box-sizing: border-box;
}

html {
	-webkit-text-size-adjust: 100%;
}

body {
	margin: 0;
	background: var(--color-canvas);
	color: var(--color-body);
	font-family: var(--font-sans);
	font-size: 16px;
	line-height: 1.5;
	-webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
h4 {
	margin: 0;
	color: var(--color-ink);
	font-weight: 500;
	line-height: 1.2;
	letter-spacing: -0.01em;
}

p {
	margin: 0;
}

a {
	color: inherit;
	text-decoration: none;
	transition: color 0.15s, background-color 0.15s, border-color 0.15s;
}

img {
	display: block;
	max-width: 100%;
	height: auto;
}

:focus-visible {
	outline: 2px solid var(--color-ink);
	outline-offset: 2px;
}

::selection {
	background: var(--color-primary);
	color: var(--color-ink);
}

main {
	padding-bottom: var(--space-8);
}

.container {
	width: 100%;
	max-width: var(--container);
	margin-inline: auto;
	padding-inline: var(--gutter);
}

.section {
	padding-top: var(--section-gap);
}

.section-head {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: var(--space-3);
	margin-bottom: var(--space-5);
	padding-top: var(--space-4);
	border-top: 1px solid var(--color-hairline);
}

.section-heading {
	color: var(--color-ink);
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 1.1px;
	line-height: 1.4;
	text-transform: uppercase;
}

.section-link {
	font-size: 13px;
	color: var(--color-body);
}

.section-link:hover {
	color: var(--color-ink);
}

.page-header {
	padding-block: var(--space-8) var(--space-6);
}

.page-title {
	font-size: clamp(40px, 7vw, 56px);
	line-height: 1.1;
	letter-spacing: -0.02em;
}

.page-intro {
	max-width: 60ch;
	margin-top: var(--space-3);
}

.grid-cards {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
	gap: var(--space-6) var(--space-4);
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-3);
}

.empty {
	color: var(--color-muted);
}

.skip-link {
	position: absolute;
	left: -9999px;
}

.skip-link:focus {
	left: var(--space-3);
	top: var(--space-3);
	z-index: 10;
	padding: var(--space-2) var(--space-3);
	background: var(--color-ink);
	color: var(--color-canvas);
}

@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		transition: none !important;
	}
}
```

- [ ] **Step 5: 写 `src/components/Header.astro`**

```astro
---
interface Props {
	name: string;
}

const { name } = Astro.props;
const path = Astro.url.pathname;
const links = [
	{ href: '/projects/', label: 'Projects' },
	{ href: '/blog/', label: 'Blog' },
	{ href: '/about/', label: 'About' },
];
---

<header class="site-header">
	<div class="container bar">
		<a class="brand" href="/"><span class="mark" aria-hidden="true"></span>{name}</a>
		<nav aria-label="Main">
			<ul>
				{
					links.map((link) => (
						<li>
							<a href={link.href} aria-current={path.startsWith(link.href) ? 'page' : undefined}>
								{link.label}
							</a>
						</li>
					))
				}
			</ul>
		</nav>
	</div>
</header>

<style>
	.site-header {
		border-bottom: 1px solid var(--color-hairline);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		height: 64px;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-ink);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.65px;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.mark {
		width: 8px;
		height: 8px;
		background: var(--color-primary);
	}
	ul {
		display: flex;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	nav a {
		padding-block: var(--space-2);
		border-bottom: 2px solid transparent;
		color: var(--color-ink);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.65px;
		text-transform: uppercase;
	}
	nav a:hover {
		color: var(--color-body);
	}
	nav a[aria-current='page'] {
		border-bottom-color: var(--color-primary);
	}
	@media (max-width: 420px) {
		ul {
			gap: var(--space-3);
		}
		.brand,
		nav a {
			font-size: 12px;
			letter-spacing: 0.4px;
		}
	}
</style>
```

- [ ] **Step 6: 写 `src/components/Footer.astro`**

```astro
---
import type { Profile } from '../lib/collections';

interface Props {
	profile: Profile;
}

const { profile } = Astro.props;
const year = new Date().getFullYear();
const links = [
	{ href: profile.links.github, label: 'GitHub' },
	...(profile.links.linkedin ? [{ href: profile.links.linkedin, label: 'LinkedIn' }] : []),
	{ href: `mailto:${profile.email}`, label: 'Email' },
	{ href: '/rss.xml', label: 'RSS' },
];
---

<footer class="site-footer">
	<div class="container bar">
		<ul>
			{
				links.map((link) => (
					<li>
						<a href={link.href}>{link.label}</a>
					</li>
				))
			}
		</ul>
		<p class="copy">© {year} {profile.name}</p>
	</div>
</footer>

<style>
	.site-footer {
		padding-block: var(--space-6);
		border-top: 1px solid var(--color-hairline);
	}
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	a {
		color: var(--color-body);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 1.1px;
		text-transform: uppercase;
	}
	a:hover {
		color: var(--color-ink);
	}
	.copy {
		color: var(--color-muted);
		font-size: 12px;
	}
</style>
```

- [ ] **Step 7: 写 `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/tokens.css';
import '../styles/global.css';
import { Font } from 'astro:assets';
import Footer from '../components/Footer.astro';
import Header from '../components/Header.astro';
import { getProfile } from '../lib/collections';

interface Props {
	title?: string;
	description?: string;
	type?: 'website' | 'article';
}

const profile = await getProfile();
const { title, description = profile.intro, type = 'website' } = Astro.props;
const fullTitle = title ? `${title} — ${profile.name}` : `${profile.name} — ${profile.role}`;
const canonical = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>{fullTitle}</title>
		<meta name="description" content={description} />
		<link rel="canonical" href={canonical} />
		<meta property="og:title" content={fullTitle} />
		<meta property="og:description" content={description} />
		<meta property="og:type" content={type} />
		<meta property="og:url" content={canonical} />
		<meta name="twitter:card" content="summary" />
		<meta name="theme-color" content="#181818" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<link rel="alternate" type="application/rss+xml" title={`${profile.name} — Blog`} href="/rss.xml" />
		<link rel="sitemap" href="/sitemap-index.xml" />
		<Font cssVariable="--font-inter" preload />
	</head>
	<body>
		<a class="skip-link" href="#main">Skip to content</a>
		<Header name={profile.name} />
		<main id="main">
			<slot />
		</main>
		<Footer profile={profile} />
	</body>
</html>
```

- [ ] **Step 8: 把 `src/pages/index.astro` 换成使用 BaseLayout 的临时版本**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
	<p class="container">Home</p>
</BaseLayout>
```

- [ ] **Step 9: 运行测试，确认通过**

运行：`npm run build && npx vitest run tests/build/layout.test.ts`
Expected：通过（5 个测试）。

- [ ] **Step 10: 提交**

```bash
git add -A && git commit -m "feat: add design tokens, global styles and base layout" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 首页（Hero、按钮、标签、项目卡片、文章列表项）和简历占位

**Files:**
- Create: `src/components/Button.astro`, `src/components/Label.astro`, `src/components/Hero.astro`, `src/components/ProjectCard.astro`, `src/components/PostListItem.astro`, `public/resume.pdf`
- Modify: `src/pages/index.astro`
- Test: `tests/build/home.test.ts`

**Interfaces:**
- Consumes: `getProfile`、`getFeaturedProjects`、`getPosts`、`Post`、`Project`、`Profile`（Task 3）；`formatDate`、`isoDate`（Task 2）；全局 CSS 类（Task 4）。
- Produces：
  - `Button` props：`{ href: string; variant?: 'primary' | 'outline'; download?: boolean }`，渲染为 `<a class="btn btn-primary|btn-outline">`
  - `Label` props：`{ class?: string }`，渲染为 `<span class="label">`（大写小标签）
  - `Hero` props：`{ profile: Profile }`
  - `ProjectCard` props：`{ project: Project; headingLevel?: 'h2' | 'h3' }`（默认 `h3`）。有封面时渲染 `<img>`，没有封面时渲染 `<div class="placeholder">`
  - `PostListItem` props：`{ post: Post; headingLevel?: 'h2' | 'h3' }`（默认 `h3`），渲染为 `<article class="post-item">`

- [ ] **Step 1: 写失败测试 `tests/build/home.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { between, exists, page } from './helpers';

describe('home page', () => {
	const html = page('/');

	it('renders the hero from profile.yaml', () => {
		expect(html).toContain('Built for speed. Engineered to last.');
		expect(html).toContain('Software Engineer · Shanghai');
		expect(html).toMatch(/<a href="\/projects\/" class="btn btn-primary"[^>]*>\s*View projects/);
		expect(html).toMatch(/<a href="\/resume\.pdf" class="btn btn-outline"[^>]*download[^>]*>\s*Download résumé/);
		expect(html).toMatch(/href="mailto:hello@example\.com"[^>]*>\s*Get in touch →/);
	});

	it('shows featured projects only, in order', () => {
		const featured = between(html, 'id="featured-heading"', '</section>');
		expect(featured).toContain('Task Manager');
		expect(featured).toContain('Edge Cache');
		expect(featured).not.toContain('Dev CLI Toolkit');
		expect(featured.indexOf('Task Manager')).toBeLessThan(featured.indexOf('Edge Cache'));
	});

	it('renders a cover image when present and a placeholder when not', () => {
		const withCover = between(html, 'href="/projects/task-manager/"', '</article>');
		expect(withCover).toMatch(/<img[^>]*src="\/_astro\//);
		const withoutCover = between(html, 'href="/projects/edge-cache/"', '</article>');
		expect(withoutCover).toContain('class="placeholder"');
		expect(withoutCover).not.toContain('<img');
	});

	it('lists the latest published posts, newest first, without drafts', () => {
		const latest = between(html, 'id="latest-heading"', '</section>');
		expect(latest.indexOf('Building this site')).toBeGreaterThan(-1);
		expect(latest.indexOf('Building this site')).toBeLessThan(latest.indexOf('Notes on testing static sites'));
		expect(latest).toContain('datetime="2026-10-18"');
		expect(html).not.toContain('Unpublished draft ideas');
	});

	it('ships a résumé file', () => {
		expect(exists('resume.pdf')).toBe(true);
	});
});
```

- [ ] **Step 2: 运行测试，确认失败**

运行：`npm run build && npx vitest run tests/build/home.test.ts`
Expected：失败，页面中找不到 `Built for speed. Engineered to last.`。

- [ ] **Step 3: 写 `src/components/Button.astro` 和 `src/components/Label.astro`**

`Button.astro`：

```astro
---
interface Props {
	href: string;
	variant?: 'primary' | 'outline';
	download?: boolean;
}

const { href, variant = 'primary', download = false } = Astro.props;
---

<a href={href} class:list={['btn', `btn-${variant}`]} download={download || undefined}><slot /></a>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		padding: 14px 32px;
		border-radius: 0;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 1.4px;
		line-height: 1;
		text-transform: uppercase;
	}
	.btn-primary {
		background: var(--color-primary);
		color: var(--color-ink);
	}
	.btn-primary:hover {
		background: var(--color-primary-hover);
	}
	.btn-primary:active {
		background: var(--color-primary-active);
	}
	.btn-outline {
		padding: 13px 31px;
		border: 1px solid var(--color-ink);
		color: var(--color-ink);
	}
	.btn-outline:hover {
		background: var(--color-ink);
		color: var(--color-canvas);
	}
</style>
```

`Label.astro`：

```astro
---
interface Props {
	class?: string;
}

const { class: className } = Astro.props;
---

<span class:list={['label', className]}><slot /></span>

<style>
	.label {
		display: inline-block;
		color: var(--color-muted);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 1.1px;
		line-height: 1.4;
		text-transform: uppercase;
	}
</style>
```

- [ ] **Step 4: 写 `src/components/Hero.astro`**

```astro
---
import type { Profile } from '../lib/collections';
import Button from './Button.astro';
import Label from './Label.astro';

interface Props {
	profile: Profile;
}

const { profile } = Astro.props;
---

<section class="hero container">
	<Label>{profile.role} · {profile.location}</Label>
	<h1 class="headline">{profile.headline}</h1>
	<p class="intro">{profile.intro}</p>
	<div class="actions hero-actions">
		<Button href="/projects/">View projects</Button>
		<Button href="/resume.pdf" variant="outline" download>Download résumé</Button>
	</div>
	<a class="contact" href={`mailto:${profile.email}`}>Get in touch →</a>
</section>

<style>
	.hero {
		padding-block: var(--space-9) var(--space-8);
	}
	.headline {
		max-width: 16ch;
		margin-top: var(--space-3);
		font-size: clamp(44px, 8vw, 80px);
		line-height: 1.05;
		letter-spacing: -0.02em;
	}
	.intro {
		max-width: 52ch;
		margin-top: var(--space-4);
		font-size: 18px;
	}
	.hero-actions {
		margin-top: var(--space-6);
	}
	.contact {
		display: inline-block;
		margin-top: var(--space-4);
		padding-bottom: 2px;
		border-bottom: 1px solid var(--color-primary);
		color: var(--color-ink);
		font-size: 14px;
	}
	.contact:hover {
		color: var(--color-body);
	}
	@media (max-width: 720px) {
		.hero {
			padding-block: var(--space-7);
		}
	}
</style>
```

- [ ] **Step 5: 写 `src/components/ProjectCard.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { Project } from '../lib/collections';
import Label from './Label.astro';

interface Props {
	project: Project;
	headingLevel?: 'h2' | 'h3';
}

const { project, headingLevel = 'h3' } = Astro.props;
const Heading = headingLevel;
const { title, summary, stack, cover } = project.data;
const href = `/projects/${project.id}/`;
---

<article class="card">
	<a href={href} class="media" tabindex="-1" aria-hidden="true">
		{
			cover ? (
				<Image src={cover} alt="" widths={[480, 960]} sizes="(max-width: 720px) 100vw, 640px" />
			) : (
				<div class="placeholder">
					<span>{title}</span>
				</div>
			)
		}
	</a>
	<Heading class="title"><a href={href}>{title}</a></Heading>
	<p class="summary">{summary}</p>
	<Label>{stack.join(' · ')}</Label>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
	}
	.media {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		margin-bottom: var(--space-2);
		overflow: hidden;
		background: var(--color-surface);
	}
	.media :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.placeholder {
		display: flex;
		align-items: flex-end;
		width: 100%;
		height: 100%;
		padding: var(--space-3);
	}
	.placeholder span {
		color: var(--color-muted);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 1.1px;
		text-transform: uppercase;
	}
	.title {
		font-size: 20px;
	}
	.title a:hover {
		color: var(--color-body);
	}
	.summary {
		font-size: 14px;
	}
</style>
```

- [ ] **Step 6: 写 `src/components/PostListItem.astro`**

```astro
---
import type { Post } from '../lib/collections';
import { formatDate, isoDate } from '../lib/content';
import Label from './Label.astro';

interface Props {
	post: Post;
	headingLevel?: 'h2' | 'h3';
}

const { post, headingLevel = 'h3' } = Astro.props;
const Heading = headingLevel;
const { title, description, pubDate, tags, draft } = post.data;
---

<article class="post-item">
	<time datetime={isoDate(pubDate)}>{formatDate(pubDate)}</time>
	<div class="body">
		<Heading class="title"><a href={`/blog/${post.id}/`}>{title}</a></Heading>
		<p class="description">{description}</p>
		{(tags.length > 0 || draft) && <Label>{[draft ? 'Draft' : '', ...tags].filter(Boolean).join(' · ')}</Label>}
	</div>
</article>

<style>
	.post-item {
		display: grid;
		grid-template-columns: 160px minmax(0, 1fr);
		gap: var(--space-3);
		padding-block: var(--space-4);
		border-top: 1px solid var(--color-hairline);
	}
	time {
		color: var(--color-muted);
		font-size: 13px;
	}
	.body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
	}
	.title {
		font-size: 20px;
	}
	.title a:hover {
		color: var(--color-body);
	}
	.description {
		font-size: 14px;
	}
	@media (max-width: 720px) {
		.post-item {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-2);
		}
	}
</style>
```

- [ ] **Step 7: 写最终版 `src/pages/index.astro`**

```astro
---
import Hero from '../components/Hero.astro';
import PostListItem from '../components/PostListItem.astro';
import ProjectCard from '../components/ProjectCard.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { getFeaturedProjects, getPosts, getProfile } from '../lib/collections';

const [profile, featured, posts] = await Promise.all([getProfile(), getFeaturedProjects(3), getPosts()]);
const latest = posts.slice(0, 3);
---

<BaseLayout>
	<Hero profile={profile} />
	{
		featured.length > 0 && (
			<section class="container section" aria-labelledby="featured-heading">
				<div class="section-head">
					<h2 id="featured-heading" class="section-heading">Featured projects</h2>
					<a class="section-link" href="/projects/">All projects →</a>
				</div>
				<div class="grid-cards">
					{featured.map((project) => <ProjectCard project={project} />)}
				</div>
			</section>
		)
	}
	{
		latest.length > 0 && (
			<section class="container section" aria-labelledby="latest-heading">
				<div class="section-head">
					<h2 id="latest-heading" class="section-heading">Latest writing</h2>
					<a class="section-link" href="/blog/">All posts →</a>
				</div>
				{latest.map((post) => <PostListItem post={post} />)}
			</section>
		)
	}
</BaseLayout>
```

- [ ] **Step 8: 生成占位简历 `public/resume.pdf`**

```bash
node --input-type=module <<'EOF'
import { writeFileSync } from 'node:fs';

const text = 'BT /F1 20 Tf 72 700 Td (Resume placeholder - replace public/resume.pdf) Tj ET';
const objects = [
	'<< /Type /Catalog /Pages 2 0 R >>',
	'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
	'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
	`<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
	'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];
let out = '%PDF-1.4\n';
const offsets = objects.map((body, i) => {
	const offset = out.length;
	out += `${i + 1} 0 obj\n${body}\nendobj\n`;
	return offset;
});
const xref = out.length;
out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync('public/resume.pdf', out);
console.log('resume.pdf written');
EOF
```

Expected：输出 `resume.pdf written`。

- [ ] **Step 9: 运行测试，确认通过**

运行：`npm run build && npx vitest run tests/build/home.test.ts tests/build/layout.test.ts`
Expected：全部通过。

- [ ] **Step 10: 手动检查空状态**

临时把两个项目的 `featured: true` 都改成 `false`，然后运行 `npm run build`，再执行：

```bash
grep -c 'featured-heading' dist/index.html
```

Expected：输出 `0`，说明没有精选项目时，“Featured projects”区块被隐藏。

然后恢复 `featured: true`，并用 `git diff --stat` 确认 `src/content/` 下没有遗留改动。

- [ ] **Step 11: 提交**

```bash
git add -A && git commit -m "feat: build home page with hero, featured projects and latest posts" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 项目列表页、项目详情页和正文排版

**Files:**
- Create: `src/styles/prose.css`, `src/layouts/ProseLayout.astro`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`
- Test: `tests/build/projects.test.ts`

**Interfaces:**
- Consumes: `getProjects`、`Project`（Task 3）；`Button`、`Label`、`ProjectCard`（Task 5）；`BaseLayout`（Task 4）。
- Produces：
  - `ProseLayout` props：`{ title: string; description: string; type?: 'website' | 'article' }`（默认 `'article'`）；具名 slot `header`，默认 slot 放正文
  - `prose.css` 中的全局类：`.article`、`.article-header`、`.article-title`、`.article-lede`、`.article-meta`、`.article-actions`、`.article-cover`、`.prose`

- [ ] **Step 1: 写失败测试 `tests/build/projects.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { cssText, page } from './helpers';

describe('projects index', () => {
	const html = page('/projects/');

	it('lists every project in order', () => {
		const a = html.indexOf('Task Manager');
		const b = html.indexOf('Edge Cache');
		const c = html.indexOf('Dev CLI Toolkit');
		expect(a).toBeGreaterThan(-1);
		expect(a).toBeLessThan(b);
		expect(b).toBeLessThan(c);
		expect(html).toContain('<title>Projects — Jane Doe</title>');
	});

	it('uses h2 headings for cards under the page h1', () => {
		expect(html).toMatch(/<h2 class="title"[^>]*><a href="\/projects\/task-manager\/"/);
	});
});

describe('project detail', () => {
	it('renders header, links, cover and body', () => {
		const html = page('/projects/task-manager/');
		expect(html).toMatch(/<h1 class="article-title"[^>]*>Task Manager<\/h1>/);
		expect(html).toContain('href="https://github.com/usn0m3/task-manager"');
		expect(html).toMatch(/href="https:\/\/task-manager\.example\.com"[^>]*>\s*Live demo/);
		expect(html).toMatch(/<img[^>]*class="article-cover"|class="article-cover"[^>]*>/);
		expect(html).toContain('<h2 id="problem">Problem</h2>');
		expect(html).toContain('<meta property="og:type" content="article"');
	});

	it('omits the demo button and cover image when the project has none', () => {
		// Match elements, not class names: prose.css may be inlined into the page's <style>.
		const html = page('/projects/edge-cache/');
		expect(html).not.toMatch(/>\s*Live demo\s*</);
		expect(html).not.toMatch(/<img[^>]*article-cover/);
		expect(html).toMatch(/>\s*Source code\s*</);
	});
});

describe('prose styles', () => {
	it('keep long words and code from overflowing narrow screens', () => {
		const css = cssText(page('/projects/task-manager/'));
		expect(css).toMatch(/overflow-wrap:\s*anywhere/);
		expect(css).toMatch(/\.astro-code[^}]*overflow-x:\s*auto/);
	});
});
```

> 没有任何链接时不渲染操作行，这由模板中的 `(repo || demo) &&` 条件保证；Task 9 的空属性测试会兜底。

- [ ] **Step 2: 运行测试，确认失败**

运行：`npm run build && npx vitest run tests/build/projects.test.ts`
Expected：失败，报错 `ENOENT ... dist/projects/index.html`。

- [ ] **Step 3: 写 `src/styles/prose.css`**

```css
.article {
	padding-top: var(--space-8);
}

.article-header {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--space-3);
	margin-bottom: var(--space-6);
}

.article-title {
	max-width: var(--measure);
	font-size: clamp(36px, 6vw, 56px);
	line-height: 1.1;
	letter-spacing: -0.02em;
}

.article-lede {
	max-width: var(--measure);
	font-size: 18px;
}

.article-meta {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-3);
}

.article-actions {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-3);
	margin-top: var(--space-2);
}

.article-cover {
	width: 100%;
	aspect-ratio: 16 / 9;
	margin-top: var(--space-4);
	object-fit: cover;
}

.prose {
	max-width: var(--measure);
	color: var(--color-prose);
	font-size: 17px;
	line-height: 1.7;
	overflow-wrap: anywhere;
}

.prose > * + * {
	margin-top: 1.25em;
}

.prose h2 {
	margin-top: 2em;
	font-size: 28px;
}

.prose h3 {
	margin-top: 1.6em;
	font-size: 21px;
}

.prose a {
	color: var(--color-ink);
	text-decoration: underline;
	text-decoration-color: var(--color-primary);
	text-underline-offset: 3px;
}

.prose a:hover {
	color: var(--color-primary);
}

.prose strong {
	color: var(--color-ink);
	font-weight: 600;
}

.prose ul,
.prose ol {
	padding-left: 1.25em;
}

.prose li + li {
	margin-top: 0.4em;
}

.prose blockquote {
	margin: 0;
	padding-left: var(--space-4);
	border-left: 2px solid var(--color-primary);
	color: var(--color-body);
}

.prose :not(pre) > code {
	padding: 0.1em 0.35em;
	background: var(--color-surface);
	font-family: var(--font-mono);
	font-size: 0.9em;
}

.prose pre.astro-code {
	padding: var(--space-4);
	background-color: var(--color-surface) !important;
	font-size: 14px;
	line-height: 1.6;
	overflow-x: auto;
	overflow-wrap: normal;
}

.prose pre code {
	font-family: var(--font-mono);
}

.prose img {
	width: 100%;
	height: auto;
}

.prose hr {
	border: 0;
	border-top: 1px solid var(--color-hairline);
}

.prose table {
	display: block;
	overflow-x: auto;
	border-collapse: collapse;
}

.prose th,
.prose td {
	padding: var(--space-2) var(--space-3);
	border-bottom: 1px solid var(--color-hairline);
	text-align: left;
}
```

> `!important` 是必需的，因为 Shiki 会把背景色写在 `<pre>` 的内联 style 里。

- [ ] **Step 4: 写 `src/layouts/ProseLayout.astro`**

```astro
---
import '../styles/prose.css';
import BaseLayout from './BaseLayout.astro';

interface Props {
	title: string;
	description: string;
	type?: 'website' | 'article';
}

const { title, description, type = 'article' } = Astro.props;
---

<BaseLayout title={title} description={description} type={type}>
	<article class="container article">
		<header class="article-header">
			<slot name="header" />
		</header>
		<div class="prose">
			<slot />
		</div>
	</article>
</BaseLayout>
```

- [ ] **Step 5: 写 `src/pages/projects/index.astro`**

```astro
---
import ProjectCard from '../../components/ProjectCard.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getProjects } from '../../lib/collections';

const projects = await getProjects();
---

<BaseLayout title="Projects" description="Selected software projects, with the problem, approach and results for each.">
	<div class="container">
		<header class="page-header">
			<h1 class="page-title">Projects</h1>
			<p class="page-intro">Things I've designed, built and shipped.</p>
		</header>
		{
			projects.length > 0 ? (
				<div class="grid-cards">
					{projects.map((project) => <ProjectCard project={project} headingLevel="h2" />)}
				</div>
			) : (
				<p class="empty">Projects are on the way.</p>
			)
		}
	</div>
</BaseLayout>
```

- [ ] **Step 6: 写 `src/pages/projects/[...slug].astro`**

```astro
---
import type { GetStaticPaths } from 'astro';
import { Image } from 'astro:assets';
import { render } from 'astro:content';
import Button from '../../components/Button.astro';
import Label from '../../components/Label.astro';
import ProseLayout from '../../layouts/ProseLayout.astro';
import { getProjects, type Project } from '../../lib/collections';

export const getStaticPaths = (async () => {
	const projects = await getProjects();
	return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}) satisfies GetStaticPaths;

interface Props {
	project: Project;
}

const { project } = Astro.props;
const { title, summary, stack, repo, demo, cover } = project.data;
const { Content } = await render(project);
---

<ProseLayout title={title} description={summary}>
	<Fragment slot="header">
		<Label>Project</Label>
		<h1 class="article-title">{title}</h1>
		<p class="article-lede">{summary}</p>
		<Label>{stack.join(' · ')}</Label>
		{
			(repo || demo) && (
				<div class="article-actions">
					{demo && <Button href={demo}>Live demo</Button>}
					{repo && (
						<Button href={repo} variant="outline">
							Source code
						</Button>
					)}
				</div>
			)
		}
		{
			cover && (
				<Image
					class="article-cover"
					src={cover}
					alt={`Screenshot of ${title}`}
					widths={[800, 1280, 1920]}
					sizes="(max-width: 1280px) 100vw, 1280px"
				/>
			)
		}
	</Fragment>
	<Content />
</ProseLayout>
```

- [ ] **Step 7: 运行测试，确认通过**

运行：`npm run build && npx vitest run tests/build/projects.test.ts`
Expected：全部通过。如果 `article-cover` 那条正则匹配失败，先用 `grep -o '<img[^>]*article-cover[^>]*>' dist/projects/task-manager/index.html` 看实际输出的属性顺序。两种顺序测试都已兼容，正常不需要改。

- [ ] **Step 8: 提交**

```bash
git add -A && git commit -m "feat: add project list, project detail pages and prose styles" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 博客列表页、文章页和 RSS

**Files:**
- Create: `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`, `src/pages/rss.xml.ts`
- Test: `tests/build/blog.test.ts`

**Interfaces:**
- Consumes: `getPosts`、`getProfile`、`Post`（Task 3）；`formatDate`、`isoDate`、`readingTime`（Task 2）；`PostListItem`、`Label`（Task 5）；`ProseLayout`（Task 6）。
- Produces: 路由 `/blog/`、`/blog/<id>/`、`/rss.xml`。

- [ ] **Step 1: 写失败测试 `tests/build/blog.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { exists, htmlFiles, page, read } from './helpers';

describe('blog index', () => {
	const html = page('/blog/');

	it('lists published posts newest first', () => {
		const a = html.indexOf('Building this site');
		const b = html.indexOf('Notes on testing static sites');
		expect(a).toBeGreaterThan(-1);
		expect(a).toBeLessThan(b);
		expect(html).toContain('<title>Blog — Jane Doe</title>');
	});
});

describe('post page', () => {
	const html = page('/blog/building-this-site/');

	it('renders title, date, reading time and tags', () => {
		expect(html).toMatch(/<h1 class="article-title"[^>]*>Building this site<\/h1>/);
		expect(html).toContain('datetime="2026-10-18"');
		expect(html).toContain('Oct 18, 2026');
		expect(html).toMatch(/\d+ min read/);
		expect(html).toContain('#astro');
	});

	it('renders optimized images and highlighted code', () => {
		expect(html).toMatch(/<img[^>]*src="\/_astro\/architecture[^"]*"/);
		expect(html).toContain('class="astro-code');
	});

	it('builds folder-based posts at their folder slug', () => {
		expect(exists('blog/building-this-site/index.html')).toBe(true);
	});
});

describe('rss', () => {
	const xml = read('rss.xml');

	it('is an RSS document with one item per published post', () => {
		expect(xml.startsWith('<?xml')).toBe(true);
		expect(xml).toContain('<rss');
		expect(xml.match(/<item>/g)).toHaveLength(2);
		expect(xml).toContain('<link>https://usn0m3.github.io/blog/building-this-site/</link>');
	});
});

describe('draft never leaks', () => {
	it('is absent from every page, the feed and the sitemap', () => {
		expect(exists('blog/draft-ideas/index.html')).toBe(false);
		const files = [...htmlFiles(), 'rss.xml', 'sitemap-0.xml'];
		for (const file of files) {
			const text = read(file);
			expect(text, file).not.toContain('Unpublished draft ideas');
			expect(text, file).not.toContain('draft-ideas');
		}
	});
});
```

- [ ] **Step 2: 运行测试，确认失败**

运行：`npm run build && npx vitest run tests/build/blog.test.ts`
Expected：失败，报错 `ENOENT ... dist/blog/index.html`。

- [ ] **Step 3: 写 `src/pages/blog/index.astro`**

```astro
---
import PostListItem from '../../components/PostListItem.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getPosts } from '../../lib/collections';

const posts = await getPosts();
---

<BaseLayout title="Blog" description="Writing on software engineering, performance and the tools I use.">
	<div class="container">
		<header class="page-header">
			<h1 class="page-title">Blog</h1>
			<p class="page-intro">Notes on building software. <a class="section-link" href="/rss.xml">Subscribe via RSS</a></p>
		</header>
		{
			posts.length > 0 ? (
				posts.map((post) => <PostListItem post={post} headingLevel="h2" />)
			) : (
				<p class="empty">The first post is on its way.</p>
			)
		}
	</div>
</BaseLayout>
```

- [ ] **Step 4: 写 `src/pages/blog/[...slug].astro`**

```astro
---
import type { GetStaticPaths } from 'astro';
import { render } from 'astro:content';
import Label from '../../components/Label.astro';
import ProseLayout from '../../layouts/ProseLayout.astro';
import { getPosts, type Post } from '../../lib/collections';
import { formatDate, isoDate, readingTime } from '../../lib/content';

export const getStaticPaths = (async () => {
	const posts = await getPosts();
	return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

interface Props {
	post: Post;
}

const { post } = Astro.props;
const { title, description, pubDate, updatedDate, tags } = post.data;
const minutes = readingTime(post.body);
const { Content } = await render(post);
---

<ProseLayout title={title} description={description}>
	<Fragment slot="header">
		<div class="article-meta">
			<Label><time datetime={isoDate(pubDate)}>{formatDate(pubDate)}</time></Label>
			{
				updatedDate && (
					<Label>
						Updated <time datetime={isoDate(updatedDate)}>{formatDate(updatedDate)}</time>
					</Label>
				)
			}
			<Label>{minutes} min read</Label>
		</div>
		<h1 class="article-title">{title}</h1>
		<p class="article-lede">{description}</p>
		{tags.length > 0 && <Label>{tags.map((tag) => `#${tag}`).join(' ')}</Label>}
	</Fragment>
	<Content />
</ProseLayout>
```

- [ ] **Step 5: 写 `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, getProfile } from '../lib/collections';

export async function GET(context: APIContext) {
	if (!context.site) throw new Error('Set `site` in astro.config.mjs to generate the RSS feed.');
	const [posts, profile] = await Promise.all([getPosts(), getProfile()]);
	return rss({
		title: `${profile.name} — Blog`,
		description: profile.intro,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: post.data.tags,
			link: `/blog/${post.id}/`,
		})),
	});
}
```

- [ ] **Step 6: 运行测试，确认通过**

运行：`npm run build && npx vitest run tests/build/blog.test.ts`
Expected：全部通过。

- [ ] **Step 7: 确认草稿在开发模式下可见**

后台运行 `npm run dev`，然后执行：

```bash
curl -s http://localhost:4321/blog/ | grep -c "Unpublished draft ideas"
```

Expected：输出 `1`。确认后停止 dev 服务器。

- [ ] **Step 8: 提交**

```bash
git add -A && git commit -m "feat: add blog list, post pages and RSS feed" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: About 页、经历时间线和 404 页

**Files:**
- Create: `src/components/Timeline.astro`, `src/pages/about.astro`, `src/pages/404.astro`
- Test: `tests/build/about.test.ts`

**Interfaces:**
- Consumes: `getProfile`（Task 3）；`formatYearMonth`、`paragraphs`（Task 2）；`Button`、`Label`（Task 5）；`BaseLayout`（Task 4）。
- Produces: `Timeline` props：`{ items: Array<{ title: string; org: string; start: string; end: string; summary?: string; highlights?: string[] }> }`。

- [ ] **Step 1: 写失败测试 `tests/build/about.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { exists, page, read } from './helpers';

describe('about page', () => {
	const html = page('/about/');

	it('renders bio paragraphs', () => {
		expect(html).toContain('<title>About — Jane Doe</title>');
		expect(html).toMatch(/<p[^>]*>I(&#39;|')m a software engineer who cares about performance/);
		expect(html).toMatch(/<p[^>]*>Outside work I write/);
	});

	it('renders the experience timeline with formatted periods', () => {
		expect(html).toContain('Acme Corp');
		expect(html).toContain('Jul 2023 — Present');
		expect(html).toContain('Jun 2022 — Sep 2022');
		expect(html).toContain('Cut p95 API latency by 60% with a distributed cache layer.');
	});

	it('renders skills and education', () => {
		expect(html).toContain('Backend and infrastructure');
		expect(html).toContain('TypeScript · Go · Python · SQL');
		expect(html).toContain('Example University');
		expect(html).toContain('Sep 2019 — Jun 2023');
	});

	it('offers the résumé and email', () => {
		expect(html).toMatch(/href="\/resume\.pdf"[^>]*download/);
		expect(html).toContain('href="mailto:hello@example.com"');
	});
});

describe('404 page', () => {
	it('exists and links home', () => {
		expect(exists('404.html')).toBe(true);
		const html = read('404.html');
		expect(html).toContain('Off the track.');
		expect(html).toMatch(/<a href="\/" class="btn btn-primary"/);
	});
});
```

- [ ] **Step 2: 运行测试，确认失败**

运行：`npm run build && npx vitest run tests/build/about.test.ts`
Expected：失败，报错 `ENOENT ... dist/about/index.html`。

- [ ] **Step 3: 写 `src/components/Timeline.astro`**

```astro
---
import { formatYearMonth } from '../lib/content';

interface Props {
	items: Array<{
		title: string;
		org: string;
		start: string;
		end: string;
		summary?: string;
		highlights?: string[];
	}>;
}

const { items } = Astro.props;
---

<ol class="timeline">
	{
		items.map((item) => (
			<li class="entry">
				<p class="period">
					{formatYearMonth(item.start)} — {formatYearMonth(item.end)}
				</p>
				<div class="body">
					<h3 class="title">{item.title}</h3>
					<p class="org">{item.org}</p>
					{item.summary && <p class="summary">{item.summary}</p>}
					{item.highlights && item.highlights.length > 0 && (
						<ul class="highlights">
							{item.highlights.map((highlight) => (
								<li>{highlight}</li>
							))}
						</ul>
					)}
				</div>
			</li>
		))
	}
</ol>

<style>
	.timeline {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.entry {
		display: grid;
		grid-template-columns: 200px minmax(0, 1fr);
		gap: var(--space-3);
		padding-block: var(--space-4);
		border-top: 1px solid var(--color-hairline);
	}
	.period {
		color: var(--color-muted);
		font-size: 13px;
	}
	.title {
		font-size: 20px;
	}
	.org {
		margin-top: var(--space-1);
		color: var(--color-ink);
	}
	.summary {
		margin-top: var(--space-2);
	}
	.highlights {
		margin: var(--space-2) 0 0;
		padding-left: 1.1em;
	}
	@media (max-width: 720px) {
		.entry {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-2);
		}
	}
</style>
```

- [ ] **Step 4: 写 `src/pages/about.astro`**

```astro
---
import Button from '../components/Button.astro';
import Timeline from '../components/Timeline.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { getProfile } from '../lib/collections';
import { paragraphs } from '../lib/content';

const profile = await getProfile();
const experience = profile.experience.map((job) => ({
	title: job.role,
	org: job.company,
	start: job.start,
	end: job.end,
	summary: job.summary,
	highlights: job.highlights,
}));
const education = profile.education.map((school) => ({
	title: school.degree,
	org: school.school,
	start: school.start,
	end: school.end,
}));
---

<BaseLayout title="About" description={`About ${profile.name}: experience, skills and education.`}>
	<div class="container">
		<header class="page-header">
			<h1 class="page-title">About</h1>
		</header>
		<div class="bio">
			{paragraphs(profile.bio).map((text) => <p>{text}</p>)}
		</div>
		<div class="actions about-actions">
			<Button href="/resume.pdf" download>Download résumé</Button>
			<Button href={`mailto:${profile.email}`} variant="outline">Email me</Button>
		</div>

		<section class="section" aria-labelledby="experience-heading">
			<div class="section-head">
				<h2 id="experience-heading" class="section-heading">Experience</h2>
			</div>
			<Timeline items={experience} />
		</section>

		<section class="section" aria-labelledby="skills-heading">
			<div class="section-head">
				<h2 id="skills-heading" class="section-heading">Skills</h2>
			</div>
			<div class="skills">
				{
					profile.skills.map((skill) => (
						<div>
							<h3 class="skill-group">{skill.group}</h3>
							<p>{skill.items.join(' · ')}</p>
						</div>
					))
				}
			</div>
		</section>

		<section class="section" aria-labelledby="education-heading">
			<div class="section-head">
				<h2 id="education-heading" class="section-heading">Education</h2>
			</div>
			<Timeline items={education} />
		</section>
	</div>
</BaseLayout>

<style>
	.bio {
		display: flex;
		flex-direction: column;
		gap: 1.25em;
		max-width: var(--measure);
		color: var(--color-prose);
		font-size: 18px;
		line-height: 1.7;
	}
	.about-actions {
		margin-top: var(--space-6);
	}
	.skills {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
		gap: var(--space-5);
	}
	.skill-group {
		margin-bottom: var(--space-2);
		font-size: 16px;
	}
</style>
```

- [ ] **Step 5: 写 `src/pages/404.astro`**

```astro
---
import Button from '../components/Button.astro';
import Label from '../components/Label.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Page not found" description="This page doesn't exist.">
	<section class="container page-header">
		<Label>Error 404</Label>
		<h1 class="page-title">Off the track.</h1>
		<p class="page-intro">The page you're looking for doesn't exist or has moved.</p>
		<div class="actions back">
			<Button href="/">Back to home</Button>
		</div>
	</section>
</BaseLayout>

<style>
	.page-title {
		margin-top: var(--space-3);
	}
	.back {
		margin-top: var(--space-5);
	}
</style>
```

- [ ] **Step 6: 运行测试，确认通过**

运行：`npm run build && npx vitest run tests/build/about.test.ts`
Expected：全部通过。

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: add about page with timeline and 404 page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 全站检查、README、CI 和浏览器验证

**Files:**
- Create: `tests/build/site.test.ts`, `README.md`, `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: 前面所有任务的构建产物。
- Produces: 完整的 `npm run verify` 流程，以及推送到 `main` 时自动运行的部署 workflow。

- [ ] **Step 1: 写全站测试 `tests/build/site.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { exists, htmlFiles, read } from './helpers';

/** Map an internal URL to the file GitHub Pages would serve for it. */
function targetFile(url: string): string {
	const path = decodeURI(url.split(/[?#]/)[0]);
	if (path.endsWith('/')) return `${path.slice(1)}index.html`;
	if (/\.[a-z0-9]+$/i.test(path)) return path.slice(1);
	return `${path.slice(1)}/index.html`;
}

function internalUrls(html: string): string[] {
	const urls: string[] = [];
	for (const [, , value] of html.matchAll(/\b(href|src)="([^"]*)"/g)) urls.push(value);
	for (const [, value] of html.matchAll(/\bsrcset="([^"]*)"/g)) {
		urls.push(...value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]));
	}
	return urls.filter((url) => url.startsWith('/') && !url.startsWith('//'));
}

describe('whole site', () => {
	const pages = htmlFiles();

	it('builds every expected route', () => {
		for (const file of [
			'index.html',
			'projects/index.html',
			'projects/task-manager/index.html',
			'projects/edge-cache/index.html',
			'projects/cli-toolkit/index.html',
			'blog/index.html',
			'blog/building-this-site/index.html',
			'blog/notes-on-testing/index.html',
			'about/index.html',
			'404.html',
			'rss.xml',
			'sitemap-index.xml',
		]) {
			expect(exists(file), file).toBe(true);
		}
	});

	it('has no broken internal links or assets', () => {
		const broken: string[] = [];
		for (const file of pages) {
			for (const url of internalUrls(read(file))) {
				if (!exists(targetFile(url))) broken.push(`${file} -> ${url}`);
			}
		}
		expect(broken).toEqual([]);
	});

	it('ships no client-side JavaScript', () => {
		for (const file of pages) {
			expect(read(file), file).not.toContain('<script');
		}
	});

	it('never renders empty or undefined attributes', () => {
		for (const file of pages) {
			const html = read(file);
			expect(html, file).not.toMatch(/\b(href|src)=""/);
			expect(html, file).not.toContain('undefined');
		}
	});

	it('lists real pages in the sitemap, without the 404 page', () => {
		const sitemap = read('sitemap-0.xml');
		expect(sitemap).toContain('<loc>https://usn0m3.github.io/blog/building-this-site/</loc>');
		expect(sitemap).toContain('<loc>https://usn0m3.github.io/about/</loc>');
		expect(sitemap).not.toContain('404');
	});
});
```

- [ ] **Step 2: 运行完整验证**

运行：`npm run verify`
Expected：`astro check` 显示 `0 errors`，构建成功，单元测试和构建产物测试全部通过。

如果 `has no broken internal links` 失败，输出会列出 `页面 -> 链接`。修正链接本身，不要修改测试。

- [ ] **Step 3: 写 `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run test:build
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 4: 写 `README.md`**

````markdown
# usn0m3.github.io

个人网站：作品集、博客和简历。基于 Astro 构建，推送到 `main` 分支后自动发布到 https://usn0m3.github.io 。

## 本地预览

```bash
npm install      # 第一次运行时需要
npm run dev      # 打开 http://localhost:4321 ，修改文件后页面自动刷新
```

## 写一篇文章

在 `src/content/blog/` 下新建 `文章名.md`。需要配图时，改为新建文件夹 `文章名/`，把正文写在 `index.md` 里，图片放在同一个文件夹中。

```markdown
---
title: My post title
description: One sentence shown in lists and search results.
pubDate: 2026-10-18
tags: [nodejs, performance]
draft: true        # 写完后删掉这一行才会发布
---

正文……  ![图片说明](./diagram.png)
```

## 加一个项目

在 `src/content/projects/` 下新建 `项目名.md`（有封面图时用文件夹形式 `项目名/index.md`，封面图放在旁边）：

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

## 改个人信息和简历

- 个人信息：`src/data/profile.yaml`。年月写成带引号的 `"2023-07"`，在职的结束时间写 `present`。
- 简历：用你的 PDF 替换 `public/resume.pdf`，文件名保持不变。

## 发布

```bash
npm run verify   # 本地完整检查：类型、构建、测试
git add -A
git commit -m "post: my new article"
git push
```

推送后 GitHub Actions 会自动构建，1–2 分钟后上线。进度可以在仓库的 Actions 页面查看。

## 构建失败怎么办

报错会指出是哪个文件的哪个字段，例如 `blog → my-post` 的 `title: Required`。照着修改后再推送即可。构建失败时线上会保留上一个正常版本。

## 设计

视觉规范见 `DESIGN.md`（基于 Ferrari 设计语言），颜色和间距定义在 `src/styles/tokens.css`。
````

- [ ] **Step 5: 浏览器验证**

后台运行 `npm run build && npm run preview`（端口 4321），然后在 `http://localhost:4321` 打开以下页面：`/`、`/projects/`、`/projects/task-manager/`、`/projects/edge-cache/`、`/blog/`、`/blog/building-this-site/`、`/about/`、`/nonexistent/`（应显示 404 页面）。

每个页面分别在 **1280×800** 和 **375×812** 两种视口下检查：

1. 在页面中执行以下 JS，结果必须为 `true`（说明没有横向滚动）：

```js
document.documentElement.scrollWidth <= window.innerWidth
```

2. 控制台没有报错。
3. 按 Tab 键时，焦点框清晰可见；第一次按 Tab 应出现 “Skip to content” 链接。
4. 截图对照 spec 第 6 节检查：近黑底色、红色只出现在允许的位置、按钮是直角、标题字重不加粗。

任何一项不通过，都要先修复（修复后运行 `npm run verify`），再继续下一步。检查完成后停止 preview 服务器，并把视口恢复为默认值。

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: add site-wide checks, README and deploy workflow" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 发布到 GitHub（每一步都需要用户确认）

**Files:** 无代码改动。

- [ ] **Step 1: 征求用户同意**

向用户说明下面的操作，**等用户明确同意后再继续**：
- 在 usn0m3 账号下创建**公开**仓库 `usn0m3.github.io`
- 把 Pages 的构建来源设为 GitHub Actions
- 推送 `main` 分支。推送后网站会公开上线，当前内容还是 Jane Doe 的占位信息。

同时问用户：是先把 `profile.yaml` 和 `resume.pdf` 换成真实内容再发布，还是先用占位内容上线。

- [ ] **Step 2: 创建仓库并设置 remote（用户同意后）**

```bash
gh repo create usn0m3.github.io --public --source . --remote origin --description "Personal site: portfolio, blog and résumé"
```

Expected：输出 `Created repository usn0m3/usn0m3.github.io` 和 `Added remote`。

- [ ] **Step 3: 启用 Pages，构建来源设为 Actions**

```bash
gh api -X POST repos/usn0m3/usn0m3.github.io/pages -f build_type=workflow
```

Expected：返回的 JSON 中包含 `"build_type": "workflow"`。

- [ ] **Step 4: 推送**

```bash
git push -u origin main
```

- [ ] **Step 5: 等待部署并验证**

在后台运行 `gh run watch --exit-status`（不要在前台循环轮询）。部署完成后执行：

```bash
curl -sI https://usn0m3.github.io/ | head -1
curl -s https://usn0m3.github.io/ | grep -c "Built for speed"
```

Expected：第一行输出 `HTTP/2 200`，第二行输出 `1`。如果 workflow 失败，用 `gh run view --log-failed` 查看原因。
