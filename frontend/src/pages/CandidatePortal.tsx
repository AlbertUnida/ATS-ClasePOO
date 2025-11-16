import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { API_BASE_URL, fetchVacantesPublicas, fetchVacantesPublicasTodas } from "../api/backend";

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

const FORMACION_OPTIONS = [
  { value: "", label: "Selecciona tu nivel" },
  { value: "secundaria", label: "Secundaria / Bachillerato" },
  { value: "tecnico", label: "Técnico / Tecnicatura" },
  { value: "universitario", label: "Universitario" },
  { value: "postgrado", label: "Postgrado / Maestría" },
  { value: "doctorado", label: "Doctorado" },
];

function CandidatePortal({ preview = false }: CandidatePortalProps) {
  const [tab, setTab] = useState<PortalTab>("login");
  const [profile, setProfile] = useState<CandidateProfile | null>(preview ? DEFAULT_PROFILE_PREVIEW : null);
  const [postulaciones, setPostulaciones] = useState<CandidatePostulacion[]>(
    preview ? DEFAULT_POSTULACIONES_PREVIEW : [],
  );
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [selectedVacante, setSelectedVacante] = useState<VacantePublica | null>(null);
  const [tenantFilter, setTenantFilter] = useState("");
  const [vacantesLoading, setVacantesLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyNotes, setApplyNotes] = useState("");
  const [applyCvUrl, setApplyCvUrl] = useState("");
  const [applyFormacion, setApplyFormacion] = useState("");
  const [applyExperiencia, setApplyExperiencia] = useState("");
  const [applyHabilidades, setApplyHabilidades] = useState("");
  const [applyCompetencias, setApplyCompetencias] = useState("");
  const [applyKeywords, setApplyKeywords] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    telefono: "",
  });
  const [profileForm, setProfileForm] = useState({
    nombre: "",
    telefono: "",
  });

  const isAuthenticated = !!profile && !preview;
  const authCardRef = useRef<HTMLDivElement | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightAuth, setHighlightAuth] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vacanteRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const resetMessages = () => {
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const resolveAssetUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalized}`;
  };

  const scrollToAuthCard = useCallback(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    authCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightAuth(true);
    highlightTimerRef.current = setTimeout(() => setHighlightAuth(false), 2000);
  }, []);

  const loadVacantes = useCallback(
    async (tenantSlug?: string) => {
      setVacantesLoading(true);
      resetMessages();
      try {
        const data = tenantSlug?.trim()
          ? await fetchVacantesPublicas(tenantSlug.trim().toLowerCase())
          : await fetchVacantesPublicasTodas();
        setVacantes(data);
        if (data.length > 0) {
          setSelectedVacante((current) => current ?? data[0]);
        } else {
          setSelectedVacante(null);
        }
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

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    vacanteRefs.current = {};
  }, [vacantes]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) return;
    resetMessages();
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      await candidateLogin(loginForm);
      setStatusMessage("Ingreso exitoso. ¡Bienvenida/o al portal de postulantes!");
      await loadProfile();
    } catch (error) {
      let message = "Correo o contraseña incorrectos.";
      if (error instanceof Error && error.message) {
        message = error.message;
      }
      setErrorMessage(message);
      setLoginError(message);
    } finally {
      setLoginSubmitting(false);
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
      setStatusMessage("CV actualizado correctamente.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo subir el CV.");
    } finally {
      setUploadingCv(false);
    }
  };

  const handleOpenApplyModal = (vacante: VacantePublica) => {
    if (preview) {
      setStatusMessage("En modo vista previa las postulaciones están deshabilitadas.");
      return;
    }
    if (!profile) {
      setErrorMessage("Debes iniciar sesión para postularte a una vacante.");
      setTab("login");
      scrollToAuthCard();
      return;
    }
    setSelectedVacante(vacante);
    setApplyNotes("");
    setApplyCvUrl(profile.cvUrl ?? "");
    setApplyFormacion("");
    setApplyExperiencia("");
    setApplyHabilidades("");
    setApplyCompetencias("");
    setApplyKeywords("");
    setApplyModalOpen(true);
  };

  const handleCloseApplyModal = () => {
    setApplyModalOpen(false);
    setApplyNotes("");
    setApplyCvUrl("");
    setApplyingId(null);
    setApplyFormacion("");
    setApplyExperiencia("");
    setApplyHabilidades("");
    setApplyCompetencias("");
    setApplyKeywords("");
  };

  const handleApply = async (
    vacante: VacantePublica,
    extras?: Partial<
      Pick<
        CandidatePostulacionPayload,
        | "mensaje"
        | "cvExtraUrl"
        | "formacionNivel"
        | "anosExperiencia"
        | "habilidadesTecnicas"
        | "competenciasBlandas"
        | "palabrasClave"
      >
    >,
  ) => {
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
        mensaje: extras?.mensaje,
        cvExtraUrl: extras?.cvExtraUrl,
        formacionNivel: extras?.formacionNivel,
        anosExperiencia: extras?.anosExperiencia,
        habilidadesTecnicas: extras?.habilidadesTecnicas,
        competenciasBlandas: extras?.competenciasBlandas,
        palabrasClave: extras?.palabrasClave,
      });
      setStatusMessage("Postulación enviada. Puedes seguir el estado en la sección de postulaciones.");
      const postulacionesResponse = await fetchCandidatePostulaciones();
      setPostulaciones(postulacionesResponse.postulaciones ?? []);
      handleCloseApplyModal();
      setTimeout(() => {
        setToastMessage("Postulación enviada con éxito.");
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
      }, 100);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar la postulación.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleApplyFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVacante) return;
    const habilidades = applyHabilidades
      ? applyHabilidades.split(",").map((item) => item.trim()).filter(Boolean)
      : undefined;
    const competencias = applyCompetencias
      ? applyCompetencias.split(",").map((item) => item.trim()).filter(Boolean)
      : undefined;
    const palabras = applyKeywords
      ? applyKeywords.split(",").map((item) => item.trim()).filter(Boolean)
      : undefined;
    await handleApply(selectedVacante, {
      mensaje: applyNotes.trim() ? applyNotes.trim() : undefined,
      cvExtraUrl: applyCvUrl.trim() ? applyCvUrl.trim() : undefined,
      formacionNivel: applyFormacion || undefined,
      anosExperiencia: applyExperiencia ? Number(applyExperiencia) : undefined,
      habilidadesTecnicas: habilidades,
      competenciasBlandas: competencias,
      palabrasClave: palabras,
    });
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
  const resolvedCvUrl = useMemo(() => {
    if (!profile?.cvUrl) return null;
    if (profile.cvUrl.startsWith("http")) return profile.cvUrl;
    const normalized = profile.cvUrl.startsWith("/") ? profile.cvUrl : `/${profile.cvUrl}`;
    return `${API_BASE_URL}${normalized}`;
  }, [profile?.cvUrl]);

  const featuredVacantes = useMemo(() => vacantes.filter((item) => item.imagenUrl), [vacantes]);

  const handleSpotlightClick = (vacante: VacantePublica) => {
    setSelectedVacante(vacante);
    const target = vacanteRefs.current[vacante.id];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("vacante-card--highlight");
      setTimeout(() => target.classList.remove("vacante-card--highlight"), 1200);
    }
  };

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
        <div
          className={`candidate-hero__card${highlightAuth ? " is-highlighted" : ""}`}
          ref={authCardRef}
        >
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
                    onClick={() => {
                      setTab("login");
                      setLoginError(null);
                    }}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    className={`candidate-tabs__button${tab === "register" ? " active" : ""}`}
                    onClick={() => {
                      setTab("register");
                      setLoginError(null);
                    }}
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
                  <button type="submit" className="button button--primary" disabled={loginSubmitting}>
                    {loginSubmitting ? "Ingresando..." : "Ingresar"}
                  </button>
                  {loginError && <p className="form-error">{loginError}</p>}
                    <p className="candidate-session__helper">
                      ¿No tienes cuenta aún? Cambia a Registrarme para crearla.
                    </p>
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
                    <button type="submit" className="button button--primary">
                      Crear cuenta
                    </button>
                    <p className="candidate-session__helper">
                      ¿Ya tienes una cuenta? Vuelve a Iniciar sesión para ingresar.
                    </p>
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

      {featuredVacantes.length > 0 && (
        <section className="candidate-spotlight">
          <header>
            <div>
              <h2>Oportunidades destacadas</h2>
              <p>Explora rápidamente las vacantes con imagen destacada y accede con un clic.</p>
            </div>
          </header>
          <div className="candidate-spotlight__track">
            {featuredVacantes.map((vacante) => {
              const imageUrl = resolveAssetUrl(vacante.imagenUrl);
              if (!imageUrl) return null;
              return (
                <button
                  type="button"
                  key={vacante.id}
                  className="candidate-spotlight__item"
                  onClick={() => handleSpotlightClick(vacante)}
                >
                  <img src={imageUrl} alt={`Imagen de ${vacante.cargo?.nombre ?? "vacante"}`} />
                  <span>{vacante.cargo?.nombre ?? "Vacante"}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!preview && isAuthenticated && (
        <section className="candidate-section candidate-section--cv">
          <header className="candidate-section__header">
            <div>
              <h2>Tu CV</h2>
              <p>Previsualiza el documento que los reclutadores verán al revisar tus postulaciones.</p>
            </div>
          </header>
          <div className="candidate-cv-preview candidate-cv-preview--wide">
            <div className="candidate-cv-preview__viewer candidate-cv-preview__viewer--wide">
              {isAuthenticated ? (
                resolvedCvUrl ? (
                  <iframe title="CV cargado" src={`${resolvedCvUrl}#toolbar=0&navpanes=0`} loading="lazy" />
                ) : (
                  <p className="muted">Todavía no subiste un PDF. Usa “Subir CV actualizado” para cargarlo.</p>
                )
              ) : (
                <p className="muted">Inicia sesión para subir y visualizar tu CV.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {selectedVacante && (
        <section className="candidate-section candidate-section--detail">
          <header className="candidate-section__header">
            <div>
              <h2>Vacante seleccionada</h2>
              <p>Consulta la información completa antes de postularte.</p>
            </div>
            <button
              type="button"
              className="button"
              onClick={() => handleOpenApplyModal(selectedVacante)}
              disabled={preview || applyingId === selectedVacante.id}
            >
              {preview ? "Vista previa" : isAuthenticated ? "Postularme" : "Inicia sesión"}
            </button>
          </header>

          <article className="vacante-detail">
            <div className="vacante-detail__header">
              <div>
                <span className="pill pill--accent">{selectedVacante.tenant?.name ?? "Tenant"}</span>
                <h3>{selectedVacante.cargo?.nombre ?? "Cargo sin nombre"}</h3>
              </div>
              <span className={`status-chip status-chip--${selectedVacante.estado === "abierta" ? "success" : "neutral"}`}>
                {selectedVacante.estado.toUpperCase()}
              </span>
            </div>
            {selectedVacante.resumen && (
              <p className="vacante-detail__summary">{selectedVacante.resumen}</p>
            )}
            {selectedVacante.descripcion && (
              <div className="vacante-detail__body">
                <h4>Descripción</h4>
                <p>{selectedVacante.descripcion}</p>
              </div>
            )}
            <div className="vacante-detail__meta">
              <div>
                <p className="label">Código</p>
                <code>{selectedVacante.id}</code>
              </div>
              <div>
                <p className="label">Tenant</p>
                <strong>{selectedVacante.tenant?.slug ?? "N/A"}</strong>
              </div>
              <div>
                <p className="label">Visibilidad</p>
                <strong>{selectedVacante.visibilidad ?? "PUBLICA"}</strong>
              </div>
            </div>
          </article>
        </section>
      )}

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
            <article
              key={vacante.id}
              id={`vacante-${vacante.id}`}
              ref={(el) => {
                vacanteRefs.current[vacante.id] = el;
              }}
              className={`candidate-vacante-card${selectedVacante?.id === vacante.id ? " selected" : ""}`}
              onClick={() => setSelectedVacante(vacante)}
            >
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
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenApplyModal(vacante);
                  }}
                  disabled={preview || applyingId === vacante.id}
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

      {applyModalOpen && selectedVacante && (
        <CandidateApplyModal
          vacante={selectedVacante}
          notes={applyNotes}
          cvLink={applyCvUrl}
          formacion={applyFormacion}
          experiencia={applyExperiencia}
          habilidades={applyHabilidades}
          competencias={applyCompetencias}
          keywords={applyKeywords}
          onClose={handleCloseApplyModal}
          onChangeNotes={setApplyNotes}
          onChangeCvLink={setApplyCvUrl}
          onChangeFormacion={setApplyFormacion}
          onChangeExperiencia={setApplyExperiencia}
          onChangeHabilidades={setApplyHabilidades}
          onChangeCompetencias={setApplyCompetencias}
          onChangeKeywords={setApplyKeywords}
          onSubmit={handleApplyFormSubmit}
          submitting={applyingId === selectedVacante.id}
        />
      )}
      {toastMessage && (
        <div className="candidate-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

interface CandidateApplyModalProps {
  vacante: VacantePublica;
  notes: string;
  cvLink: string;
  formacion: string;
  experiencia: string;
  habilidades: string;
  competencias: string;
  keywords: string;
  submitting: boolean;
  onClose: () => void;
  onChangeNotes: (value: string) => void;
  onChangeCvLink: (value: string) => void;
  onChangeFormacion: (value: string) => void;
  onChangeExperiencia: (value: string) => void;
  onChangeHabilidades: (value: string) => void;
  onChangeCompetencias: (value: string) => void;
  onChangeKeywords: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function CandidateApplyModal({
  vacante,
  notes,
  cvLink,
  formacion,
  experiencia,
  habilidades,
  competencias,
  keywords,
  submitting,
  onClose,
  onChangeNotes,
  onChangeCvLink,
  onChangeFormacion,
  onChangeExperiencia,
  onChangeHabilidades,
  onChangeCompetencias,
  onChangeKeywords,
  onSubmit,
}: CandidateApplyModalProps) {
  return (
    <div className="candidate-modal" role="dialog" aria-modal="true">
      <div className="candidate-modal__backdrop" onClick={onClose} />
      <div className="candidate-modal__content">
        <header className="candidate-modal__header">
          <div>
            <p className="eyebrow">Postular a</p>
            <h3>{vacante.cargo?.nombre ?? "Vacante"}</h3>
          </div>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Mensaje para el reclutador
            <textarea
              rows={4}
              placeholder="Cuéntanos por qué eres la persona indicada..."
              value={notes}
              onChange={(event) => onChangeNotes(event.target.value)}
            />
          </label>
          <label>
            Enlace a portafolio / CV alternativo
            <input
              placeholder="https://..."
              value={cvLink}
              onChange={(event) => onChangeCvLink(event.target.value)}
            />
          </label>
          <div className="candidate-modal__grid">
            <label>
              Nivel de formación
              <select value={formacion} onChange={(event) => onChangeFormacion(event.target.value)}>
                {FORMACION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Años de experiencia
              <input
                type="number"
                min={0}
                max={50}
                placeholder="Ej: 5"
                value={experiencia}
                onChange={(event) => onChangeExperiencia(event.target.value)}
              />
            </label>
          </div>
          <label>
            Habilidades técnicas (separadas por coma)
            <textarea
              rows={2}
              placeholder="React, Node.js, SQL..."
              value={habilidades}
              onChange={(event) => onChangeHabilidades(event.target.value)}
            />
          </label>
          <label>
            Competencias blandas (separadas por coma)
            <textarea
              rows={2}
              placeholder="Comunicación, liderazgo..."
              value={competencias}
              onChange={(event) => onChangeCompetencias(event.target.value)}
            />
          </label>
          <label>
            Palabras clave del CV (separadas por coma)
            <textarea
              rows={2}
              placeholder="SAP, Scrum, Inglés B2..."
              value={keywords}
              onChange={(event) => onChangeKeywords(event.target.value)}
            />
          </label>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? "Enviando..." : "Confirmar postulación"}
          </button>
        </form>
      </div>
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
