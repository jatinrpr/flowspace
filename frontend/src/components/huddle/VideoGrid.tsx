import { useHuddleStore } from '../../store/huddleStore'
import { useAuthStore } from '../../store/authStore'
import { VideoTile } from './VideoTile'

export function VideoGrid() {
  const { activeHuddle, isMuted, isSpeaking, remoteStreams, localVideoTrack } = useHuddleStore()
  const { user } = useAuthStore()

  if (!activeHuddle) return null

  const participants = Object.values(activeHuddle.participants)
  const screenSharer = participants.find(p => p.screenSharing)

  const myUserId = user?.id ?? ''

  if (screenSharer) {
    const isSharerMe = screenSharer.userId === myUserId
    const otherParticipants = participants.filter(p => p.userId !== screenSharer.userId)

    return (
      <div className="flex flex-col md:flex-row h-full w-full gap-4 p-4 overflow-hidden">
        {/* Main Focused Screen Share */}
        <div className="flex-1 h-full min-h-[300px] flex items-center justify-center">
          <VideoTile
            participant={screenSharer}
            isMe={isSharerMe}
            stream={remoteStreams[screenSharer.userId]}
            localVideoTrack={localVideoTrack}
            isMuted={isSharerMe ? isMuted : screenSharer.muted}
            isSpeaking={isSharerMe ? isSpeaking : screenSharer.speaking}
            isFocusedScreen
          />
        </div>

        {/* Side Strip for Participants */}
        {otherParticipants.length > 0 && (
          <div className="w-full md:w-64 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 max-h-48 md:max-h-full">
            {otherParticipants.map(p => {
              const isMe = p.userId === myUserId
              return (
                <div key={p.userId} className="w-44 md:w-full aspect-video shrink-0">
                  <VideoTile
                    participant={p}
                    isMe={isMe}
                    stream={remoteStreams[p.userId]}
                    localVideoTrack={localVideoTrack}
                    isMuted={isMe ? isMuted : p.muted}
                    isSpeaking={isMe ? isSpeaking : p.speaking}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Normal Grid layout
  const count = participants.length
  let gridCols = 'grid-cols-1'
  if (count === 2) gridCols = 'grid-cols-1 sm:grid-cols-2'
  else if (count >= 3 && count <= 4) gridCols = 'grid-cols-1 sm:grid-cols-2'
  else if (count >= 5) gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={`grid ${gridCols} gap-4 p-4 w-full h-full auto-rows-fr overflow-y-auto max-h-full items-center justify-center`}>
      {participants.map(p => {
        const isMe = p.userId === myUserId
        return (
          <div key={p.userId} className="w-full h-full min-h-[200px] flex items-center justify-center">
            <VideoTile
              participant={p}
              isMe={isMe}
              stream={remoteStreams[p.userId]}
              localVideoTrack={localVideoTrack}
              isMuted={isMe ? isMuted : p.muted}
              isSpeaking={isMe ? isSpeaking : p.speaking}
            />
          </div>
        )
      })}
    </div>
  )
}
