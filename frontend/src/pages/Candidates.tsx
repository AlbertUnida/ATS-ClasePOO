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

function mapEstadoToColumn(estado: string) {
  const normalized = estado.toLowerCase();
  if (normalized.includes("contrat") || normalized.includes("finaliz") || normalized.includes("ingres")) {
    return "contratado";
  }
  if (normalized.includes("descart") || normalized.includes("rechaz") || normalized.includes("cancel")) {
    return "descartado";
  }
  if (
    normalized.includes("entrevista") ||
    normalized.includes("proceso") ||
    normalized.includes("evalu") ||
    normalized.includes("screen")
  ) {
    return "en_proceso";
  }
  return "postulado";
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
  const [totalItems, setTotalItems] = useState(0);
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
      const totalFromResponse = response.total ?? response.data.length;
      setTotalItems(totalFromResponse);
      const computedTotalPages = response.totalPages ?? Math.max(1, Math.ceil(totalFromResponse / limit));
      setTotalPages(computedTotalPages);
      const existsInPage = response.data.find((item) => item.id === selectedId);
      if (response.data.length > 0 && !existsInPage) {
        setSelectedId(response.data[0].id);
      } else if (response.data.length === 0) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los candidatos.");
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoadingList(false);
    }
  };

  const loadKanban = async (tenant: string) => {
    setLoadingKanban(true);
    setError(null);
    try {
      const data = await fetchPostulaciones({ tenant });
      setKanbanItems(Array.isArray(data) ? data : []);
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
    const groups = STATUS_COLUMNS.reduce(
      (acc, column) => {
        acc[column.key] = [];
        return acc;
      },
      {} as Record<(typeof STATUS_COLUMNS)[number]["key"], PostulacionItem[]>,
    );
    kanbanItems.forEach((item) => {
      const key = mapEstadoToColumn(item.estado ?? "");
      groups[key].push(item);
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
  const selectedCandidate = useMemo(
    () => candidates.find((item) => item.id === selectedId),
    [candidates, selectedId],
  );

  const filteredCandidates = useMemo(() => {
    if (!minScore) return candidates;
    return candidates.filter((item) => (item.score?.puntajeTotal ?? 0) >= minScore);
  }, [candidates, minScore]);

  const disablePrev = page <= 1 || loadingList || totalPages <= 1;
  const disableNext = page >= totalPages || loadingList || totalPages <= 1;
  const showPagination = totalItems > limit;

  const derivedScore = detail?.score?.puntajeTotal ?? selectedCandidate?.score?.puntajeTotal;
  const hasScore = typeof derivedScore === "number";
  const detailScoreDisplay = hasScore ? `${derivedScore.toFixed(1)} / 100` : "Sin score";
  const paginationFrom = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const paginationTo = totalItems === 0 ? 0 : Math.min(page * limit, totalItems);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Talento</p>
          <h1>Gestion de candidatos</h1>
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

      <section className="candidate-grid">
        <article className="card">
          <header className="card__header card__header--split">
            <div>
              <h2>Candidatos registrados</h2>
              <p>Selecciona un registro para ver el detalle completo y su historial.</p>
            </div>
            <form className="inline-form inline-form--compact" onSubmit={handleSearchSubmit}>
              <label>
                Buscar
                <input
                  placeholder="Nombre, correo o telefono"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </label>
              <label>
                Score minimo
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(event) => setMinScore(Number(event.target.value))}
                />
              </label>
              <button type="submit" className="button button--ghost" disabled={loadingList}>
                Buscar
              </button>
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
                    <th>Ultima actividad</th>
                    <th>Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((item) => {
                    const rowScore = item.score?.puntajeTotal;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={selectedId === item.id ? "selected" : ""}
                      >
                        <td>{item.nombre}</td>
                        <td>{item.email}</td>
                        <td>{item.postulaciones?.[0]?.createdAt ? formatDate(item.postulaciones[0].createdAt) : "N/A"}</td>
                        <td>{typeof rowScore === "number" ? `${rowScore.toFixed(1)} / 100` : "Sin score"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showPagination && (
            <div className="pagination">
              <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={disablePrev}>
                Anterior
              </button>
              <span>
                Pagina {page} de {totalPages}
                {totalItems > 0 && ` | Registros ${paginationFrom}-${paginationTo} de ${totalItems}`}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={disableNext}
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
              <p>Informacion de contacto, CV y puntajes.</p>
            </div>
          </header>

          {loadingDetail ? (
            <p className="muted">Cargando detalle...</p>
          ) : !detail ? (
            <p className="muted">Selecciona un candidato para ver su informacion.</p>
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
                  <strong>{detailScoreDisplay}</strong>
                  <span className="muted">{hasScore ? "Score actualizado" : "Pendiente de calculo"}</span>
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
                            {postulacion.vacante?.cargo?.nombre ?? "Vacante sin nombre"} {" - "}
                            {formatDate(postulacion.createdAt)}
                          </p>
                          <div className="status-chip" data-tone={getEstadoTone(postulacion.estado)}>
                            {postulacion.estado.toUpperCase()}
                          </div>
                        </div>
                        {postulacion.entrevistas && postulacion.entrevistas.length > 0 && (
                          <p className="muted">Ultima entrevista: {formatDate(postulacion.entrevistas[0].inicioTs)}</p>
                        )}
                        {postulacion.feedbacks && postulacion.feedbacks.length > 0 && (
                          <p className="muted">
                            Feedback: {postulacion.feedbacks[0].recomendacion ? "Recomienda" : "Revision pendiente"}
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
          <header className="card__header card__header--split">
            <div>
              <h2>Ranking por scoring</h2>
              <p>Mejores candidatos segun el puntaje actual.</p>
            </div>
            <div className="card__tools">
              <form
                className="inline-form inline-form--compact"
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
              <button
                type="button"
                className="button button--primary"
                onClick={() => void loadScoring(effectiveTenant, topLimit)}
                disabled={loadingScore}
              >
                Recalcular puntajes
              </button>
            </div>
          </header>
          {loadingScore ? (
            <p className="muted">Calculando score...</p>
          ) : scoring.length === 0 ? (
            <p className="muted">Aun no hay puntajes registrados.</p>
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
            <p>Visualiza rapidamente el estado de avance por cada etapa.</p>
          </div>
        </header>
        {loadingKanban ? (
          <p className="muted">Cargando tablero...</p>
        ) : kanbanItems.length === 0 ? (
          <p className="muted">No existen postulaciones para mostrar en este tenant.</p>
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
