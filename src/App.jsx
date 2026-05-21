import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Link2, Music, Video, Image, FileText, Globe, Loader2, Check, X,
  Clock, HardDrive, Sparkles, Play, AlertCircle, Trash2
} from 'lucide-react'
import './App.css'

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: '#FF0000', patterns: ['youtube.com', 'youtu.be'] },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', patterns: ['instagram.com', 'instagr.am'] },
  { id: 'tiktok', name: 'TikTok', color: '#00F2EA', patterns: ['tiktok.com'] },
  { id: 'twitter', name: 'Twitter/X', color: '#1DA1F2', patterns: ['twitter.com', 'x.com'] },
  { id: 'generic', name: 'Other', color: '#8B5CF6', patterns: [] },
]

const FORMAT_OPTIONS = [
  { id: 'video', label: 'Video', icon: Video, formats: ['MP4', 'WebM', 'MOV'], quality: ['Best', '1080p', '720p', '480p'] },
  { id: 'audio', label: 'Audio', icon: Music, formats: ['MP3', 'M4A', 'WAV', 'FLAC'], quality: ['320kbps', '256kbps', '128kbps'] },
  { id: 'thumbnail', label: 'Thumbnail', icon: Image, formats: ['JPG', 'PNG', 'WebP'], quality: ['Max', 'Large', 'Medium'] },
  { id: 'subtitle', label: 'Subtitles', icon: FileText, formats: ['SRT', 'VTT', 'ASS'], quality: ['Original', 'Translated'] },
]

const MAX_HISTORY_ITEMS = 10
const API_URL = 'http://localhost:3001'

const DOWNLOAD_STATUS = {
  PREPARING: 'preparing',
  DOWNLOADING: 'downloading',
  COMPLETE: 'complete',
  ERROR: 'error'
}

function getStatusText(status, progress, error) {
  switch (status) {
    case DOWNLOAD_STATUS.PREPARING: return 'Preparing...'
    case DOWNLOAD_STATUS.DOWNLOADING: return `${progress.toFixed(0)}%`
    case DOWNLOAD_STATUS.COMPLETE: return 'Complete'
    case DOWNLOAD_STATUS.ERROR: return error || 'Failed'
    default: return 'Starting...'
  }
}

function detectPlatform(url) {
  for (const platform of PLATFORMS) {
    for (const pattern of platform.patterns) {
      if (url.includes(pattern)) return platform
    }
  }
  return PLATFORMS.find(p => p.id === 'generic')
}

function PulseLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="pulse-logo">
      <circle cx="20" cy="20" r="18" stroke="url(#pulseGrad)" strokeWidth="2" fill="none" />
      <path d="M8 20h4l3-8 4 16 3-8h6" stroke="url(#pulseGrad)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#FF00AA" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function PlatformBadge({ platform, size = 'md' }) {
  return (
    <motion.div
      className={`platform-badge size-${size}`}
      style={{ '--platform-color': platform.color }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Globe size={size === 'sm' ? 12 : 16} />
      <span>{platform.name}</span>
    </motion.div>
  )
}

// Media URL regex patterns
const MEDIA_PATTERNS = [
  // YouTube
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/,
  // Instagram
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p\/|reel\/|tv\/)[a-zA-Z0-9_-]+/,
  // TikTok
  /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/video\/\d+/,
  // Twitter/X
  /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/,
]

function detectMediaUrl(text) {
  if (!text) return null
  for (const pattern of MEDIA_PATTERNS) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  return null
}

function UrlInput({ value, onChange, onSubmit, isProcessing }) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const lastPastedRef = useRef(null)
  const detectedPlatform = value ? detectPlatform(value) : null

  // Auto-paste from clipboard on mount if input is empty
  useEffect(() => {
    const autoPaste = async () => {
      if (value) return
      try {
        const text = await navigator.clipboard.readText()
        const detected = detectMediaUrl(text)
        if (detected) {
          lastPastedRef.current = detected
          onChange(detected)
        }
      } catch (err) {
        // Clipboard access denied
      }
    }
    autoPaste()
  }, [])

  const handleClear = () => {
    lastPastedRef.current = null
    onChange('')
  }

  return (
    <motion.div
      className={`url-input-container ${isFocused ? 'focused' : ''} ${detectedPlatform ? 'detected' : ''}`}
    >
      <div className="input-wrapper">
        <Link2 className="input-icon" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Paste any media URL to download..."
          disabled={isProcessing}
        />
        {value && (
          <motion.button
            className="clear-btn"
            onClick={handleClear}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={16} />
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {detectedPlatform && detectedPlatform.id !== 'generic' && (
          <motion.div
            className="detected-platform"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PlatformBadge platform={detectedPlatform} size="sm" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        className="fetch-btn"
        onClick={onSubmit}
        disabled={!value || isProcessing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isProcessing ? (
          <Loader2 className="spin" size={18} />
        ) : (
          <Sparkles size={18} />
        )}
        <span>{isProcessing ? 'Analyzing...' : 'Analyze'}</span>
      </motion.button>
    </motion.div>
  )
}

function FormatSelector({ selected, onSelect, onQualitySelect, selectedQuality, onFormatSelect, selectedOutputFormat }) {
  const selectedFormat = FORMAT_OPTIONS.find(f => f.id === selected)

  return (
    <div className="format-selector">
      <h3>Select Format</h3>
      <div className="format-grid">
        {FORMAT_OPTIONS.map((format) => (
          <motion.div
            key={format.id}
            className={`format-card ${selected === format.id ? 'selected' : ''}`}
            onClick={() => {
              onSelect(format.id)
              onFormatSelect(format.formats[0])
              onQualitySelect(format.quality[0])
            }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <format.icon size={24} />
            <span className="format-label">{format.label}</span>
            <span className="format-count">{format.formats.length} options</span>
          </motion.div>
        ))}
      </div>
      {selected && selectedFormat && (
        <motion.div
          className="format-details"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="detail-section">
            <h4>Quality</h4>
            <div className="chip-group">
              {selectedFormat.quality.map(q => (
                <span
                  key={q}
                  className={`chip ${selectedQuality === q ? 'active' : ''}`}
                  onClick={() => onQualitySelect(q)}
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <h4>Output Format</h4>
            <div className="chip-group">
              {selectedFormat.formats.map(f => (
                <span
                  key={f}
                  className={`chip ${selectedOutputFormat === f ? 'active' : ''}`}
                  onClick={() => onFormatSelect(f)}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function MediaPreview({ mediaInfo, isLoading }) {
  if (isLoading) {
    return (
      <div className="media-preview loading">
        <div className="preview-skeleton">
          <div className="skeleton-thumb" />
          <div className="skeleton-info">
            <div className="skeleton-line title" />
            <div className="skeleton-line channel" />
          </div>
        </div>
      </div>
    )
  }

  if (!mediaInfo) return null

  return (
    <motion.div
      className="media-preview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="preview-thumbnail">
        {mediaInfo.thumbnail ? (
          <img src={mediaInfo.thumbnail} alt={mediaInfo.title} />
        ) : (
          <div className="thumb-placeholder">
            <Video size={32} />
          </div>
        )}
        {mediaInfo.duration && (
          <span className="duration-badge">{mediaInfo.duration}</span>
        )}
      </div>
      <div className="preview-info">
        <h4>{mediaInfo.title || 'Untitled Media'}</h4>
        <p>{mediaInfo.channel || 'Unknown Channel'}</p>
        {mediaInfo.view_count && (
          <span className="view-count">{formatViewCount(mediaInfo.view_count)} views</span>
        )}
        <div className="preview-meta">
          <span><HardDrive size={12} /> {mediaInfo.formats?.length || 0} formats available</span>
        </div>
      </div>
    </motion.div>
  )
}

function formatViewCount(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

function DownloadProgress({ download }) {
  return (
    <motion.div
      className={`download-item ${download.status}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="download-icon">
        {download.status === DOWNLOAD_STATUS.COMPLETE ? (
          <Check size={16} />
        ) : download.status === DOWNLOAD_STATUS.ERROR ? (
          <X size={16} />
        ) : (
          <Loader2 className="spin" size={16} />
        )}
      </div>
      <div className="download-details">
        <span className="download-name">{download.name}</span>
        <span className="download-progress-text">
          {getStatusText(download.status, download.progress, download.error)}
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className={`progress-fill ${download.status}`}
          initial={{ width: 0 }}
          animate={{ width: `${download.progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}

function HistoryPanel({ history, onClear }) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <h3><Clock size={16} /> Recent Downloads</h3>
        {history.length > 0 && (
          <button className="clear-history" onClick={onClear}>
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>
      <div className="history-list">
        <AnimatePresence>
          {history.map((item, i) => (
            <motion.div
              key={item.id}
              className="history-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="history-thumb">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" />
                ) : (
                  <Video size={14} />
                )}
              </div>
              <div className="history-info">
                <span className="history-title">{item.title}</span>
                <span className="history-format">{item.format} • {item.quality}</span>
              </div>
              <button className="redownload-btn">
                <Play size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {history.length === 0 && (
          <div className="history-empty">
            <Download size={24} />
            <span>No downloads yet</span>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [mediaInfo, setMediaInfo] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [selectedQuality, setSelectedQuality] = useState(null)
  const [selectedOutputFormat, setSelectedOutputFormat] = useState(null)
  const [downloads, setDownloads] = useState([])
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const handleAnalyze = async () => {
    if (!url) return
    setIsProcessing(true)
    setError(null)
    setMediaInfo(null)

    try {
      const response = await fetch(`${API_URL}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch media info')
      }

      setMediaInfo(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedFormat) return

    const formatInfo = FORMAT_OPTIONS.find(f => f.id === selectedFormat)
    const quality = selectedQuality || formatInfo?.quality[0] || 'Best'
    const outputFormat = selectedOutputFormat || formatInfo?.formats[0] || (selectedFormat === 'audio' ? 'mp3' : 'mp4')

    const newDownload = {
      id: Date.now(),
      name: mediaInfo?.title || 'Media File',
      format: selectedFormat,
      quality: quality,
      outputFormat: outputFormat,
      progress: 0,
      status: 'preparing',
      thumbnail: mediaInfo?.thumbnail
    }

    setDownloads(prev => [...prev, newDownload])

    try {
      // Start download - get download ID
      const response = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          format: selectedFormat,
          quality: quality.toLowerCase(),
          outputFormat: outputFormat.toLowerCase()
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to start download')
      }

      const { downloadId } = await response.json()
      if (!downloadId) throw new Error('No download ID returned')

      // Update download with ID
      setDownloads(prev => prev.map(d =>
        d.id === newDownload.id ? { ...d, downloadId, status: 'downloading' } : d
      ))

      // Poll for status - slower interval to avoid flooding
      let pollCount = 0
      const maxPolls = 1200 // 2 minutes at 100ms intervals
      const pollInterval = setInterval(async () => {
        pollCount++
        if (pollCount > maxPolls) {
          clearInterval(pollInterval)
          setDownloads(prev => prev.map(d =>
            d.id === newDownload.id ? { ...d, status: 'error', error: 'Download timed out' } : d
          ))
          return
        }

        try {
          const statusRes = await fetch(`${API_URL}/api/download/${downloadId}/status`)
          if (!statusRes.ok) throw new Error('Status check failed')

          const status = await statusRes.json()

          setDownloads(prev => prev.map(d =>
            d.id === newDownload.id ? { ...d, progress: status.progress || 0, status: status.status } : d
          ))

          if (status.status === 'complete') {
            clearInterval(pollInterval)

            // Fetch the file
            const fileRes = await fetch(`${API_URL}/api/download/${downloadId}/file`)
            if (!fileRes.ok) throw new Error('File download failed')

            const blob = await fileRes.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = `${(mediaInfo?.title || 'media').replace(/[^a-zA-Z0-9]/g, '_')}.${outputFormat.toLowerCase()}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(downloadUrl)
            document.body.removeChild(a)

            setHistory(prev => [{
              id: Date.now(),
              title: newDownload.name,
              format: selectedFormat,
              quality: quality,
              thumbnail: newDownload.thumbnail,
              timestamp: new Date().toISOString()
            }, ...prev.slice(0, 9)])

            setDownloads(prev => prev.map(d =>
              d.id === newDownload.id ? { ...d, status: 'complete', progress: 100 } : d
            ))
          } else if (status.status === 'error') {
            clearInterval(pollInterval)
            setDownloads(prev => prev.map(d =>
              d.id === newDownload.id ? { ...d, status: 'error', error: status.error || 'Download failed' } : d
            ))
          }
        } catch (err) {
          console.error('Poll error:', err, 'downloadId:', downloadId)
          // Only clear and error if we've polled enough or got a real error
          if (pollCount > 5) {
            clearInterval(pollInterval)
            setDownloads(prev => prev.map(d =>
              d.id === newDownload.id ? { ...d, status: 'error', error: err.message } : d
            ))
          }
        }
      }, 100)

      // Cleanup after 5 minutes max
      setTimeout(() => {
        clearInterval(pollInterval)
        setDownloads(prev => prev.filter(d => d.id !== newDownload.id))
      }, 300000)

    } catch (err) {
      console.error('Download error:', err)
      setDownloads(prev => prev.map(d =>
        d.id === newDownload.id ? { ...d, status: 'error', error: err.message || 'Unknown error' } : d
      ))
      setError(err.message || 'Download failed')
    }
  }

  return (
    <div className="app">
      <main className="main-content">
        <div className="hero-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Download Any Media
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            YouTube, Instagram, TikTok, Twitter and 1000+ platforms
          </motion.p>
        </div>

        <motion.div
          className="input-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <UrlInput
            value={url}
            onChange={setUrl}
            onSubmit={handleAnalyze}
            isProcessing={isProcessing}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mediaInfo && (
            <motion.div
              className="info-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <MediaPreview mediaInfo={mediaInfo} />

              <FormatSelector
                selected={selectedFormat}
                onSelect={setSelectedFormat}
                onQualitySelect={setSelectedQuality}
                selectedQuality={selectedQuality}
                onFormatSelect={setSelectedOutputFormat}
                selectedOutputFormat={selectedOutputFormat}
              />

              <motion.button
                className="download-cta"
                onClick={handleDownload}
                disabled={!selectedFormat}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={20} />
                <span>Download Now</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {downloads.map(d => (
            <DownloadProgress key={d.id} download={d} />
          ))}
        </AnimatePresence>

        <div className="supported-platforms">
          <span>Supported:</span>
          {PLATFORMS.map(p => (
            <PlatformBadge key={p.id} platform={p} size="sm" />
          ))}
        </div>
      </main>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            className="history-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <HistoryPanel
              history={history}
              onClear={() => setHistory([])}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App