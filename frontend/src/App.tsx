import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import VacantesPublicas from './pages/VacantesPublicas';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';
import Tenants from './pages/Tenants';
import Users from './pages/Users';
import VacantesTenant from './pages/VacantesTenant';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const hasRole = (role: string) => user?.roles?.includes(role);

  return (
    <div className="layout">
      <header className="layout__header">
        <h1>ATS de Reclutamiento</h1>
        <nav>
          <NavLink to="/" end>
            Inicio
          </NavLink>
          {!user && <NavLink to="/login">Iniciar sesión</NavLink>}
          <NavLink to="/vacantes">Vacantes públicas</NavLink>
          {user && <NavLink to="/panel">Mi tablero</NavLink>}
          {user && (user.isSuperAdmin || hasRole('RECLUTADOR') || hasRole('ADMIN')) && (
            <NavLink to="/vacantes/tenant">Vacantes internas</NavLink>
          )}
          {user?.isSuperAdmin && <NavLink to="/tenants">Tenants</NavLink>}
          {user && (user.isSuperAdmin || hasRole('ADMIN')) && <NavLink to="/usuarios">Usuarios</NavLink>}
        </nav>
        {user && (
          <div className="layout__user">
            <span>
              Conectado como <strong>{user.email}</strong> ({user.tenant}) · Roles: {user.roles.join(', ') || 'N/A'}
            </span>
            <button type="button" className="button button--small" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      <main className="layout__main">{children}</main>
      <footer className="layout__footer">
        Backend: <code>http://localhost:4050</code> · Frontend con Vite + React
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/vacantes"
          element={
            <Layout>
              <VacantesPublicas />
            </Layout>
          }
        />
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vacantes/tenant"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECLUTADOR']}>
              <Layout>
                <VacantesTenant />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants"
          element={
            <ProtectedRoute onlySuperAdmin>
              <Layout>
                <Tenants />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  onlySuperAdmin?: boolean;
}

function ProtectedRoute({ children, allowedRoles, onlySuperAdmin }: ProtectedRouteProps) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="layout__main" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (onlySuperAdmin && !user.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !user.isSuperAdmin) {
    const hasAllowedRole = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasAllowedRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export default App;
