import { useEffect, useRef } from 'react'
import { Mic, MicOff, Monitor, VideoOff } from 'lucide-react'
import type { HuddleParticipant } from '../../store/huddleStore'

interface VideoTileProps {
  participant: HuddleParticipant
  isMe: boolean
  stream?: MediaStream
  localVideoTrack?: MediaStreamTrack | null
  isMuted: boolean
  isSpeaking: boolean
  isFocusedScreen?: boolean
}

export function VideoTile({
  participant,
  isMe,
  stream,
  localVideoTrack,
  isMuted,
  isSpeaking,
  isFocusedScreen
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const cameraActive = isMe
    ? !!localVideoTrack && localVideoTrack.readyState === 'live'
    : !!participant.cameraEnabled || !!participant.screenSharing

  useEffect(() => {
    if (!videoRef.current) return

    if (isMe && localVideoTrack) {
      const localStream = new MediaStream([localVideoTrack])
      videoRef.current.srcObject = localStream
    } else if (!isMe && stream) {
      videoRef.current.srcObject = stream
    } else {
      videoRef.current.srcObject = null
    }
  }, [isMe, localVideoTrack, stream, cameraActive])

  return (
    <div className={`relative flex flex-col items-center justify-center bg-slate-900 rounded-xl overflow-hidden shadow-lg border transition-all duration-300 ${
      isFocusedScreen ? 'w-full h-full min-h-[350px]' : 'w-full h-full aspect-video'
    } ${
      isSpeaking ? 'ring-4 ring-green-500 border-green-500' : 'border-slate-800'
    }`}>
      {/* Video stream or Avatar fallback */}
      {cameraActive ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMe} // Avoid local audio feedback
          className={`w-full h-full object-cover ${participant.screenSharing ? 'object-contain bg-black' : ''} ${isMe && !participant.screenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-850 p-4">
          <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-md overflow-hidden mb-2">
            {participant.avatarUrl ? (
              <img src={participant.avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
            ) : (
              participant.name.charAt(0).toUpperCase()
            )}
          </div>
          <VideoOff size={20} className="text-slate-500 mt-1" />
        </div>
      )}

      {/* Participant Badges (Bottom Left & Right) */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Name Badge */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-xs font-medium text-white border border-slate-700/50">
          {participant.screenSharing && <Monitor size={12} className="text-blue-400 animate-pulse" />}
          <span className="truncate max-w-[120px]">{isMe ? 'You' : participant.name}</span>
          {participant.screenSharing && <span className="text-[10px] text-blue-300 font-semibold">(Sharing)</span>}
        </div>

        {/* Audio / Mic Badge */}
        <div className={`p-1.5 rounded-md backdrop-blur border text-xs ${
          isMuted
            ? 'bg-red-950/80 text-red-400 border-red-800/60'
            : isSpeaking
            ? 'bg-green-950/80 text-green-400 border-green-700/60 animate-pulse'
            : 'bg-slate-950/80 text-slate-400 border-slate-700/50'
        }`}>
          {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </div>
      </div>
    </div>
  )
}
