import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4050';

function Home() {
  const { user } = useAuth();

  return (
    <div className="card">
      <h2>Bienvenido al panel ATS</h2>
      <p>
        Este frontend es el punto de partida para administrar el ATS multi-tenant. Desde aquí podrás construir las
        pantallas de autenticación, gestión de tenants, vacantes, postulaciones y mucho más.
      </p>

      <div className="grid grid--cols-2" style={{ marginTop: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3>Próximos pasos</h3>
          <ul>
            <li>Configura tu primer superadmin usando Swagger.</li>
            <li>Implementa un flujo de login en esta interfaz.</li>
            <li>Conecta las vistas con el backend usando el cliente API.</li>
          </ul>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3>Recursos útiles</h3>
          <ul>
            <li>
              Backend corriendo en <code>{API_BASE}</code>
            </li>
            <li>
              Documentación de API en{' '}
              <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">
                Swagger
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {!user ? (
          <Link to="/login" className="button">
            Ir a iniciar sesión
          </Link>
        ) : (
          <Link to="/panel" className="button">
            Ir a mi panel privado
          </Link>
        )}
        <Link to="/vacantes" className="button">
          Ver vacantes públicas
        </Link>
      </div>
    </div>
  );
}

export default Home;
