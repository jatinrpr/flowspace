import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

interface VoiceMessageProps {
  url: string
  initialDuration?: number
}

export function VoiceMessage({ url, initialDuration }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(initialDuration && initialDuration > 0 ? initialDuration : 0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (initialDuration && initialDuration > 0) {
      setDuration(initialDuration)
    }
  }, [initialDuration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateDuration = () => {
      const d = audio.duration
      if (d && !isNaN(d) && isFinite(d) && d > 0) {
        setDuration(Math.round(d))
      }
    }

    const updateProgress = () => {
      setProgress(audio.currentTime)
      const d = audio.duration
      if (d && !isNaN(d) && isFinite(d) && d > 0 && (!duration || duration === 0)) {
        setDuration(Math.round(d))
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      if (audioRef.current) audioRef.current.currentTime = 0
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('canplay', updateDuration)
    audio.addEventListener('canplaythrough', updateDuration)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    if (audio.readyState >= 1) {
      updateDuration()
    }

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('canplay', updateDuration)
      audio.removeEventListener('canplaythrough', updateDuration)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [url])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.ended || (duration > 0 && audio.currentTime >= duration)) {
      audio.currentTime = 0
      setProgress(0)
    }

    if (audio.paused) {
      audio.play().catch(err => {
        console.error('Audio playback error:', err)
        setIsPlaying(false)
        const msg = url.includes('/uploads/')
          ? 'This audio recording was from an earlier session and is no longer available. Please record a new voice message!'
          : `Playback error: ${err.message || 'Unable to play audio'}`
        alert(msg)
      })
    } else {
      audio.pause()
    }
  }

  const cyclePlaybackRate = () => {
    if (audioRef.current) {
      const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
      audioRef.current.playbackRate = nextRate
      setPlaybackRate(nextRate)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg max-w-sm mt-1 border border-slate-200 dark:border-slate-700">
      <button 
        onClick={togglePlayPause}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 shrink-0"
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>
      
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input 
          type="range" 
          min="0" 
          max={duration || 100} 
          value={progress} 
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-violet-600"
        />
        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>{formatTime(progress)} / {formatTime(duration)}</span>
        </div>
      </div>
      
      <button 
        onClick={cyclePlaybackRate}
        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 shrink-0 px-1"
      >
        {playbackRate}x
      </button>
      
      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  )
}
