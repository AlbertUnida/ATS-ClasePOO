import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CandidateProfile } from "../api/candidate";
import {
  candidateLogin,
  candidateLogout,
  candidateRegister,
  fetchCandidatePostulaciones,
  fetchCandidateProfile,
  getStoredCandidateToken,
  postularVacanteComoCandidato,
  updateCandidateProfile,
  uploadCandidateCv,
  type CandidatePostulacion,
} from "../api/candidate";
import type { VacantePublica } from "../api/backend";
import { fetchVacantesPublicas, fetchVacantesPublicasTodas } from "../api/backend";

interface CandidatePortalProps {
  preview?: boolean;
}

type PortalTab = "login" | "register";

const DEFAULT_PROFILE_PREVIEW: CandidateProfile = {
  id: "preview",
  email: "candidata@ejemplo.com",
  nombre: "Ana Candidata",
  telefono: "+595 981 123 456",
  cvUrl: "https://tusitio.com/cv-ana.pdf",
};

const DEFAULT_POSTULACIONES_PREVIEW: CandidatePostulacion[] = [
  {
    id: "preview-1",
    vacanteId: "v1",
    estado: "postulado",
    createdAt: new Date().toISOString(),
    vacante: {
      id: "v1",
      estado: "abierta",
      tenantId: "tenant-1",
      cargo: { nombre: "Analista de Talento" },
      tenant: { name: "Talent Flow ATS" },
    },
  },
];

function CandidatePortal({ preview = false }: CandidatePortalProps) {
  const [tab, setTab] = useState<PortalTab>("login");
  const [profile, setProfile] = useState<CandidateProfile | null>(preview ? DEFAULT_PROFILE_PREVIEW : null);
  const [postulaciones, setPostulaciones] = useState<CandidatePostulacion[]>(
    preview ? DEFAULT_POSTULACIONES_PREVIEW : [],
  );
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [tenantFilter, setTenantFilter] = useState("");
  const [vacantesLoading, setVacantesLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    telefono: "",
    cvUrl: "",
  });
  const [profileForm, setProfileForm] = useState({
    nombre: "",
    telefono: "",
    cvUrl: "",
  });

  const isAuthenticated = !!profile && !preview;

  const resetMessages = () => {
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const loadVacantes = useCallback(
    async (tenantSlug?: string) => {
      setVacantesLoading(true);
      resetMessages();
      try {
        const data = tenantSlug?.trim()
          ? await fetchVacantesPublicas(tenantSlug.trim().toLowerCase())
          : await fetchVacantesPublicasTodas();
        setVacantes(data);
      } catch (error) {
        if (!preview) {
          setErrorMessage(error instanceof Error ? error.message : "No se pudieron cargar las vacantes públicas.");
        }
      } finally {
        setVacantesLoading(false);
      }
    },
    [preview],
  );

  const loadProfile = useCallback(async () => {
    if (preview) return;
    const token = getStoredCandidateToken();
    if (!token) {
      setProfile(null);
      setPostulaciones([]);
      return;
    }
    setLoadingProfile(true);
    resetMessages();
    try {
      const data = await fetchCandidateProfile();
      setProfile(data);
      setProfileForm({
        nombre: data.nombre ?? "",
        telefono: data.telefono ?? "",
        cvUrl: data.cvUrl ?? "",
      });
      const postulacionesResponse = await fetchCandidatePostulaciones();
      setPostulaciones(postulacionesResponse.postulaciones ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar tu perfil.");
      setProfile(null);
      setPostulaciones([]);
    } finally {
      setLoadingProfile(false);
    }
  }, [preview]);

  useEffect(() => {
    void loadVacantes();
    void loadProfile();
  }, [loadVacantes, loadProfile]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) return;
    resetMessages();
    try {
      await candidateLogin(loginForm);
      setStatusMessage("Ingreso exitoso. ¡Bienvenida/o al portal de postulantes!");
      await loadProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) return;
    resetMessages();
    try {
      await candidateRegister(registerForm);
      setStatusMessage("Registro exitoso. Ahora puedes iniciar sesión con tus credenciales.");
      setTab("login");
      setLoginForm({ email: registerForm.email, password: registerForm.password });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar el usuario.");
    }
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) return;
    resetMessages();
    try {
      setUpdatingProfile(true);
      const updated = await updateCandidateProfile(profileForm);
      setProfile(updated);
      setStatusMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (preview) return;
    const file = event.target.files?.[0];
    if (!file) return;
    resetMessages();
    setUploadingCv(true);
    try {
      const updated = await uploadCandidateCv(file);
      setProfile(updated);
      setProfileForm((prev) => ({
        ...prev,
        cvUrl: updated.cvUrl ?? prev.cvUrl,
      }));
      setStatusMessage("CV actualizado correctamente.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo subir el CV.");
    } finally {
      setUploadingCv(false);
    }
  };

  const handleApply = async (vacante: VacantePublica) => {
    if (preview) {
      setStatusMessage("En modo vista previa las postulaciones están deshabilitadas.");
      return;
    }
    if (!profile) {
      setErrorMessage("Debes iniciar sesión para postularte a una vacante.");
      return;
    }
    resetMessages();
    try {
      setApplyingId(vacante.id);
      await postularVacanteComoCandidato({
        tenantSlug: vacante.tenant?.slug ?? "",
        vacanteId: vacante.id,
        fuente: "portal",
      });
      setStatusMessage("Postulación enviada. Puedes seguir el estado en la sección de postulaciones.");
      const postulacionesResponse = await fetchCandidatePostulaciones();
      setPostulaciones(postulacionesResponse.postulaciones ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar la postulación.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleLogout = async () => {
    if (preview) return;
    resetMessages();
    try {
      await candidateLogout();
      setProfile(null);
      setPostulaciones([]);
      setStatusMessage("Sesión cerrada correctamente.");
    } catch (error) {
      // Incluso si falla, limpiamos el estado local
      setProfile(null);
      setPostulaciones([]);
    }
  };

  const postulacionesOrdenadas = useMemo(
    () =>
      [...postulaciones].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [postulaciones],
  );

  const portalClassName = preview
    ? "candidate-portal candidate-portal--preview"
    : "candidate-portal candidate-portal--public";

  return (
    <div className={portalClassName}>
      <section className="candidate-hero">
        <div className="candidate-hero__content">
          <span className="pill pill--accent">Talent Flow ATS</span>
          <h1>Portal de postulantes</h1>
          <p>
            Centraliza tu perfil, carga tu CV y sigue el estado de tus postulaciones en un solo lugar. <br />
            {preview
              ? "Estás visualizando la experiencia desde el panel administrativo."
              : "Inicia sesión o crea tu cuenta para comenzar."}
          </p>
        </div>
        <div className="candidate-hero__card">
          {statusMessage && <div className="alert alert--success">{statusMessage}</div>}
          {errorMessage && <div className="alert alert--error">{errorMessage}</div>}

          {!isAuthenticated ? (
            preview ? (
              <div className="candidate-preview-banner">
                <h2>Vista previa del portal</h2>
                <p>Así verán los postulantes su experiencia. El ingreso real se realiza desde la página pública.</p>
              </div>
            ) : (
              <div className="candidate-tabs">
                <div className="candidate-tabs__header">
                  <button
                    type="button"
                    className={`candidate-tabs__button${tab === "login" ? " active" : ""}`}
                    onClick={() => setTab("login")}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    className={`candidate-tabs__button${tab === "register" ? " active" : ""}`}
                    onClick={() => setTab("register")}
                  >
                    Registrarme
                  </button>
                </div>

                {tab === "login" ? (
                  <form className="candidate-form" onSubmit={handleLogin}>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Contraseña
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                        required
                        minLength={8}
                      />
                    </label>
                    <button type="submit" className="button button--primary">
                      Ingresar
                    </button>
                  </form>
                ) : (
                  <form className="candidate-form" onSubmit={handleRegister}>
                    <label>
                      Nombre y apellido
                      <input
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Contraseña
                      <input
                        type="password"
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                        minLength={8}
                        required
                      />
                    </label>
                    <label>
                      Teléfono (opcional)
                      <input
                        value={registerForm.telefono}
                        onChange={(event) => setRegisterForm({ ...registerForm, telefono: event.target.value })}
                      />
                    </label>
                    <label>
                      URL de CV (opcional)
                      <input
                        type="url"
                        value={registerForm.cvUrl}
                        onChange={(event) => setRegisterForm({ ...registerForm, cvUrl: event.target.value })}
                      />
                    </label>
                    <button type="submit" className="button button--primary">
                      Crear cuenta
                    </button>
                  </form>
                )}
              </div>
            )
          ) : (
            <div className="candidate-session">
              <header className="candidate-session__header">
                <div>
                  <h2>Hola, {profile?.nombre ?? profile?.email}</h2>
                  <p>Mantén tus datos actualizados para acelerar cada postulación.</p>
                </div>
                <button type="button" className="button button--ghost" onClick={() => void handleLogout()}>
                  Cerrar sesión
                </button>
              </header>

              <form className="candidate-form" onSubmit={handleProfileUpdate}>
                <label>
                  Nombre y apellido
                  <input
                    value={profileForm.nombre}
                    onChange={(event) => setProfileForm({ ...profileForm, nombre: event.target.value })}
                    disabled={updatingProfile}
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    value={profileForm.telefono}
                    onChange={(event) => setProfileForm({ ...profileForm, telefono: event.target.value })}
                    disabled={updatingProfile}
                  />
                </label>
                <label>
                  URL de CV
                  <input
                    type="url"
                    value={profileForm.cvUrl}
                    onChange={(event) => setProfileForm({ ...profileForm, cvUrl: event.target.value })}
                    disabled={updatingProfile}
                  />
                </label>
                <label>
                  Subir CV actualizado
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} disabled={uploadingCv} />
                </label>
                <div className="candidate-form__actions">
                  <button type="submit" className="button button--primary" disabled={updatingProfile || uploadingCv}>
                    {updatingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>
                  {uploadingCv && <span className="text-muted">Subiendo CV...</span>}
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      <section className="candidate-section">
        <header className="candidate-section__header">
          <div>
            <h2>Vacantes disponibles</h2>
            <p>Filtra por tenant para explorar las oportunidades que se adaptan a tu perfil.</p>
          </div>
          <form
            className="candidate-filter"
            onSubmit={(event) => {
              event.preventDefault();
              void loadVacantes(tenantFilter);
            }}
          >
            <input
              placeholder="Filtrar por tenant (slug)"
              value={tenantFilter}
              onChange={(event) => setTenantFilter(event.target.value)}
            />
            <button type="submit" className="button button--ghost" disabled={vacantesLoading}>
              Buscar
            </button>
          </form>
        </header>

        {vacantesLoading && <div className="candidate-empty">Cargando oportunidades...</div>}

        {!vacantesLoading && vacantes.length === 0 && (
          <div className="candidate-empty">
            <h3>No hay vacantes públicas para mostrar</h3>
            <p>Intenta buscar por otro tenant o vuelve más tarde.</p>
          </div>
        )}

        <div className="candidate-vacantes-grid">
          {vacantes.map((vacante) => (
            <article key={vacante.id} className="candidate-vacante-card">
              <header>
                <h3>{vacante.cargo?.nombre ?? "Cargo sin nombre"}</h3>
                <span className={`status-chip status-chip--${vacante.estado === "abierta" ? "success" : "neutral"}`}>
                  {vacante.estado.toUpperCase()}
                </span>
              </header>
              <p className="candidate-vacante-card__tenant">
                {vacante.tenant?.name ?? vacante.tenant?.slug ?? "Tenant desconocido"}
              </p>
              {vacante.resumen && <p className="candidate-vacante-card__summary">{vacante.resumen}</p>}
              <footer className="candidate-vacante-card__footer">
                <div>
                  <p>ID vacante</p>
                  <code>{vacante.id}</code>
                </div>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => void handleApply(vacante)}
                  disabled={preview || !isAuthenticated || applyingId === vacante.id}
                >
                  {preview
                    ? "Solo vista previa"
                    : applyingId === vacante.id
                    ? "Postulando..."
                    : isAuthenticated
                    ? "Postularme"
                    : "Inicia sesión"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="candidate-section">
        <header className="candidate-section__header">
          <div>
            <h2>Seguimiento de postulaciones</h2>
            <p>Consulta el estado de cada proceso y mantente atenta a las novedades.</p>
          </div>
        </header>

        {!preview && !isAuthenticated && (
          <div className="candidate-empty">
            <h3>Inicia sesión para seguir tus postulaciones</h3>
            <p>
              Registra tu cuenta o ingresa con tus credenciales. Una vez que envíes postulaciones, aparecerán aquí con
              su estado más reciente.
            </p>
          </div>
        )}

        {(preview || isAuthenticated) && postulacionesOrdenadas.length === 0 && (
          <div className="candidate-empty">
            <h3>Aún no tienes postulaciones registradas</h3>
            <p>
              Elige una vacante y envía tu CV para comenzar a seguir tu avance. Cada cambio de estado se mostrará en
              este panel.
            </p>
          </div>
        )}

        {postulacionesOrdenadas.length > 0 && (
          <div className="candidate-postulaciones">
            {postulacionesOrdenadas.map((postulacion) => (
              <article key={postulacion.id} className="candidate-postulacion">
                <div>
                  <h3>{postulacion.vacante?.cargo?.nombre ?? "Vacante sin título"}</h3>
                  <p className="candidate-postulacion__meta">
                    {postulacion.vacante?.tenant?.name ?? "Tenant"} · {new Date(postulacion.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`status-chip status-chip--${getEstadoTone(postulacion.estado)}`}>
                  {postulacion.estado.toUpperCase()}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getEstadoTone(estado: string) {
  const normalized = estado.toLowerCase();
  if (normalized.includes("entrevista") || normalized.includes("avanz")) return "warning";
  if (normalized.includes("contrat") || normalized === "contratado") return "success";
  if (normalized.includes("descart")) return "danger";
  return "neutral";
}

export default CandidatePortal;
