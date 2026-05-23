import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Link2, Music, Video, Image, FileText, Globe, Loader2, Check, X,
  HardDrive, Sparkles, AlertCircle
} from 'lucide-react'
import './App.css'

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'youtube', patterns: ['youtube.com', 'youtu.be'] },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram', patterns: ['instagram.com', 'instagr.am'] },
  { id: 'tiktok', name: 'TikTok', color: '#00F2EA', icon: 'tiktok', patterns: ['tiktok.com'] },
  { id: 'twitter', name: 'Twitter/X', color: '#1DA1F2', icon: 'twitter', patterns: ['twitter.com', 'x.com'] },
  { id: 'generic', name: 'Other', color: '#8B5CF6', icon: 'globe', patterns: [] },
]

// Custom platform icons (inline SVGs for modern look)
function PlatformIcon({ platform, size = 16 }) {
  const s = size

  if (platform.icon === 'youtube') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  }

  if (platform.icon === 'instagram') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    )
  }

  if (platform.icon === 'tiktok') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    )
  }

  if (platform.icon === 'twitter') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  }

  // Default globe icon for "Other"
  return <Globe size={size} />
}

function PlatformBadge({ platform, size = 'md' }) {
  const iconSize = size === 'sm' ? 12 : 16
  return (
    <motion.div
      className={`platform-badge size-${size}`}
      style={{ '--platform-color': platform.color }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <PlatformIcon platform={platform} size={iconSize} />
      <span>{platform.name}</span>
    </motion.div>
  )
}

const FORMAT_OPTIONS = [
  { id: 'video', label: 'Video', icon: Video, formats: ['MP4', 'WebM', 'MOV'], quality: ['Best', '1080p', '720p', '480p'] },
  { id: 'audio', label: 'Audio', icon: Music, formats: ['MP3', 'M4A', 'WAV', 'FLAC'], quality: ['320kbps', '256kbps', '128kbps'] },
  { id: 'thumbnail', label: 'Thumbnail', icon: Image, formats: ['JPG', 'PNG', 'WebP'], quality: ['Max', 'Large', 'Medium'] },
  { id: 'subtitle', label: 'Subtitles', icon: FileText, formats: ['SRT', 'VTT', 'ASS'], quality: ['Original', 'Translated'] },
]

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

const DOWNLOAD_STATUS = {
  PREPARING: 'preparing',
  DOWNLOADING: 'downloading',
  REENCODING: 'reencoding',
  COMPLETE: 'complete',
  ERROR: 'error'
}

function getStatusText(status, progress, error) {
  switch (status) {
    case DOWNLOAD_STATUS.PREPARING: return 'Preparing...'
    case DOWNLOAD_STATUS.DOWNLOADING: return `${progress.toFixed(0)}%`
    case DOWNLOAD_STATUS.REENCODING: return 'Finalizing...'
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
  const [isDragging, setIsDragging] = useState(false)
  const [clipboardUrl, setClipboardUrl] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef(null)
  const lastPastedRef = useRef(null)
  const dragCounterRef = useRef(0)
  const detectedPlatform = value ? detectPlatform(value) : null

  // Drag-and-drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    let droppedText = ''

    // Check if dropped content has files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      // Only process text files or files with text content
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|url|links)$/i)) {
        droppedText = await file.text()
      } else {
        // Try reading as text anyway
        droppedText = await file.text().catch(() => '')
      }
    } else if (e.dataTransfer.getData('text/plain')) {
      droppedText = e.dataTransfer.getData('text/plain')
    }

    // Extract media URL from dropped text
    const detected = detectMediaUrl(droppedText)
    if (detected) {
      lastPastedRef.current = detected
      onChange(detected)
      inputRef.current?.focus()
    }
  }

  // Check clipboard on mount and window focus
  useEffect(() => {
    const checkClipboard = async () => {
      if (value) return
      try {
        const text = await navigator.clipboard.readText()
        const detected = detectMediaUrl(text)
        if (detected && detected !== lastPastedRef.current) {
          setClipboardUrl(detected)
          setShowHint(true)
        }
      } catch {
        // Clipboard access denied
      }
    }
    checkClipboard()
    const handleFocus = () => checkClipboard()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [value])

  const handlePasteFromHint = () => {
    if (clipboardUrl) {
      lastPastedRef.current = clipboardUrl
      onChange(clipboardUrl)
      setShowHint(false)
      inputRef.current?.focus()
    }
  }

  const handleClear = () => {
    lastPastedRef.current = clipboardUrl
    setShowHint(false)
    onChange('')
  }

  return (
    <motion.div
      className={`url-input-container ${isFocused ? 'focused' : ''} ${detectedPlatform ? 'detected' : ''} ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <motion.div
          className="drop-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Link2 size={32} />
          <span>Drop URL here</span>
        </motion.div>
      )}
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
        {clipboardUrl && showHint && !value && (
          <motion.button
            className="clipboard-hint"
            onClick={handlePasteFromHint}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            type="button"
          >
            <span className="hint-icon"><Link2 size={12} /></span>
            <span className="hint-text">Paste from clipboard</span>
            <span className="hint-url">{clipboardUrl.length > 40 ? clipboardUrl.substring(0, 40) + '...' : clipboardUrl}</span>
          </motion.button>
        )}
      </AnimatePresence>
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

function App() {
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [mediaInfo, setMediaInfo] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [selectedQuality, setSelectedQuality] = useState(null)
  const [selectedOutputFormat, setSelectedOutputFormat] = useState(null)
  const [downloads, setDownloads] = useState([])

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

  // SSE-based download - replaces polling
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

      // Update download with ID and switch to SSE stream
      setDownloads(prev => prev.map(d =>
        d.id === newDownload.id ? { ...d, downloadId, status: 'downloading' } : d
      ))

      // Open SSE connection for real-time progress
      const eventSource = new EventSource(`${API_URL}/api/download/${downloadId}/stream`)

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'connected') {
            console.log('SSE connected for download:', downloadId)
          } else if (data.type === 'progress') {
            setDownloads(prev => prev.map(d =>
              d.id === newDownload.id ? { ...d, progress: data.progress, status: data.status } : d
            ))
          } else if (data.type === 'complete') {
            // Download complete - fetch the file
            setDownloads(prev => prev.map(d =>
              d.id === newDownload.id ? { ...d, progress: 100, status: 'complete', filename: data.filename } : d
            ))

            // Auto-download the file
            fetch(`${API_URL}/api/download/${downloadId}/file`)
              .then(fileRes => {
                if (!fileRes.ok) throw new Error('File download failed')
                return fileRes.blob()
              })
              .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = `${(mediaInfo?.title || 'media').replace(/[^a-zA-Z0-9]/g, '_')}.${outputFormat.toLowerCase()}`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(downloadUrl)
                document.body.removeChild(a)
              })

            eventSource.close()
          } else if (data.type === 'error') {
            setDownloads(prev => prev.map(d =>
              d.id === newDownload.id ? { ...d, status: 'error', error: data.error } : d
            ))
            eventSource.close()
          }
        } catch (err) {
          console.error('SSE parse error:', err)
        }
      }

      eventSource.onerror = () => {
        // Only show error if download is still in progress
        setDownloads(prev => prev.map(d =>
          d.id === newDownload.id && d.status === 'downloading'
            ? { ...d, status: 'error', error: 'Connection lost. Please try again.' } : d
        ))
        eventSource.close()
      }

      // Cleanup after 6 minutes
      setTimeout(() => {
        eventSource.close()
        setDownloads(prev => prev.filter(d => d.id !== newDownload.id))
      }, 360000)

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
    </div>
  )
}

export default App