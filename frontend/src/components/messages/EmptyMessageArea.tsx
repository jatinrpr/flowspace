export function EmptyMessageArea() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 text-center">
      <div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          No messages yet
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Start the conversation in #general.
        </p>
      </div>
    </div>
  )
}
