import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RequireAuth } from '../components/RequireAuth'
import { RequireOwner } from '../components/RequireOwner'
import { RequireProfile } from '../components/RequireProfile'
import { EditExercisePage } from '../pages/EditExercisePage'
import { EditLogEntryPage } from '../pages/EditLogEntryPage'
import { ExercisesPage } from '../pages/ExercisesPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { LogByExercisePage } from '../pages/LogByExercisePage'
import { LogEntryPage } from '../pages/LogEntryPage'
import { LogPage } from '../pages/LogPage'
import { NewExercisePage } from '../pages/NewExercisePage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfilePage } from '../pages/ProfilePage'
import { lazyPage } from './lazyPage'

// Las dos páginas con librerías pesadas se cargan recién al entrar
// (html5-qrcode en Scan, recharts en Progress): así no forman parte de la
// descarga inicial de la app. Ver router/lazyPage.ts.
const ScanPage = lazyPage(() => import('../pages/ScanPage').then((m) => m.ScanPage))
const ProgressPage = lazyPage(() => import('../pages/ProgressPage').then((m) => m.ProgressPage))

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<RequireProfile />}>
          <Route element={<AppShell />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/log" element={<LogEntryPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/log/:qrCode" element={<LogPage />} />
            <Route path="/log/exercise/:exerciseId" element={<LogByExercisePage />} />
            <Route path="/progress/:exerciseId" element={<ProgressPage />} />
            <Route
              path="/progress/:exerciseId/entries/:entryId/edit"
              element={<EditLogEntryPage />}
            />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route element={<RequireOwner />}>
              <Route path="/exercises/new" element={<NewExercisePage />} />
              <Route path="/exercises/:id/edit" element={<EditExercisePage />} />
            </Route>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
