import type { MessageMention } from '../../store/messageStore'
import { useAuthStore } from '../../store/authStore'

export function FormattedContent({ content, mentions }: { content: string, mentions?: MessageMention[] }) {
  const { user } = useAuthStore()
  
  if (!mentions || mentions.length === 0) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }

  // Create a regex to match all mentioned names (e.g. "@Jatin")
  const names = mentions.map(m => m.user?.name).filter(Boolean)
  if (names.length === 0) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }
  
  // simple matching
  const regex = new RegExp(`@(${names.join('|')})`, 'g')
  
  const parts = content.split(regex)
  
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        // If part matches a name (since it's a capture group, every odd index is a match)
        if (i % 2 === 1) {
          const mention = mentions.find(m => m.user?.name === part)
          const isMe = mention?.mentionedUserId === user?.id
          return (
            <span 
              key={i} 
              className={`font-semibold px-1 rounded mx-0.5 ${isMe ? 'bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}
            >
              @{part}
            </span>
          )
        }
        return part
      })}
    </span>
  )
}
