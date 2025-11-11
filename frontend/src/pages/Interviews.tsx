import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createEntrevista,
  createFeedback,
  fetchEntrevistas,
  fetchFeedbacks,
  type CreateEntrevistaPayload,
  type CreateFeedbackPayload,
  type EntrevistaItem,
  type FeedbackItem,
} from "../api/backend";

function formatDateTime(value?: string) {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleString();
}

function InterviewsPage() {
  const { user } = useAuth();
  const defaultTenant = user?.tenant ?? "root";
  const isSuperAdmin = user?.isSuperAdmin;

  const [tenantSlug, setTenantSlug] = useState(defaultTenant);
  const [interviews, setInterviews] = useState<EntrevistaItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [interviewForm, setInterviewForm] = useState({
    postulacionId: "",
    tipo: "entrevista virtual",
    inicioTs: "",
    finTs: "",
    canal: "Meet",
    resultado: "",
    notas: "",
  });
  const [feedbackForm, setFeedbackForm] = useState({
    postulacionId: "",
    puntaje: 80,
    comentario: "",
    recomendacion: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantSlug) return;
    void loadData();
  }, [tenantSlug]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ivs, fb] = await Promise.all([
        fetchEntrevistas({ tenant: tenantSlug }),
        fetchFeedbacks({ tenant: tenantSlug }),
      ]);
      setInterviews(ivs);
      setFeedbacks(fb);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar entrevistas y feedbacks.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantSlug) {
      setError("Debes indicar un tenant.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const payload: CreateEntrevistaPayload = {
        tenantSlug,
        postulacionId: interviewForm.postulacionId.trim(),
        tipo: interviewForm.tipo,
        inicioTs: new Date(interviewForm.inicioTs).toISOString(),
        finTs: new Date(interviewForm.finTs).toISOString(),
      };
      if (interviewForm.canal) payload.canal = interviewForm.canal;
      if (interviewForm.resultado) payload.resultado = interviewForm.resultado;
      if (interviewForm.notas) payload.notas = interviewForm.notas;
      await createEntrevista(payload);
      setInterviewForm({
        postulacionId: "",
        tipo: interviewForm.tipo,
        inicioTs: "",
        finTs: "",
        canal: interviewForm.canal,
        resultado: "",
        notas: "",
      });
      setMessage("Entrevista registrada.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agendar la entrevista.");
    }
  };

  const handleCreateFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantSlug) {
      setError("Debes indicar un tenant.");
      return;
    }

    setError(null);
    setMessage(null);
    try {
      const payload: CreateFeedbackPayload = {
        tenantSlug,
        postulacionId: feedbackForm.postulacionId.trim(),
        puntaje: feedbackForm.puntaje,
        comentario: feedbackForm.comentario || undefined,
        recomendacion: feedbackForm.recomendacion,
      };
      await createFeedback(payload);
      setFeedbackForm({
        postulacionId: "",
        puntaje: 80,
        comentario: "",
        recomendacion: true,
      });
      setMessage("Feedback registrado.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el feedback.");
    }
  };

  const interviewsUpcoming = useMemo(
    () => interviews.filter((item) => new Date(item.inicioTs).getTime() >= Date.now()),
    [interviews],
  );

  const interviewsPast = useMemo(
    () => interviews.filter((item) => new Date(item.inicioTs).getTime() < Date.now()),
    [interviews],
  );

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Procesos</p>
          <h1>Entrevistas y feedback</h1>
          <p>Agenda entrevistas, registra la retroalimentación del panel y haz seguimiento del avance.</p>
        </div>
        {isSuperAdmin && (
          <label className="inline-field">
            Tenant
            <input value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} placeholder="root" />
          </label>
        )}
      </header>

      {(error || message) && (
        <div className={`alert ${error ? "alert--error" : "alert--success"}`}>{error ?? message}</div>
      )}

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <h2>Próximas entrevistas</h2>
            <p>Consulta el detalle y estado de cada estado planificado.</p>
          </header>
          {loading ? (
            <p className="muted">Cargando entrevistas...</p>
          ) : interviews.length === 0 ? (
            <p className="muted">No hay entrevistas registradas para este tenant.</p>
          ) : (
            <div className="timeline">
              {interviewsUpcoming.slice(0, 5).map((item) => (
                <article key={item.id} className="timeline__item">
                  <div>
                    <p className="eyebrow">{item.tipo?.toUpperCase()}</p>
                    <h3>{item.postulacion?.vacante?.cargo?.nombre ?? "Vacante"}</h3>
                    <p className="muted">{item.postulacion?.candidato?.nombre ?? "Candidato"}</p>
                  </div>
                  <div className="timeline__meta">
                    <p>{formatDateTime(item.inicioTs)}</p>
                    <p className="muted">{item.canal ?? "Sin canal"}</p>
                    {item.resultado && <span className="status-chip status-chip--neutral">{item.resultado}</span>}
                  </div>
                </article>
              ))}
              {interviewsUpcoming.length === 0 && <p className="muted">No hay entrevistas futuras.</p>}
            </div>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Agenda una entrevista</h2>
            <p>Ingresa los horarios en formato local (se guardan en UTC).</p>
          </header>
          <form className="form" onSubmit={handleCreateInterview}>
            <label>
              ID de postulacion
              <input
                value={interviewForm.postulacionId}
                onChange={(event) => setInterviewForm((prev) => ({ ...prev, postulacionId: event.target.value }))}
                required
                placeholder="postulacion_123"
              />
            </label>
            <label>
              Tipo
              <input
                value={interviewForm.tipo}
                onChange={(event) => setInterviewForm((prev) => ({ ...prev, tipo: event.target.value }))}
                required
              />
            </label>
            <label>
              Inicio
              <input
                type="datetime-local"
                value={interviewForm.inicioTs}
                onChange={(event) => setInterviewForm((prev) => ({ ...prev, inicioTs: event.target.value }))}
                required
              />
            </label>
            <label>
              Fin
              <input
                type="datetime-local"
                value={interviewForm.finTs}
                onChange={(event) => setInterviewForm((prev) => ({ ...prev, finTs: event.target.value }))}
                required
              />
            </label>
            <label>
              Canal
              <input
                value={interviewForm.canal}
                onChange={(event) => setInterviewForm((prev) => ({ ...prev, canal: event.target.value }))}
              />
            </label>
            <label>
              Resultado (opcional)
              <input
                value={interviewForm.resultado}
                onChange={(event) => setInterviewForm((prev) => ({ ...prev, resultado: event.target.value }))}
              />
            </label>
            <label>
              Notas
              <textarea
                rows={3}
                value={interviewForm.notas}
                onChange={(event) => setInterviewForm((prev) => ({ ...prev, notas: event.target.value }))}
              />
            </label>
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Guardando..." : "Guardar entrevista"}
            </button>
          </form>
        </article>
      </section>

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <h2>Feedback recientes</h2>
            <p>Registra la evaluación de cada entrevistador y recomendaciones.</p>
          </header>
          {loading ? (
            <p className="muted">Cargando feedbacks...</p>
          ) : feedbacks.length === 0 ? (
            <p className="muted">Aún no se registraron feedbacks para este tenant.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Postulación</th>
                  <th>Puntaje</th>
                  <th>Comentario</th>
                  <th>Recomendación</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td>{item.postulacion?.vacante?.cargo?.nombre ?? item.postulacionId}</td>
                    <td>{item.puntaje}</td>
                    <td>{item.comentario ?? "Sin comentario"}</td>
                    <td>{item.recomendacion ? "Sí" : "En evaluación"}</td>
                    <td>{formatDateTime(item.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Registrar feedback</h2>
            <p>Almacena la evaluación del entrevistador.</p>
          </header>
          <form className="form" onSubmit={handleCreateFeedback}>
            <label>
              ID de postulacion
              <input
                value={feedbackForm.postulacionId}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, postulacionId: event.target.value }))}
                required
              />
            </label>
            <label>
              Puntaje
              <input
                type="number"
                min={0}
                max={100}
                value={feedbackForm.puntaje}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, puntaje: Number(event.target.value) }))}
                required
              />
            </label>
            <label>
              Comentario
              <textarea
                rows={3}
                value={feedbackForm.comentario}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, comentario: event.target.value }))}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={feedbackForm.recomendacion}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({ ...prev, recomendacion: event.target.checked }))
                }
              />
              <span>Recomienda avanzar</span>
            </label>
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Guardando..." : "Guardar feedback"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

export default InterviewsPage;
