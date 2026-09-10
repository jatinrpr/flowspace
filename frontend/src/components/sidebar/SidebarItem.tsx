interface SidebarItemProps {
  label: string
  icon?: string
  active?: boolean
}

export function SidebarItem({ label, icon, active = false }: SidebarItemProps) {
  return (
    <li>
      <button
        className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm transition ${
          active
            ? 'bg-violet-500 text-white'
            : 'text-violet-100 hover:bg-violet-800/70'
        }`}
        type="button"
      >
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </button>
    </li>
  )
}
