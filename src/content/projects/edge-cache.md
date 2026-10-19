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
