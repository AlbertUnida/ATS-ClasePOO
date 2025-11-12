import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  CandidateDetail,
  CandidateListItem,
  fetchCandidateDetail,
  fetchCandidates,
  fetchPostulaciones,
  fetchScoringTop,
  type PostulacionItem,
  type ScoringResult,
} from "../api/backend";

const STATUS_COLUMNS = [
  { key: "postulado", label: "Postulados", tone: "neutral" },
  { key: "en_proceso", label: "En proceso", tone: "warning" },
  { key: "descartado", label: "Descartados", tone: "danger" },
  { key: "contratado", label: "Contratados", tone: "success" },
] as const;

function formatDate(value?: string | null) {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEstadoTone(estado: string) {
  const normalized = estado.toLowerCase();
  if (normalized.includes("contrat")) return "success";
  if (normalized.includes("descart")) return "danger";
  if (normalized.includes("entrevista") || normalized.includes("proceso")) return "warning";
  return "neutral";
}

function CandidatesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin;
  const [tenantFilter, setTenantFilter] = useState(user?.tenant ?? "");
  const effectiveTenant = isSuperAdmin ? tenantFilter || user?.tenant || "" : user?.tenant || "";

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [kanbanItems, setKanbanItems] = useState<PostulacionItem[]>([]);
  const [scoring, setScoring] = useState<ScoringResult[]>([]);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingKanban, setLoadingKanban] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [topLimit, setTopLimit] = useState(5);

  useEffect(() => {
    setPage(1);
  }, [effectiveTenant]);

  useEffect(() => {
    if (!effectiveTenant) return;
    void loadCandidates(effectiveTenant, page, searchTerm);
    void loadKanban(effectiveTenant);
    void loadScoring(effectiveTenant, topLimit);
  }, [effectiveTenant, page, searchTerm, topLimit]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    setError(null);
    fetchCandidateDetail(selectedId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el candidato."))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const loadCandidates = async (tenant: string, currentPage: number, search?: string) => {
    setLoadingList(true);
    setError(null);
    try {
      const response = await fetchCandidates({
        tenant,
        page: currentPage,
        limit,
        search: search?.trim() ? search : undefined,
      });
      setCandidates(response.data);
      setTotalPages(response.totalPages);
      const existsInPage = response.data.find((item) => item.id === selectedId);
      if (response.data.length > 0 && !existsInPage) {
        setSelectedId(response.data[0].id);
      } else if (response.data.length === 0) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los candidatos.");
    } finally {
      setLoadingList(false);
    }
  };

  const loadKanban = async (tenant: string) => {
    setLoadingKanban(true);
    setError(null);
    try {
      const data = await fetchPostulaciones({ tenant });
      setKanbanItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el resumen de postulaciones.");
    } finally {
      setLoadingKanban(false);
    }
  };

  const loadScoring = async (tenant: string, top: number) => {
    if (!tenant) return;
    setLoadingScore(true);
    setError(null);
    try {
      const data = await fetchScoringTop(tenant, top);
      setScoring(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el ranking de scoring.");
    } finally {
      setLoadingScore(false);
    }
  };

  const groupedKanban = useMemo(() => {
    const groups: Record<string, PostulacionItem[]> = {
      postulado: [],
      en_proceso: [],
      descartado: [],
      contratado: [],
    };
    kanbanItems.forEach((item) => {
      const key = (item.estado ?? "").toLowerCase();
      if (groups[key]) {
        groups[key].push(item);
      } else {
        groups.postulado.push(item);
      }
    });
    return groups;
  }, [kanbanItems]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  const recentPostulaciones = detail?.postulaciones ?? [];
  const perfilEntries = detail?.perfil && typeof detail.perfil === "object" ? Object.entries(detail.perfil) : [];

  const filteredCandidates = useMemo(() => {
    if (!minScore) return candidates;
    return candidates.filter((item) => (item.score?.puntajeTotal ?? 0) >= minScore);
  }, [candidates, minScore]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Talento</p>
          <h1>Gestión de candidatos</h1>
          <p>Filtra, consulta y da seguimiento a cada postulante con puntajes y estados centralizados.</p>
        </div>
        {isSuperAdmin && (
          <label className="inline-field">
            Tenant (slug)
            <input
              value={tenantFilter}
              onChange={(event) => setTenantFilter(event.target.value)}
              placeholder="root"
            />
          </label>
        )}
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <div>
              <h2>Candidatos registrados</h2>
              <p>Selecciona un registro para ver el detalle completo y su historial.</p>
            </div>
          <form className="inline-form" onSubmit={handleSearchSubmit}>
            <input
              placeholder="Buscar por nombre, correo o teléfono"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit" className="button button--ghost" disabled={loadingList}>
              Buscar
            </button>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Score mínimo"
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
            />
          </form>
          </header>

          {loadingList ? (
            <p className="muted">Cargando candidatos...</p>
          ) : filteredCandidates.length === 0 ? (
            <p className="muted">No hay candidatos registrados con los filtros actuales.</p>
          ) : (
            <div className="table-container candidate-table">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Última actividad</th>
                    <th>Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={selectedId === item.id ? "selected" : ""}
                    >
                      <td>{item.nombre}</td>
                      <td>{item.email}</td>
                      <td>{item.postulaciones?.[0]?.createdAt ? formatDate(item.postulaciones[0].createdAt) : "N/A"}</td>
                      <td>{item.score?.puntajeTotal ? `${item.score.puntajeTotal.toFixed(1)} / 100` : "Sin score"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {candidates.length > 0 && (
            <div className="pagination">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loadingList}
              >
                Anterior
              </button>
              <span>
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || loadingList}
              >
                Siguiente
              </button>
            </div>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <div>
              <h2>Detalle del candidato</h2>
              <p>Información de contacto, CV y puntajes.</p>
            </div>
          </header>

          {loadingDetail ? (
            <p className="muted">Cargando detalle...</p>
          ) : !detail ? (
            <p className="muted">Selecciona un candidato para ver su información.</p>
          ) : (
            <div className="candidate-detail">
              <div className="candidate-detail__header">
                <div>
                  <h3>{detail.nombre}</h3>
                  <p className="muted">{detail.email}</p>
                  {detail.telefono && <p className="muted">{detail.telefono}</p>}
                </div>
                <div className="candidate-score">
                  <p>Puntaje total</p>
                  <strong>{detail.score?.puntajeTotal ? detail.score.puntajeTotal.toFixed(1) : "Sin score"}</strong>
                </div>
              </div>

              <div className="candidate-meta">
                <p>
                  Tenant: <strong>{detail.tenant?.name ?? effectiveTenant ?? "No asignado"}</strong>
                </p>
                {detail.cvUrl && (
                  <p>
                    CV:{" "}
                    <a href={detail.cvUrl} target="_blank" rel="noreferrer">
                      Ver archivo
                    </a>
                  </p>
                )}
              </div>

              {perfilEntries.length > 0 && (
                <div className="candidate-perfil">
                  <p className="muted">Perfil cargado</p>
                  <ul>
                    {perfilEntries.map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {typeof value === "string" ? value : JSON.stringify(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="candidate-postulaciones">
                <h4>Postulaciones recientes</h4>
                {recentPostulaciones.length === 0 ? (
                  <p className="muted">Sin postulaciones registradas.</p>
                ) : (
                  <ul className="candidate-postulaciones__list">
                    {recentPostulaciones.slice(0, 4).map((postulacion) => (
                      <li key={postulacion.id}>
                        <div>
                          <p className="muted">
                            {postulacion.vacante?.cargo?.nombre ?? "Vacante sin nombre"} ·{" "}
                            {formatDate(postulacion.createdAt)}
                          </p>
                          <div className="status-chip" data-tone={getEstadoTone(postulacion.estado)}>
                            {postulacion.estado.toUpperCase()}
                          </div>
                        </div>
                        {postulacion.entrevistas && postulacion.entrevistas.length > 0 && (
                          <p className="muted">
                            Última entrevista: {formatDate(postulacion.entrevistas[0].inicioTs)}
                          </p>
                        )}
                        {postulacion.feedbacks && postulacion.feedbacks.length > 0 && (
                          <p className="muted">
                            Feedback: {postulacion.feedbacks[0].recomendacion ? "Recomienda" : "Revisión pendiente"}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <div>
              <h2>Ranking por scoring</h2>
              <p>Mejores candidatos según el puntaje actual.</p>
            </div>
          </header>
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              void loadScoring(effectiveTenant, topLimit);
            }}
          >
            <label>
              Top
              <input
                type="number"
                min={1}
                max={20}
                value={topLimit}
                onChange={(event) => setTopLimit(Number(event.target.value))}
              />
            </label>
            <button type="submit" className="button button--ghost" disabled={loadingScore}>
              {loadingScore ? "Actualizando..." : "Actualizar lista"}
            </button>
          </form>
          {loadingScore ? (
            <p className="muted">Calculando score...</p>
          ) : scoring.length === 0 ? (
            <p className="muted">Aún no hay puntajes registrados.</p>
          ) : (
            <ul className="score-list">
              {scoring.map((item, index) => (
                <li key={item.id} className="score-list__item">
                  <div>
                    <span className="score-rank">#{index + 1}</span> {item.nombre}
                  </div>
                  <span className="score-chip">{item.puntaje.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="card">
        <header className="card__header">
          <div>
            <h2>Kanban de postulaciones</h2>
            <p>Visualiza rápidamente el estado de avance por cada etapa.</p>
          </div>
        </header>
        {loadingKanban ? (
          <p className="muted">Cargando tablero...</p>
        ) : (
          <div className="kanban-board">
            {STATUS_COLUMNS.map((column) => (
              <div key={column.key} className="kanban-column">
                <div className="kanban-column__header">
                  <h3>{column.label}</h3>
                  <span className={`status-chip status-chip--${column.tone}`}>
                    {groupedKanban[column.key]?.length ?? 0}
                  </span>
                </div>
                <div className="kanban-column__list">
                  {groupedKanban[column.key]?.length ? (
                    groupedKanban[column.key].map((item) => (
                      <article key={item.id} className="kanban-card">
                        <h4>{item.vacante?.cargo?.nombre ?? "Vacante"}</h4>
                        <p className="muted">{item.candidato?.nombre ?? "Candidato"}</p>
                        <p className="muted">{formatDate(item.createdAt)}</p>
                      </article>
                    ))
                  ) : (
                    <p className="muted">Sin registros</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CandidatesPage;
