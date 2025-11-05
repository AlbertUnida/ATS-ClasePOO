import { FormEvent, useMemo, useState } from "react";
import { fetchVacantesPublicas, VacantePublica } from "../api/backend";

const TENANT_SUGGESTIONS = [
  { slug: "mamapan", label: "MAMAPAN" },
  { slug: "tecnoedil", label: "Tecnoedil" },
  { slug: "root", label: "Root (plantilla global)" },
];

const ESTADO_COLORS: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  abierta: { label: "Abierta", tone: "success" },
  pausada: { label: "Pausada", tone: "warning" },
  cerrada: { label: "Cerrada", tone: "neutral" },
};

const formatoHora = new Intl.DateTimeFormat("es-PY", {
  dateStyle: "medium",
  timeStyle: "short",
});

function estadoBadge(estado: string) {
  const base = ESTADO_COLORS[estado.toLowerCase()] ?? ESTADO_COLORS.neutral;
  return base;
}

function VacantesPublicas() {
  const [tenant, setTenant] = useState("mamapan");
  const [loading, setLoading] = useState(false);
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const metrics = useMemo(() => {
    if (!vacantes.length) {
      return [
        { label: "Total", value: 0, tone: "neutral" as const },
        { label: "Abiertas", value: 0, tone: "success" as const },
        { label: "Pausadas", value: 0, tone: "warning" as const },
      ];
    }
    const abiertas = vacantes.filter((item) => item.estado.toLowerCase() === "abierta").length;
    const pausadas = vacantes.filter((item) => item.estado.toLowerCase() === "pausada").length;
    return [
      { label: "Total", value: vacantes.length, tone: "neutral" as const },
      { label: "Abiertas", value: abiertas, tone: "success" as const },
      { label: "Pausadas", value: pausadas, tone: "warning" as const },
    ];
  }, [vacantes]);

  const handleSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!tenant.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchVacantesPublicas(tenant.trim());
      setVacantes(data);
      setLastUpdated(new Date());
    } catch (err) {
      setVacantes([]);
      setError(err instanceof Error ? err.message : "No se pudieron obtener las vacantes publicas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (slug: string) => {
    setTenant(slug);
    void handleSearch();
  };

  return (
    <div className="card vacantes-shell">
      <header className="vacantes-header">
        <div>
          <p className="pill pill--accent">Catalogo externo</p>
          <h2>Vacantes publicas</h2>
          <p className="text-muted">
            Explora las vacantes visibles para candidatos externos. Selecciona el tenant y consulta el endpoint{" "}
            <code>GET /vacantes/publicas</code>.
          </p>
        </div>
        <form className="vacantes-form" onSubmit={handleSearch}>
          <label>
            Tenant (slug)
            <input
              value={tenant}
              onChange={(event) => setTenant(event.target.value)}
              placeholder="ej. mamapan"
              required
            />
          </label>
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? "Buscando..." : "Buscar vacantes"}
          </button>
        </form>
      </header>

      <div className="vacantes-suggestions">
        <span>Atajos rapidos:</span>
        {TENANT_SUGGESTIONS.map((item) => (
          <button
            key={item.slug}
            type="button"
            className={`chip ${tenant === item.slug ? "chip--active" : ""}`}
            onClick={() => handleSuggestion(item.slug)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="mini-metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className={`mini-metric mini-metric--${metric.tone}`}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
        {lastUpdated && (
          <article className="mini-metric mini-metric--neutral">
            <p>Ultima actualizacion</p>
            <strong>{formatoHora.format(lastUpdated)}</strong>
          </article>
        )}
      </section>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="vacantes-grid">
        {loading && (
          <div className="vacantes-skeleton">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-line skeleton-line--short" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-line--short" />
              </div>
            ))}
          </div>
        )}

        {!loading && vacantes.length > 0 && (
          <div className="vacantes-grid">
            {vacantes.map((vacante) => {
              const estadoInfo = estadoBadge(vacante.estado);
              const imageSrc = resolveAssetUrl(vacante.imagenUrl);
              return (
                <article key={vacante.id} className="vacante-card">
                  {imageSrc && (
                    <div className="vacante-card__image">
                      <img src={imageSrc} alt={`Imagen de ${vacante.cargo?.nombre ?? "vacante"}`} />
                    </div>
                  )}
                  <header>
                    <div>
                      <p className="vacante-card__tenant">{vacante.tenant?.name ?? vacante.tenant?.slug}</p>
                      <h3>{vacante.cargo?.nombre ?? "Cargo sin nombre"}</h3>
                    </div>
                    <span className={`status-chip status-chip--${estadoInfo.tone}`}>{estadoInfo.label}</span>
                  </header>
                  <p className="vacante-card__summary">
                    {vacante.resumen ?? "Esta vacante aun no tiene un resumen cargado para candidatos externos."}
                  </p>
                  <dl className="vacante-card__meta">
                    <div>
                      <dt>Slug publico</dt>
                      <dd>{vacante.publicSlug ?? "Sin slug registrado"}</dd>
                    </div>
                    <div>
                      <dt>Visibilidad</dt>
                      <dd>{vacante.visibilidad ?? "No especificada"}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {!loading && !error && vacantes.length === 0 && (
        <div className="empty-state">
          <h3>No hay vacantes publicas para mostrar</h3>
          <p>
            Revisa que el tenant tenga vacantes activas con visibilidad publica o prueba con otro slug de la lista
            superior.
          </p>
        </div>
      )}
    </div>
  );
}

export default VacantesPublicas;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4050";

const resolveAssetUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
};
