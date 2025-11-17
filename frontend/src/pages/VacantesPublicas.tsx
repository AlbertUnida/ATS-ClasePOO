import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchVacantesPublicas, VacantePublica } from "../api/backend";
import { useAuth } from "../context/AuthContext";

const ESTADO_LABEL: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  abierta: { label: "Abierta", tone: "success" },
  pausada: { label: "Pausada", tone: "warning" },
  cerrada: { label: "Cerrada", tone: "neutral" },
};

const formatoHora = new Intl.DateTimeFormat("es-PY", {
  dateStyle: "medium",
  timeStyle: "short",
});

function VacantesPublicas() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const defaultTenant = user?.tenant ?? "root";

  const [tenant, setTenant] = useState(defaultTenant);
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [buscarTexto, setBuscarTexto] = useState("");
  const [buscarUbicacion, setBuscarUbicacion] = useState("");
  const [estadoSeleccionados, setEstadoSeleccionados] = useState<string[]>(["abierta"]);
  const [soloPublicas, setSoloPublicas] = useState(true);

  const handleSearch = async (event?: FormEvent, slug?: string) => {
    event?.preventDefault();
    const targetSlug = (slug ?? tenant).trim();
    if (!targetSlug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVacantesPublicas(targetSlug);
      setVacantes(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron obtener las vacantes públicas.");
      setVacantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTenant(defaultTenant);
    void handleSearch(undefined, defaultTenant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTenant]);

  const toggleEstado = (estado: string) => {
    setEstadoSeleccionados((prev) =>
      prev.includes(estado) ? prev.filter((value) => value !== estado) : [...prev, estado],
    );
  };

  const metrics = useMemo(() => {
    const abiertas = vacantes.filter((item) => item.estado.toLowerCase() === "abierta").length;
    const pausadas = vacantes.filter((item) => item.estado.toLowerCase() === "pausada").length;
    return [
      { label: "Total", value: vacantes.length, tone: "neutral" as const },
      { label: "Abiertas", value: abiertas, tone: "success" as const },
      { label: "Pausadas", value: pausadas, tone: "warning" as const },
    ];
  }, [vacantes]);

  const vacantesFiltradas = useMemo(() => {
    return vacantes.filter((vacante) => {
      if (soloPublicas && vacante.visibilidad?.toLowerCase() !== "publica") return false;
      if (estadoSeleccionados.length && !estadoSeleccionados.includes(vacante.estado.toLowerCase())) return false;
      if (buscarTexto.trim()) {
        const serie = `${vacante.cargo?.nombre ?? ""} ${vacante.resumen ?? ""}`.toLowerCase();
        if (!serie.includes(buscarTexto.toLowerCase().trim())) return false;
      }
      if (buscarUbicacion.trim()) {
        const serie = `${vacante.ubicacion ?? ""} ${vacante.tenant?.name ?? ""}`.toLowerCase();
        if (!serie.includes(buscarUbicacion.toLowerCase().trim())) return false;
      }
      return true;
    });
  }, [vacantes, soloPublicas, estadoSeleccionados, buscarTexto, buscarUbicacion]);

  return (
    <div className="card vacantes-shell">
      <header className="vacantes-header">
        <div>
          <p className="pill pill--accent">Catálogo externo</p>
          <h2>Vacantes públicas</h2>
          <p className="text-muted">
            Explora las vacantes visibles para candidatos externos. Ajusta filtros y consulta el endpoint{" "}
            <code>GET /vacantes/publicas</code>.
          </p>
        </div>
        <form className="vacantes-form" onSubmit={handleSearch}>
          <label>
            Tenant (slug)
            {isSuperAdmin ? (
              <input value={tenant} onChange={(event) => setTenant(event.target.value)} placeholder="ej. tecnoedil" />
            ) : (
              <input value={tenant} readOnly />
            )}
          </label>
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? "Buscando..." : "Refrescar"}
          </button>
        </form>
      </header>

      {isSuperAdmin && (
        <div className="vacantes-suggestions">
          <span>Atajos rapidos:</span>
          <button
            type="button"
            className={`chip ${tenant === "root" ? "chip--active" : ""}`}
            onClick={() => handleSearch(undefined, "root")}
          >
            Root (global)
          </button>
        </div>
      )}

      <section className="mini-metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className={`mini-metric mini-metric--${metric.tone}`}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
        {lastUpdated && (
          <article className="mini-metric mini-metric--neutral">
            <p>Última actualización</p>
            <strong>{formatoHora.format(lastUpdated)}</strong>
          </article>
        )}
      </section>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="vacantes-publicas">
        <aside className="vacantes-publicas__filters">
          <h4>Filtros</h4>
          <div className="filter-group">
            <label>Estado</label>
            {["abierta", "pausada", "cerrada"].map((estado) => (
              <label key={estado} className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={estadoSeleccionados.includes(estado)}
                  onChange={() => toggleEstado(estado)}
                />
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <label>Visibilidad</label>
            <label className="checkbox-inline">
              <input type="checkbox" checked={soloPublicas} onChange={() => setSoloPublicas(!soloPublicas)} />
              Solo públicas
            </label>
          </div>
        </aside>

        <section className="vacantes-publicas__lista">
          <form className="vacantes-toolbar" onSubmit={handleSearch}>
            <div>
              <label htmlFor="searchText">¿Qué puesto?</label>
              <input
                id="searchText"
                placeholder="Cargo o palabra clave"
                value={buscarTexto}
                onChange={(event) => setBuscarTexto(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="searchLocation">¿Dónde?</label>
              <input
                id="searchLocation"
                placeholder="Ciudad, país..."
                value={buscarUbicacion}
                onChange={(event) => setBuscarUbicacion(event.target.value)}
              />
            </div>
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? "Filtrando..." : "Buscar"}
            </button>
          </form>

          {loading && (
            <div className="vacantes-skeleton">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton-card">
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-line--short" />
                </div>
              ))}
            </div>
          )}

          {!loading && vacantesFiltradas.length === 0 && (
            <div className="empty-state">
              <h3>No hay vacantes que cumplan los filtros</h3>
              <p>Prueba con otra búsqueda o verifica que el tenant tenga vacantes abiertas.</p>
            </div>
          )}

          {!loading && vacantesFiltradas.length > 0 && (
            <table className="vacantes-table">
              <thead>
                <tr>
                  <th>Cargo</th>
                  <th>Ubicación</th>
                  <th>Tipo de contrato</th>
                  <th>Estado</th>
                  <th>Visibilidad</th>
                </tr>
              </thead>
              <tbody>
                {vacantesFiltradas.map((vacante) => (
                  <tr key={vacante.id}>
                    <td>
                      <strong>{vacante.cargo?.nombre ?? "Cargo sin nombre"}</strong>
                      <p className="text-muted">{vacante.resumen ?? "Sin resumen disponible"}</p>
                    </td>
                    <td>{vacante.ubicacion ?? "Sin ubicación"}</td>
                    <td>{vacante.tipoContrato ?? "No informado"}</td>
                    <td>
                      <span className={`status-chip status-chip--${ESTADO_LABEL[vacante.estado]?.tone ?? "neutral"}`}>
                        {ESTADO_LABEL[vacante.estado]?.label ?? vacante.estado}
                      </span>
                    </td>
                    <td>{vacante.visibilidad ?? "PUBLICA"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default VacantesPublicas;
