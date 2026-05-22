# PULSE

A sleek media downloader for YouTube, Instagram, TikTok, Twitter/X and 1000+ platforms, with real-time SSE progress and a modern UI.

![PULSE](https://img.shields.io/badge/PULSE-0.1.0-00F0FF?style=flat-square)

## Features

- **Multi-Platform Support** — Download from YouTube, Instagram, TikTok, Twitter/X and 1000+ sites via yt-dlp
- **Real-Time Progress** — SSE-powered live progress bar, no polling
- **Format Options** — Video, Audio, Thumbnail, Subtitles with quality selectors
- **Clipboard Detection** — Auto-detects media URLs from your clipboard
- **QuickTime Compatible** — H.264 encoded videos that play natively on macOS

## Tech Stack

- **Frontend** — React 19 + Vite, Framer Motion, Lucide Icons
- **Backend** — Express.js, SSE for real-time updates
- **Media Processing** — yt-dlp with FFmpeg

## Getting Started

### Prerequisites

- Node.js 18+
- yt-dlp installed (`brew install yt-dlp`)
- FFmpeg installed (`brew install ffmpeg`)

### Installation

```bash
# Clone the repo
git clone https://github.com/Jai0401/pulse.git
cd pulse

# Install dependencies
npm install

# Start frontend (terminal 1)
npm run dev

# Start backend (terminal 2)
node server/index.cjs
```

### Usage

1. Paste any media URL into the input
2. Select format (Video/Audio/Thumbnail/Subtitles)
3. Choose quality and output format
4. Click "Download Now"

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Analyze URL |
| `Esc` | Clear input |
