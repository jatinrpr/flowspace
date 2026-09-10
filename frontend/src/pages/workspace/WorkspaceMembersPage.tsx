import { useEffect } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function WorkspaceMembersPage() {
  const { currentWorkspace, members, fetchMembers, removeMember, isLoading, error } = useWorkspaceStore()

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  if (!currentWorkspace) return null

  const isOwner = currentWorkspace.role === 'OWNER'
  const isAdmin = currentWorkspace.role === 'ADMIN'

  const canRemove = (memberRole: string) => {
    if (isOwner) return memberRole !== 'OWNER'
    if (isAdmin) return memberRole === 'MEMBER'
    return false
  }

  const handleRemove = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember(userId)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Workspace Members</h1>
        
        {error && (
          <div className="mb-6 rounded bg-red-100 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading && members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading members...</td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-100 dark:hover:bg-slate-750">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-violet-600 flex items-center justify-center text-white font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      member.role === 'OWNER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                      member.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canRemove(member.role) && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={isLoading}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
