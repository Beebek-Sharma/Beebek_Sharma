import { useEffect, useRef, useState } from 'react'

export function SoundToggle() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Standard audio setup: starts off by default
    const audio = new Audio('/music/aizen-theme.mp3')
    audio.loop = true
    audio.volume = 0.35
    audioRef.current = audio

    const onEnded = () => setIsPlaying(false)
    const onPause = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)

    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
      audio.pause()
      audio.src = ''
    }
  }, [])

  const toggleSound = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((err) => {
          console.warn('Audio playback error:', err)
          setIsPlaying(false)
        })
    }
  }

  return (
    <button
      className={`sound-toggle ${isPlaying ? 'is-playing' : ''}`}
      type="button"
      onClick={toggleSound}
      aria-label={isPlaying ? 'Mute ambient sound' : 'Play ambient sound'}
      aria-pressed={isPlaying}
      title={isPlaying ? 'Turn sound off' : 'Turn sound on'}
    >
      <span className="sound-bars" aria-hidden="true">
        <span className="sound-bar bar-1" />
        <span className="sound-bar bar-2" />
        <span className="sound-bar bar-3" />
        <span className="sound-bar bar-4" />
      </span>
      <span className="sound-label">
        MUSIC <em>{isPlaying ? 'ON' : 'OFF'}</em>
      </span>
    </button>
  )
}
