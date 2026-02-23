import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ContactModalProvider } from './contexts/ContactModalContext';
import Layout from './components/Layout';
import ContactModal from './components/ContactModal';
import { useContactModal } from './contexts/ContactModalContext';

const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDatabase = lazy(() => import('./pages/AdminDatabase'));
const EmailLogs = lazy(() => import('./pages/admin/EmailLogs'));
const Profile = lazy(() => import('./pages/Profile'));
const APIKeys = lazy(() => import('./pages/APIKeys'));
const Docs = lazy(() => import('./pages/Docs'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Contact = lazy(() => import('./pages/Contact'));
const UseCases = lazy(() => import('./pages/UseCases'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Router>
      <Suspense
        fallback={
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando página...</p>
          </div>
        }
      >
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />
          <Route
            path="/pricing"
            element={<Pricing />}
          />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/casos-de-uso" element={<UseCases />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/api" element={<Docs />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="api-keys" element={<APIKeys />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="docs" element={<Docs />} />
            <Route path="admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/etl" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/database" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDatabase />
              </ProtectedRoute>
            } />
            <Route path="admin/email-logs" element={
              <ProtectedRoute adminOnly={true}>
                <EmailLogs />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function AppWithModals() {
  return (
    <AppRoutes />
  );
}

function App() {
  return (
    <ContactModalProvider>
      <AuthProvider>
        <AppWithModals />
        <ContactModalContent />
      </AuthProvider>
    </ContactModalProvider>
  );
}

function ContactModalContent() {
  const { isOpen, setIsOpen } = useContactModal();
  return <ContactModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}

export default App;