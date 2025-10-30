import { useMemo, useState } from 'react';
import { fetchVacantesPublicas, VacantePublica } from '../api/backend';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [error, setError] = useState<string | null>(null);

  const tenantSlug = useMemo(() => user?.tenant ?? '', [user]);

  const handleLoadVacantes = async () => {
    if (!tenantSlug) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchVacantesPublicas(tenantSlug);
      setVacantes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setVacantes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Panel del usuario</h2>
      {user ? (
        <>
          <p>
            Actualmente conectado como <strong>{user.email}</strong>. Rol principal:{' '}
            <strong>{user.roles.join(', ') || 'Sin roles'}</strong>. Tenant:{' '}
            <strong>{user.tenant}</strong>.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button type="button" className="button" onClick={handleLoadVacantes} disabled={loading}>
              {loading ? 'Cargando...' : 'Ver vacantes de mi tenant'}
            </button>
            <button type="button" className="button button--small" onClick={logout}>
              Cerrar sesión
            </button>
          </div>

          {error && <div className="alert alert--error">{error}</div>}
          {!!vacantes.length && (
            <div className="vacantes-list" style={{ marginTop: '1.5rem' }}>
              {vacantes.map((vacante) => (
                <article key={vacante.id} className="vacante-item">
                  <h3>{vacante.cargo?.nombre ?? 'Cargo sin nombre'}</h3>
                  <p>Estado: {vacante.estado.toUpperCase()}</p>
                  {vacante.resumen && <p>{vacante.resumen}</p>}
                </article>
              ))}
            </div>
          )}
          {!loading && !error && !vacantes.length && (
            <p style={{ marginTop: '1.25rem', color: 'rgba(148, 163, 184, 0.9)' }}>
              Aún no hay vacantes cargadas o no se han consultado.
            </p>
          )}
        </>
      ) : (
        <p>Necesitas iniciar sesión para ver esta información.</p>
      )}
    </section>
  );
}

export default Dashboard;
