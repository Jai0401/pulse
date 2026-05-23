const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const CORS_ORIGINS = (process.env.CORS_ORIGIN || FRONTEND_URL)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.includes('*')) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

app.get('/pulse', (req, res) => {
  res.json({ status: 'ok', service: 'pulse' });
});

const PORT = process.env.PORT || 3001;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

const downloads = new Map();
const sseConnections = new Map();

// Cleanup temp files older than 1 hour on startup
try {
  const files = fs.readdirSync(DOWNLOAD_DIR);
  const oneHourAgo = Date.now() - 3600000;
  files.forEach(f => {
    const filePath = path.join(DOWNLOAD_DIR, f);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < oneHourAgo) {
      fs.unlink(filePath, () => {});
    }
  });
} catch (e) {}

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Parse video info
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  console.log(`[info] Fetching metadata: ${url}`);

  try {
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-warnings',
      '--flat-playlist',
      url
    ]);

    let data = '';
    let error = '';

    ytdlp.stdout.on('data', (chunk) => { data += chunk; });
    ytdlp.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      error += text;
      if (text.trim()) console.error(`[info][yt-dlp] ${text.trim()}`);
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        const errorLines = error.split('\n').filter(l => l.trim());
        let errorMsg = 'Failed to fetch media info';
        if (errorLines.length > 0) {
          const relevantLines = errorLines.filter(l =>
            !l.includes('[debug]') && !l.includes('[Verbose]')
          );
          if (relevantLines.length > 0) {
            errorMsg = relevantLines[relevantLines.length - 1].trim();
            errorMsg = errorMsg.replace(/^(ERROR|download|info):\s*/i, '');
          }
        }
        return res.status(500).json({ error: errorMsg });
      }

      try {
        const info = JSON.parse(data);
        res.json({
          title: info.title || 'Unknown',
          thumbnail: info.thumbnail || null,
          duration: info.duration ? formatDuration(info.duration) : null,
          channel: info.channel || info.uploader || 'Unknown',
          description: info.description || '',
          view_count: info.view_count || 0,
          like_count: info.like_count || null,
          formats: extractFormats(info.formats || [])
        });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse video info' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start download - returns download ID immediately
app.post('/api/download', async (req, res) => {
  const { url, format = 'audio', quality = '320kbps', outputFormat = 'mp3' } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tempFilename = `media_${Date.now()}`;
  const tempPath = path.join(DOWNLOAD_DIR, tempFilename);

  // Initialize download progress
  downloads.set(downloadId, {
    id: downloadId,
    status: 'preparing',
    progress: 0,
    filename: null,
    error: null
  });

  // Return download ID immediately
  res.json({ downloadId, status: 'started' });

  console.log(`[download] Started ${downloadId} (${format}/${outputFormat || 'default'})`);

  // Start the actual download process
  processDownload(downloadId, url, format, quality, outputFormat, tempPath, tempFilename);
});

async function processDownload(downloadId, url, format, quality, outputFormat, tempPath, tempFilename) {
  const qualityMap = { '320kbps': '0', '256kbps': '1', '128kbps': '2', 'best': '0' };

  const formatHandlers = {
    audio: () => {
      const audioFormat = outputFormat || 'mp3';
      return [
        '-o', `${tempPath}.%(ext)s`, '--no-warnings', '--extract-audio',
        '--audio-format', audioFormat, '--audio-quality', qualityMap[quality] || '0',
        '-f', 'bestaudio/best', url
      ];
    },
    video: () => {
      const heightMatch = quality.match(/(\d+)p?/);
      const height = heightMatch ? heightMatch[1] : null;
      // -S codec:h264 ensures H.264 for QuickTime compatibility
      // For specific quality, limit height; for Best, cap at 1080p
      const heightArg = height ? `height<=${height}` : 'height<=1080';
      return [
        '-o', `${tempPath}.%(ext)s`, '--no-warnings',
        '-f', `bestvideo[${heightArg}]+bestaudio/best`,
        '--merge-output-format', 'mp4',
        '-S', 'codec:h264', url
      ];
    },
    thumbnail: () => [
      '--skip-download', '--write-thumbnail',
      '--convert-thumbnails', outputFormat ? outputFormat.toLowerCase() : 'jpg',
      '-o', `${tempPath}.%(ext)s`, '--no-warnings', url
    ],
    subtitle: () => [
      '--write-subs', '--write-auto-subs', '--sub-format', outputFormat || 'srt',
      '-o', `${tempPath}.%(ext)s`, '--no-warnings', url
    ]
  };

  const args = (formatHandlers[format] || (() => ['-o', `${tempPath}.%(ext)s`, '--no-warnings', url]))();

  const dl = downloads.get(downloadId);
  if (dl) {
    dl.format = format;
    dl.outputFormat = outputFormat;
  }

  const ytdlp = spawn('yt-dlp', args);

  let error = '';

  ytdlp.stdout.on('data', (chunk) => {
    const output = chunk.toString();
    const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);

    if (progressMatch) {
      const dl = downloads.get(downloadId);
      if (dl) {
        dl.progress = parseFloat(progressMatch[1]);
        dl.status = 'downloading';
        broadcastProgress(downloadId, { type: 'progress', progress: dl.progress, status: 'downloading' });
      }
    }
  });

  ytdlp.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    error += text;
    if (text.trim()) console.error(`[download][${downloadId}][yt-dlp] ${text.trim()}`);
  });

  ytdlp.on('close', (code) => {
    const dl = downloads.get(downloadId);
    if (!dl) return;

    console.log(`[download] Finished ${downloadId} with code ${code}`);

    if (code !== 0) {
      const errorLines = error.split('\n').filter(l => l.trim());
      let errorMsg = 'Download failed';
      if (errorLines.length > 0) {
        const relevantLines = errorLines.filter(l =>
          !l.includes('[debug]') && !l.includes('[Verbose]')
        );
        if (relevantLines.length > 0) {
          errorMsg = relevantLines[relevantLines.length - 1].trim();
          errorMsg = errorMsg.replace(/^(ERROR|download|info):\s*/i, '');
        }
      }
      dl.status = 'error';
      dl.error = errorMsg;
      broadcastProgress(downloadId, { type: 'error', error: errorMsg });
    } else {
      // Find the downloaded file
      fs.readdir(DOWNLOAD_DIR, (err, files) => {
        if (err) {
          dl.status = 'error';
          dl.error = 'Server error: could not read downloads folder';
          broadcastProgress(downloadId, { type: 'error', error: 'Server error: could not read downloads folder' });
          return;
        }
        const downloadedFile = files.find(f => f.startsWith(tempFilename));
        if (downloadedFile) {
          dl.status = 'complete';
          dl.progress = 100;
          dl.filename = downloadedFile;
          broadcastProgress(downloadId, { type: 'complete', progress: 100, status: 'complete', filename: downloadedFile });
        } else {
          dl.status = 'error';
          dl.error = 'Downloaded file not found after processing';
          broadcastProgress(downloadId, { type: 'error', error: 'Downloaded file not found after processing' });
        }
      });
    }
  });
}

// SSE stream for download progress
app.get('/api/download/:id/stream', (req, res) => {
  const downloadId = req.params.id;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', downloadId })}\n\n`);

  // Store the response object for this download
  if (!sseConnections.has(downloadId)) {
    sseConnections.set(downloadId, new Set());
  }
  sseConnections.get(downloadId).add(res);

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    const conns = sseConnections.get(downloadId);
    if (conns) {
      conns.delete(res);
      if (conns.size === 0) sseConnections.delete(downloadId);
    }
  });
});

// Broadcast event to all SSE connections for a download
function broadcastProgress(downloadId, data) {
  const conns = sseConnections.get(downloadId);
  if (conns) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    conns.forEach(res => {
      try {
        res.write(message);
      } catch (e) {
        // Connection may already be closed
      }
    });
  }
}

// Stream download file
app.get('/api/download/:id/file', (req, res) => {
  const dl = downloads.get(req.params.id);
  if (!dl) {
    return res.status(404).json({ error: 'Download not found' });
  }
  if (dl.status !== 'complete' || !dl.filename) {
    return res.status(400).json({ error: 'Download not ready' });
  }

  const filePath = path.join(DOWNLOAD_DIR, dl.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(filePath);
  let finalFilename = dl.filename;
  const baseName = dl.filename.substring(0, dl.filename.lastIndexOf('.'));

  // Set proper extension based on download type
  if (dl.format === 'audio') {
    finalFilename = `${baseName}.${dl.outputFormat || 'mp3'}`;
  } else if (dl.format === 'video') {
    finalFilename = `${baseName}.mp4`;
  } else if (dl.format === 'thumbnail') {
    finalFilename = `${baseName}.${dl.outputFormat || 'jpg'}`;
  } else if (dl.format === 'subtitle') {
    finalFilename = `${baseName}.${dl.outputFormat || 'srt'}`;
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
  res.setHeader('Content-Length', stat.size);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('end', () => {
    fs.unlink(filePath, () => {});
    downloads.delete(req.params.id);
  });

  fileStream.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

// Get list of downloaded files
app.get('/api/downloads', (req, res) => {
  fs.readdir(DOWNLOAD_DIR, (err, files) => {
    if (err) return res.json([]);
    const mediaFiles = files.filter(f => !f.startsWith('.')).map(f => ({
      filename: f,
      path: `/downloads/${f}`,
      size: fs.statSync(path.join(DOWNLOAD_DIR, f)).size
    }));
    res.json(mediaFiles);
  });
});

// Serve downloads
app.use('/downloads', express.static(DOWNLOAD_DIR));

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function extractFormats(formats) {
  const seen = new Set();
  const result = [];
  formats.forEach(f => {
    const key = `${f.ext}-${f.format_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution || 'audio only',
        filesize: f.filesize || null,
        vcodec: f.vcodec !== 'none' ? true : false,
        acodec: f.acodec !== 'none' ? true : false
      });
    }
  });
  return result;
}

app.listen(PORT, () => {
  console.log(`PULSE backend running on http://localhost:${PORT}`);
});