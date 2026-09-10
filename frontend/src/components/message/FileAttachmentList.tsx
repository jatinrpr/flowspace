import type { FileAttachment } from '../../store/messageStore'
import { File, Image, Download } from 'lucide-react'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

export function FileAttachmentList({ files }: { files: FileAttachment[] }) {
  if (!files || files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map(file => {
        const isImage = IMAGE_TYPES.includes(file.mimeType)
        const isVideo = VIDEO_TYPES.includes(file.mimeType) || file.mimeType.startsWith('video/')
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
        
        const backendBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000'
        const fullUrl = file.url.startsWith('http') ? file.url : `${backendBaseUrl}${file.url}`

        return (
          <div key={file.id} className="border border-slate-200 dark:border-slate-700 rounded p-2 flex flex-col gap-2 max-w-sm">
            {isImage ? (
              <a href={fullUrl} target="_blank" rel="noreferrer">
                <img src={fullUrl} alt={file.originalName} className="max-h-48 max-w-full rounded object-contain bg-slate-100 dark:bg-slate-800" />
              </a>
            ) : isVideo ? (
              <video src={fullUrl} controls className="max-h-48 max-w-full rounded bg-black" />
            ) : null}
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                {isImage ? <Image size={16} /> : <File size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate" title={file.originalName}>
                  {file.originalName}
                </div>
                <div className="text-xs text-slate-500">{sizeMb} MB</div>
              </div>
              <a 
                href={fullUrl} 
                download={file.originalName}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Download"
              >
                <Download size={16} />
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
