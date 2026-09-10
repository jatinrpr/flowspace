import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Maximize2, Minimize2 } from 'lucide-react'
import { useHuddleStore } from '../../store/huddleStore'

export function HuddleControls() {
  const {
    isMuted,
    cameraEnabled,
    screenSharing,
    isExpanded,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    setExpanded,
    leaveHuddle
  } = useHuddleStore()

  return (
    <div className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 border-t border-slate-800 rounded-b-2xl shadow-2xl">
      {/* Microphone Toggle */}
      <button
        onClick={toggleMute}
        title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200 ${
          isMuted
            ? 'bg-red-900/40 text-red-400 border border-red-700/50 hover:bg-red-900/60'
            : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
        }`}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        <span className="text-[10px] font-medium">{isMuted ? 'Muted' : 'Mute'}</span>
      </button>

      {/* Camera Toggle */}
      <button
        onClick={toggleCamera}
        title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200 ${
          cameraEnabled
            ? 'bg-violet-600 text-white border border-violet-500 hover:bg-violet-500 shadow-md shadow-violet-900/40'
            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
        }`}
      >
        {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        <span className="text-[10px] font-medium">{cameraEnabled ? 'Camera On' : 'Camera'}</span>
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={toggleScreenShare}
        title={screenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200 ${
          screenSharing
            ? 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 shadow-md shadow-blue-900/40'
            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
        }`}
      >
        <Monitor size={20} />
        <span className="text-[10px] font-medium">{screenSharing ? 'Sharing' : 'Share'}</span>
      </button>

      {/* Expand / Minimize Toggle */}
      <button
        onClick={() => setExpanded(!isExpanded)}
        title={isExpanded ? 'Minimize View' : 'Expand View'}
        className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all duration-200"
      >
        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        <span className="text-[10px] font-medium">{isExpanded ? 'Minimize' : 'Expand'}</span>
      </button>

      {/* Leave Call */}
      <button
        onClick={leaveHuddle}
        title="Leave Huddle"
        className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-red-600 text-white border border-red-500 hover:bg-red-500 shadow-md shadow-red-950/50 transition-all duration-200 ml-2"
      >
        <PhoneOff size={20} />
        <span className="text-[10px] font-medium">Leave</span>
      </button>
    </div>
  )
}
