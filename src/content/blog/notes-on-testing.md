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
