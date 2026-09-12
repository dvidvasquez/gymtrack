import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { LogPage } from '../pages/LogPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProgressPage } from '../pages/ProgressPage'
import { ScanPage } from '../pages/ScanPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/scan" element={<ScanPage />} />
      <Route path="/log" element={<LogPage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
