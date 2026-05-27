import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './layout/AppShell'
import { CalendarPage } from './pages/CalendarPage'
import { ContactDetailPage } from './pages/ContactDetailPage'
import { CrmPage } from './pages/CrmPage'
import { LoginPage } from './pages/LoginPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { RecordingReviewPage } from './pages/RecordingReviewPage'
import { RecordingsNewPage } from './pages/RecordingsNewPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Navigate to="/calendar" replace />} />
        <Route path="/recordings/new" element={<RecordingsNewPage />} />
        <Route path="/recordings/:recordingId/review" element={<RecordingReviewPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/properties" element={<Navigate to="/crm" replace />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        <Route path="/contacts" element={<Navigate to="/crm" replace />} />
        <Route path="/contacts/:contactId" element={<ContactDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/recordings/new" replace />} />
    </Routes>
  )
}
