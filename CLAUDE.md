# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PULSE is a media downloader web application supporting YouTube, Instagram, TikTok, Twitter/X, and 1000+ platforms via yt-dlp.

## Architecture

- **Frontend**: React 19 + Vite (port 5173)
- **Backend**: Express.js (port 3001) in `server/index.cjs`
- **Communication**: REST API between frontend and backend

## Commands

```bash
# Frontend
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint check

# Backend
node server/index.cjs  # Start Express server

# Both (development)
# Terminal 1: npm run dev
# Terminal 2: node server/index.cjs
```

## Key Files

- `src/App.jsx` - Main React component with download logic
- `src/App.css` - All styling
- `server/index.cjs` - Express backend with yt-dlp integration

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/info` | Fetch media metadata |
| POST | `/api/download` | Start download, returns downloadId |
| GET | `/api/download/:id/status` | Poll download progress |
| GET | `/api/download/:id/file` | Stream/download completed file |

## yt-dlp Format Selection

- **Video**: Uses `-S codec:h264` for QuickTime compatibility (H.264 codec)
- **Audio**: Uses `bestaudio/best` with quality selector
- **Thumbnail**: Uses `--skip-download --write-thumbnail`
- **Progress**: Parsed from `stdout` (not `stderr`) with regex `/\[download\]\s+(\d+\.?\d*)%/`

## Supported Platforms

YouTube, Instagram, TikTok, Twitter/X via pattern matching in `PLATFORMS` constant.

## Known Issues

- Instagram/TikTok may not return thumbnail/preview for some content types
- Video downloads require H.264 codec for native macOS QuickTime playback
- Large video files may take time to process (6-minute poll timeout)