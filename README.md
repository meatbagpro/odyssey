# 诗和远方 · Odyssey

一本私人摘抄簿，收藏抖机灵的小诗、影视解说金句和随记。

- 原文保存在 `_posts/`，仍使用 Markdown + YAML front matter。
- Bun 构建纯静态页面，无 Ruby、前端框架、外部字体或运行时服务依赖。
- 支持每页六则的静态分页、全文/来源搜索、分类、复制正文、年份目录与 RSS。
- 禁用 JavaScript 后，所有摘抄、阅读页和目录仍可浏览。
- 保留现有 Jekyll 文章路径、`feed.xml`、`archive.html`、`about.html` 和自定义域名。

## 本地预览

使用 Bun 1.4.3：

```sh
bun install --frozen-lockfile
bun test
bun run dev
```

打开 `http://localhost:4173`。修改后重新运行 `bun run build`，刷新页面即可；预览服务器不是自动热更新开发服务。

## 添加摘抄

在 `_posts/` 中新建 `YYYY-MM-DD-有意义的标题.md`：

```markdown
---
title: 一段值得留下的话
date: "2026-10-11"
collection: 影视
categories:
  - 影视解说
tags:
  - 解说作者
---

> 作品和来源

摘抄正文。
```

`collection` 可选值为「小诗」「影视」「随记」，只影响浏览分类，不改变链接。未填写时兼容现有文章的分类规则，无法识别的归入随记。正文保留普通换行，也支持标题、列表、引用和链接。

**已发布文章不要随意改文件名或 categories**：这两个字段参与旧 Jekyll URL 的生成。日期目录取自文件名。`tests/legacy-sitemap.xml` 保存改版前线上路径，`tests/original-articles.json` 保存原有 29 篇文章的 SHA-256；如果明确需要编辑旧原文，应审核后同步修改基线，而不是跳过测试。

## 文件结构

- `scripts/content.ts`：解析、安全 Markdown 渲染、链接和分类。
- `scripts/build.ts`：首页、阅读页、目录、Feed 和站点地图。
- `site/book.css`：首页双栏摘要与独立中文阅读页排版。
- `site/book.js`：渐进增强交互，无远程请求；页码、搜索和分类写入地址，支持刷新与浏览器前进后退。
- `site/pagination.js`：分页与全量筛选逻辑；关闭 JavaScript 时仍可通过静态链接翻页。
- `tests/`：内容完整性、旧链接、换行、安全渲染和构建产物验证。

## 部署

仓库为 `meatbagpro/odyssey`。推送到 `master` 后，GitHub Actions 先测试和构建，再使用官方 Pages artifact 部署 `_site/`。仓库 Pages 的构建来源设置为 GitHub Actions。Pull Request 只验证，不部署。

站点域名同时用于 `CNAME` 和 `scripts/build.ts` 中的 `origin`，迁移域名时需要一起修改。

## 来源与版权

本站从 `kitian616/jekyll-TeXt-theme` 的 fork 改造而来；原主题的 MIT 许可保留在 `LICENSE`，新页面不依赖该主题。摘录作品版权归各自作者所有，不因站点代码许可而改变。
