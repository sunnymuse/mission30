# Mission 30 — Obsidian Gold

A futuristic personal dashboard with life analytics, Body Lab, a Columbus calendar, and a Data Vault preview.

## Current status

This repository contains a static demonstration frontend, not a production personal-data service. The Bunny console is scripted. No health, bank, credit, database, or AI API connection is enabled. Vault entry, deletion and export are disabled in this preview. Body Lab and calendar controls retain browser-local demo preferences; use fictional values only.

## Run locally

From this directory run `python3 -m http.server 8000`, then open http://localhost:8000/.

## AWS Amplify

Connect this repository and select the main branch. The included amplify.yml stages the frontend in dist. customHttp.yml configures security headers, including a CSP that blocks outbound API connections. Enable Amplify access protection before sharing the preview and verify the deployed headers and navigation.

## Before live data

Implement authenticated APIs, owner-scoped storage, separately authorized provider integrations, and server-side secrets. Replace the preview-only configuration and CSP deliberately; adding credentials to config.js will not activate cloud syncing. Test unauthorized access, session termination, stale requests, and data deletion before importing records. ChatGPT connections do not automatically provide AWS access to data.

## Validation

All seven JavaScript files pass node --check. Referenced local assets and the packaged ZIP were checked. Browser behavior, AWS deployment headers, authentication and live data imports have not been verified in production.
