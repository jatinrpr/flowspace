import { useHuddleStore } from '../../store/huddleStore'
import { useAuthStore } from '../../store/authStore'
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Headphones, Maximize2, X } from 'lucide-react'
import { VideoGrid } from './VideoGrid'
import { HuddleControls } from './HuddleControls'

export function HuddlePanel() {
  const {
    activeHuddle,
    isJoined,
    isMuted,
    cameraEnabled,
    screenSharing,
    isExpanded,
    connectionStates,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    setExpanded,
    leaveHuddle
  } = useHuddleStore()
  const { user } = useAuthStore()

  if (!isJoined || !activeHuddle) return null

  const participants = Object.values(activeHuddle.participants)
  const isVideoOrShareActive = cameraEnabled || screenSharing || participants.some(p => p.cameraEnabled || p.screenSharing)

  // Expanded Video Call Modal View
  if (isExpanded || isVideoOrShareActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <div className="flex flex-col w-full max-w-6xl h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                <Headphones size={16} className="text-green-400 animate-pulse" />
                <span className="text-sm font-semibold text-white">Huddle Call</span>
              </div>
              <span className="text-xs text-slate-400">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Minimize / Close Header Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(false)}
                title="Minimize Video Call"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Center Main Video Grid */}
          <div className="flex-1 min-h-0 bg-slate-950 overflow-hidden relative">
            <VideoGrid />
          </div>

          {/* Bottom Floating Control Bar */}
          <HuddleControls />
        </div>
      </div>
    )
  }

  // Minimized Floating Bar (Bottom Left)
  return (
    <div className="fixed bottom-4 left-72 z-50 w-80 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Headphones size={16} className="text-green-400 animate-pulse" />
          <span className="font-semibold text-sm">Huddle</span>
          <span className="text-xs text-slate-400">({participants.length})</span>
        </div>
        <button
          onClick={() => setExpanded(true)}
          title="Expand Video Call"
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Mini Participants List */}
      <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
        {participants.map(p => {
          const isMe = p.userId === user?.id
          const connState = isMe ? 'connected' : (connectionStates[p.userId] ?? 'connecting')
          const participantMuted = isMe ? isMuted : p.muted

          return (
            <div
              key={p.userId}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                p.speaking ? 'bg-green-900/40 ring-1 ring-green-500/50' : 'bg-slate-800'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold overflow-hidden bg-violet-600 ${
                  p.speaking ? 'ring-2 ring-green-400' : ''
                }`}>
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{isMe ? 'You' : p.name}</p>
                {!isMe && connState !== 'connected' && connState !== 'new' && (
                  <p className="text-[10px] text-yellow-400 capitalize">{connState}</p>
                )}
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5">
                {p.screenSharing && <Monitor size={12} className="text-blue-400 animate-pulse" />}
                {p.cameraEnabled && <Video size={12} className="text-violet-400" />}
                {participantMuted ? (
                  <MicOff size={12} className="text-red-400" />
                ) : (
                  <Mic size={12} className="text-green-400" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mini Controls Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-slate-700 bg-slate-800 justify-between">
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
            isMuted ? 'bg-red-600/20 text-red-400' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </button>

        <button
          onClick={toggleCamera}
          title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
            cameraEnabled ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          {cameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
        </button>

        <button
          onClick={toggleScreenShare}
          title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
            screenSharing ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          <Monitor size={14} />
        </button>

        <button
          onClick={leaveHuddle}
          title="Leave Huddle"
          className="p-2 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors ml-auto"
        >
          <PhoneOff size={14} />
        </button>
      </div>
    </div>
  )
}

