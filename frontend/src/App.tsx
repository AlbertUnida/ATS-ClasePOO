import type { ReactNode } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import VacantesPublicas from "./pages/VacantesPublicas";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";
import Tenants from "./pages/Tenants";
import Users from "./pages/Users";
import VacantesTenant from "./pages/VacantesTenant";
import CandidatePortal from "./pages/CandidatePortal";
import CandidatesPage from "./pages/Candidates";
import AutomationsPage from "./pages/AutomationsPage";
import InterviewsPage from "./pages/Interviews";
import ReportsPage from "./pages/Reports";
import AdminRolesPage from "./pages/AdminRolesPage";

type NavLinkConfig = {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
  superAdmin?: boolean;
};

const NAV_LINKS: NavLinkConfig[] = [
  { to: "/", label: "Inicio", icon: "IN" },
  { to: "/vacantes", label: "Vacantes publicas", icon: "VP" },
  { to: "/vacantes/tenant", label: "Vacantes internas", icon: "VI", roles: ["ADMIN", "RECLUTADOR"] },
  { to: "/tenants", label: "Tenants", icon: "TN", superAdmin: true },
  { to: "/usuarios", label: "Usuarios", icon: "US", roles: ["ADMIN"] },
  { to: "/candidatos", label: "Candidatos", icon: "CA", roles: ["ADMIN", "RECLUTADOR"] },
  { to: "/roles", label: "Roles y permisos", icon: "RP", roles: ["ADMIN"] },
  { to: "/automatizaciones", label: "Automatizaciones", icon: "AU", roles: ["ADMIN"] },
  { to: "/entrevistas", label: "Entrevistas & feedback", icon: "EF", roles: ["ADMIN", "RECLUTADOR"] },
  { to: "/reportes", label: "Reportes", icon: "RP", roles: ["ADMIN", "RECLUTADOR"] },
  { to: "/postulantes/preview", label: "Postulantes", icon: "PO", roles: ["ADMIN", "RECLUTADOR"] },
];

function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  const hasRole = (role: string) => user?.roles?.includes(role);

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__brand">
          <div className="shell__brand-logo">TF</div>
          <p className="shell__brand-text">Talent Flow ATS</p>
        </div>

        <nav className="shell__nav">
          {NAV_LINKS.map(({ to, label, icon, roles, superAdmin }) => {
            if (!user) return null;
            if (superAdmin && !user.isSuperAdmin) return null;
            if (roles && !user.isSuperAdmin && !roles.some((role) => hasRole(role))) return null;

            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `shell__nav-link${isActive ? " active" : ""}`}
              >
                <span className="shell__nav-icon" aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="shell__sidebar-footer">
          <button type="button" className="shell__logout" onClick={logout}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="shell__workspace">
        <header className="shell__topbar">
          <div>
            <h2>{user?.tenant?.toUpperCase() ?? "SIN TENANT"}</h2>
            <p>Gestiona los procesos de Talent Flow ATS con una experiencia moderna.</p>
          </div>
          <div className="shell__profile">
            <div className="shell__avatar" aria-hidden="true">
              {user?.email?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="shell__profile-name">{user?.email}</p>
              <p className="shell__profile-role">{user?.roles.join(", ") || "Sin roles"}</p>
            </div>
          </div>
        </header>

        <main className="shell__main">{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/postulantes" element={<CandidatePortal />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vacantes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <VacantesPublicas />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vacantes/tenant"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "RECLUTADOR"]}>
              <DashboardLayout>
                <VacantesTenant />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants"
          element={
            <ProtectedRoute onlySuperAdmin>
              <DashboardLayout>
                <Tenants />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardLayout>
                <Users />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidatos"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "RECLUTADOR"]}>
              <DashboardLayout>
                <CandidatesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardLayout>
                <AdminRolesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/automatizaciones"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardLayout>
                <AutomationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/entrevistas"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "RECLUTADOR"]}>
              <DashboardLayout>
                <InterviewsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "RECLUTADOR"]}>
              <DashboardLayout>
                <ReportsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/postulantes/preview"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "RECLUTADOR"]}>
              <DashboardLayout>
                <CandidatePortal preview />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  onlySuperAdmin?: boolean;
}

function ProtectedRoute({ children, allowedRoles, onlySuperAdmin }: ProtectedRouteProps) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="loading-screen">
        <p>Cargando sesion...</p>
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

