import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchReportOverview, type ReportOverview } from "../api/backend";

function ReportsPage() {
  const { user } = useAuth();
  const defaultTenant = user?.tenant ?? "root";
  const [tenant, setTenant] = useState(defaultTenant);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportOverview | null>(null);

  useEffect(() => {
    void loadData();
  }, [tenant]);

  const loadData = async (range?: { from?: string; to?: string }) => {
    if (!tenant) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportOverview({
        tenant,
        from: range?.from,
        to: range?.to,
      });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadData({ from: from || undefined, to: to || undefined });
  };

  const timelineMax = useMemo(() => {
    if (!report) return 0;
    return Math.max(...report.timeline.map((item) => item.total), 1);
  }, [report]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Indicadores</p>
          <h1>Reportes y analíticas</h1>
          <p>Visualiza el desempeño de tus procesos de reclutamiento y detecta oportunidades de mejora.</p>
        </div>
        <form className="inline-form reports-filter" onSubmit={handleFilter}>
          <input
            value={tenant}
            onChange={(event) => setTenant(event.target.value)}
            placeholder="Tenant (slug)"
            required
          />
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <button type="submit" className="button button--ghost" disabled={loading}>
            Aplicar
          </button>
        </form>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="reports-grid">
        <MetricCard title="Vacantes totales" value={report?.totals.vacantes ?? 0} />
        <MetricCard title="Vacantes abiertas" value={report?.totals.vacantesAbiertas ?? 0} tone="info" />
        <MetricCard title="Postulaciones" value={report?.totals.postulaciones ?? 0} tone="accent" />
        <MetricCard title="Candidatos activos" value={report?.totals.candidatos ?? 0} />
        <MetricCard title="Entrevistas próximas" value={report?.totals.entrevistasProximas ?? 0} tone="accent" />
        <MetricCard
          title="Promedio días de contratación"
          value={report?.totals.promedioDiasContratacion ?? 0}
          suffix="días"
          tone="info"
        />
      </section>

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <h2>Postulaciones por estado</h2>
            <p>Distribución actual del funnel.</p>
          </header>
          {loading ? (
            <p className="muted">Cargando...</p>
          ) : (
            <div className="bar-chart">
              {report?.postulacionesPorEstado.map((item) => (
                <div key={item.estado} className="bar-chart__item">
                  <p>{item.estado.toUpperCase()}</p>
                  <div className="bar-chart__bar">
                    <span style={{ width: `${Math.min(100, item.total * 10)}%` }} />
                    <strong>{item.total}</strong>
                  </div>
                </div>
              )) ?? <p className="muted">Sin datos.</p>}
            </div>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Tendencia de postulaciones</h2>
            <p>Últimos 6 meses.</p>
          </header>
          {loading ? (
            <p className="muted">Cargando...</p>
          ) : (
            <div className="timeline-chart">
              {report?.timeline.map((item) => (
                <div key={item.period} className="timeline-chart__item">
                  <div className="timeline-chart__bar">
                    <span style={{ height: `${(item.total / timelineMax) * 100}%` }} />
                  </div>
                  <p>{item.period}</p>
                  <small>{item.total}</small>
                </div>
              )) ?? <p className="muted">Sin datos.</p>}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number;
  suffix?: string;
  tone?: "accent" | "info";
};

function MetricCard({ title, value, suffix, tone }: MetricCardProps) {
  const className = `metric-card${tone ? ` metric-card--${tone}` : ""}`;
  return (
    <article className={className}>
      <p className="metric-card__label">{title}</p>
      <h3>
        {value}
        {suffix ? <small>{suffix}</small> : null}
      </h3>
    </article>
  );
}

export default ReportsPage;
