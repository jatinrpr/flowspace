import { useEffect } from 'react'
import { useParams, useNavigate, Routes, Route } from 'react-router-dom'
import { useWorkspaceStore } from '../store/workspaceStore'
import { WorkspaceSidebar } from '../components/sidebar/WorkspaceSidebar'
import { NotificationPanel } from '../components/sidebar/NotificationPanel'
import { HuddlePanel } from '../components/huddle/HuddlePanel'

import { WorkspaceSettingsPage } from '../pages/workspace/WorkspaceSettingsPage'
import { WorkspaceMembersPage } from '../pages/workspace/WorkspaceMembersPage'
import { InviteMemberPage } from '../pages/workspace/InviteMemberPage'

import { CreateChannelPage } from '../pages/channel/CreateChannelPage'
import { ChannelPage } from '../pages/channel/ChannelPage'
import { ChannelSettingsPage } from '../pages/channel/ChannelSettingsPage'
import { ChannelMembersPage } from '../pages/channel/ChannelMembersPage'
import { CreateDirectMessagePage } from '../pages/dm/CreateDirectMessagePage'
import { DirectMessagePage } from '../pages/dm/DirectMessagePage'
import { SearchPage } from '../pages/search/SearchPage'

function WorkspaceHome() {
  const { currentWorkspace } = useWorkspaceStore()
  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white items-center justify-center">
      <h2 className="text-xl font-semibold mb-2">Welcome to {currentWorkspace?.name}</h2>
      <p className="text-slate-500">Select a channel or direct message to get started.</p>
    </div>
  )
}

export function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  
  const { 
    workspaces, 
    currentWorkspaceId,
    fetchWorkspaces, 
    selectWorkspace,
    isLoading
  } = useWorkspaceStore()

  // Initial fetch of workspaces
  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  // Select workspace when URL changes
  useEffect(() => {
    if (workspaceId && workspaceId !== currentWorkspaceId) {
      selectWorkspace(workspaceId).catch(() => navigate('/workspace/create'))
    } else if (!workspaceId && workspaces.length > 0) {
      navigate(`/workspace/${workspaces[0].id}`, { replace: true })
    } else if (!workspaceId && workspaces.length === 0 && !isLoading) {
      navigate('/workspace/create', { replace: true })
    }
  }, [workspaceId, currentWorkspaceId, workspaces, isLoading, navigate, selectWorkspace])

  if (isLoading && !workspaces.length) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading workspaces...</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <WorkspaceSidebar />
      <NotificationPanel />
      <HuddlePanel />
      <main className="flex min-w-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<WorkspaceHome />} />
          <Route path="settings" element={<WorkspaceSettingsPage />} />
          <Route path="members" element={<WorkspaceMembersPage />} />
          <Route path="invite" element={<InviteMemberPage />} />
          
          <Route path="channel/new" element={<CreateChannelPage />} />
          <Route path="channel/:channelId" element={<ChannelPage />} />
          <Route path="channel/:channelId/settings" element={<ChannelSettingsPage />} />
          <Route path="channel/:channelId/members" element={<ChannelMembersPage />} />
          
          <Route path="dm/new" element={<CreateDirectMessagePage />} />
          <Route path="dm/:conversationId" element={<DirectMessagePage />} />

          <Route path="search" element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  )
}
