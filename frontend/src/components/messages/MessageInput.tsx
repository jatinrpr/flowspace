export function MessageInput() {
  return (
    <form
      className="border-t border-slate-200 p-4 dark:border-slate-800"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="sr-only" htmlFor="message">
        Message #general
      </label>
      <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-violet-500 dark:border-slate-700 dark:bg-slate-900">
        <input
          id="message"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          placeholder="Message #general"
        />
        <button
          className="ml-2 text-lg text-slate-400 hover:text-violet-500"
          type="button"
          aria-label="Add emoji"
        >
          ☺
        </button>
      </div>
    </form>
  )
}
