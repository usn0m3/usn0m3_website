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
