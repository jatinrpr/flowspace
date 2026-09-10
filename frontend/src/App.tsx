import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthInitializer } from './components/auth/AuthInitializer'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { WorkspaceLayout } from './layouts/WorkspaceLayout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

import { CreateWorkspacePage } from './pages/workspace/CreateWorkspacePage'
import { JoinWorkspacePage } from './pages/workspace/JoinWorkspacePage'

import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminMembersPage } from './pages/admin/AdminMembersPage'
import { AdminChannelsPage } from './pages/admin/AdminChannelsPage'
import { AdminInvitationsPage } from './pages/admin/AdminInvitationsPage'
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'

export default function App() {
  return (
    <>
      <AuthInitializer />
      <Routes>
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/workspace/create" element={<CreateWorkspacePage />} />

          <Route path="/workspace/:workspaceId/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="channels" element={<AdminChannelsPage />} />
            <Route path="invitations" element={<AdminInvitationsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="/workspace/*" element={<WorkspaceLayout />} />
          <Route path="/workspace/:workspaceId/*" element={<WorkspaceLayout />} />
          <Route path="/invite/:token" element={<JoinWorkspacePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </>
  )
}
