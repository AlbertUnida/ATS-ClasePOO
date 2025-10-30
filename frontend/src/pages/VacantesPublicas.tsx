import { FormEvent, useState } from 'react';
import { fetchVacantesPublicas, VacantePublica } from '../api/backend';

function VacantesPublicas() {
  const [tenant, setTenant] = useState('root');
  const [loading, setLoading] = useState(false);
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchVacantesPublicas(tenant);
      setVacantes(data);
    } catch (err) {
      setVacantes([]);
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Vacantes públicas</h2>
      <p>
        Consulta las vacantes abiertas de un tenant enviando la consulta al endpoint <code>GET /vacantes/publicas</code>.
      </p>

      <form className="form" onSubmit={handleSearch}>
        <label>
          Tenant (slug)
          <input
            value={tenant}
            onChange={(event) => setTenant(event.target.value)}
            placeholder="ej: tecnoedil"
            required
          />
        </label>
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar vacantes'}
        </button>
      </form>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="vacantes-list">
        {vacantes.map((vacante) => (
          <article key={vacante.id} className="vacante-item">
            <h3>{vacante.cargo?.nombre ?? 'Cargo sin nombre'}</h3>
            <p>
              Tenant: <strong>{vacante.tenant?.name ?? vacante.tenant?.slug}</strong>
            </p>
            <p>Estado: {vacante.estado.toUpperCase()}</p>
            {vacante.resumen && <p>{vacante.resumen}</p>}
          </article>
        ))}
      </div>

      {!loading && !error && vacantes.length === 0 && (
        <p style={{ marginTop: '1rem', color: 'rgba(148, 163, 184, 0.85)' }}>Sin vacantes para mostrar.</p>
      )}
    </section>
  );
}

export default VacantesPublicas;
