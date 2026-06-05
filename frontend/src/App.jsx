import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';

import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CandidateListPage from './pages/candidates/CandidateListPage';
import CandidateProfilePage from './pages/candidates/CandidateProfilePage';
import AddCandidatePage from './pages/candidates/AddCandidatePage';
import RecruitmentPage from './pages/recruitment/RecruitmentPage';
import TrainingPage from './pages/training/TrainingPage';
import MarketingPage from './pages/marketing/MarketingPage';
import InterviewsPage from './pages/interviews/InterviewsPage';
import PlacementPage from './pages/placement/PlacementPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AdminPage from './pages/admin/AdminPage';
import UsersPage from './pages/admin/UsersPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="candidates" element={<CandidateListPage />} />
            <Route path="candidates/add" element={<AddCandidatePage />} />
            <Route path="candidates/:id" element={<CandidateProfilePage />} />
            <Route path="recruitment" element={<RecruitmentPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="placement" element={<PlacementPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="admin/settings" element={<AdminPage />} />
            <Route path="admin/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
