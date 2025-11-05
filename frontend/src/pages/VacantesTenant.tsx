import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  createCargo,
  createVacante,
  updateVacante,
  fetchCargos,
  fetchVacantesPorTenant,
  VacantePrivada,
  CargoItem,
  UpdateVacantePayload,
  uploadVacanteImagen,
} from "../api/backend";
import { useAuth } from "../context/AuthContext";

const ESTADOS = ["abierta", "pausada", "cerrada"] as const;
type EstadoVacante = (typeof ESTADOS)[number];

const ESTADO_TONE: Record<string, { label: string; tone: "success" | "warning" | "neutral" | "danger" }> = {
  abierta: { label: "Abierta", tone: "success" },
  pausada: { label: "Pausada", tone: "warning" },
  cerrada: { label: "Cerrada", tone: "neutral" },
};

const CONTRATOS = ["Full time", "Part time", "Temporal", "Consultoria"];

function VacantesTenant() {
  const { user } = useAuth();
  const tenantSlug = user?.tenant ?? "";

  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [vacantes, setVacantes] = useState<VacantePrivada[]>([]);
  const [vacantesError, setVacantesError] = useState<string | null>(null);
  const [loadingVacantes, setLoadingVacantes] = useState(false);

  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [cargosError, setCargosError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createCargoNombre, setCreateCargoNombre] = useState("");
  const [createCargoCompetencias, setCreateCargoCompetencias] = useState("");
  const [creatingCargo, setCreatingCargo] = useState(false);
  const [createCargoMessage, setCreateCargoMessage] = useState<string | null>(null);
  const [createCargoError, setCreateCargoError] = useState<string | null>(null);

  const [createVacanteForm, setCreateVacanteForm] = useState({
    cargoId: "",
    ubicacion: "",
    tipoContrato: "",
    estado: "abierta" as EstadoVacante,
  });
  const [creatingVacante, setCreatingVacante] = useState(false);
  const [createVacanteMessage, setCreateVacanteMessage] = useState<string | null>(null);
  const [createVacanteError, setCreateVacanteError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    cargoId: "",
    ubicacion: "",
    tipoContrato: "",
    estado: "abierta" as EstadoVacante,
  });
  const [savingVacante, setSavingVacante] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [createVacanteFile, setCreateVacanteFile] = useState<File | null>(null);
  const [createVacantePreview, setCreateVacantePreview] = useState<string | null>(null);

  const [editVacanteFile, setEditVacanteFile] = useState<File | null>(null);
  const [editVacantePreview, setEditVacantePreview] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4050";
  const resolveAssetUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${apiBaseUrl}${path}`;
  };

  const puedeGestionar = useMemo(() => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.roles.includes("ADMIN") || user.roles.includes("RECLUTADOR");
  }, [user]);

const selectedVacante = useMemo(
    () => (selectedId ? vacantes.find((item) => item.id === selectedId) ?? null : null),
    [selectedId, vacantes],
  );

  const canEditSelected = useMemo(() => {
    if (!selectedVacante) return false;
    if (user?.isSuperAdmin) return true;
    return selectedVacante.createdByUserId ? selectedVacante.createdByUserId === user?.id : false;
  }, [selectedVacante, user]);

  const stats = useMemo(() => {
    if (!vacantes.length) {
      return [
        { label: "Total", value: 0, tone: "neutral" as const },
        { label: "Abiertas", value: 0, tone: "success" as const },
        { label: "Pausadas", value: 0, tone: "warning" as const },
      ];
    }
    const abiertas = vacantes.filter((item) => item.estado.toLowerCase() === "abierta").length;
    const pausadas = vacantes.filter((item) => item.estado.toLowerCase() === "pausada").length;
    const cerradas = vacantes.filter((item) => item.estado.toLowerCase() === "cerrada").length;
    return [
      { label: "Total", value: vacantes.length, tone: "neutral" as const },
      { label: "Abiertas", value: abiertas, tone: "success" as const },
      { label: "Pausadas", value: pausadas, tone: "warning" as const },
      { label: "Cerradas", value: cerradas, tone: "neutral" as const },
    ];
  }, [vacantes]);

  useEffect(() => {
    if (tenantSlug && puedeGestionar) {
      void loadCargos();
    }
  }, [tenantSlug, puedeGestionar]);

  useEffect(() => {
    if (tenantSlug && puedeGestionar) {
      void loadVacantes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, puedeGestionar, estadoFiltro]);

useEffect(() => {
  if (selectedVacante) {
    setEditForm({
      cargoId: selectedVacante.cargo?.id ?? (selectedVacante as any).cargoId ?? "",
      ubicacion: selectedVacante.ubicacion ?? "",
      tipoContrato: selectedVacante.tipoContrato ?? "",
      estado: (selectedVacante.estado as EstadoVacante) ?? "abierta",
    });
    setEditVacanteFile(null);
    setEditVacantePreview(resolveAssetUrl(selectedVacante.imagenUrl));
  } else {
    setEditVacantePreview(null);
  }
}, [selectedVacante, resolveAssetUrl]);

useEffect(() => {
  return () => {
    if (createVacantePreview && createVacantePreview.startsWith("blob:")) {
      URL.revokeObjectURL(createVacantePreview);
    }
  };
}, [createVacantePreview]);

useEffect(() => {
  return () => {
    if (editVacantePreview && editVacantePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editVacantePreview);
    }
  };
}, [editVacantePreview]);

  const loadVacantes = async () => {
    if (!tenantSlug) return;
    setLoadingVacantes(true);
    setVacantesError(null);
    try {
      const data = await fetchVacantesPorTenant(tenantSlug, estadoFiltro || undefined);
      setVacantes(data);
      if (!selectedId && data.length) {
        setSelectedId(data[0].id);
      } else if (selectedId) {
        const stillExists = data.some((item) => item.id === selectedId);
        if (!stillExists && data.length) {
          setSelectedId(data[0].id);
        }
        if (!stillExists && !data.length) {
          setSelectedId(null);
        }
      }
    } catch (err) {
      setVacantesError(err instanceof Error ? err.message : "No se pudieron cargar las vacantes.");
      setVacantes([]);
      setSelectedId(null);
    } finally {
      setLoadingVacantes(false);
    }
  };

  const loadCargos = async () => {
    if (!tenantSlug) return;
    setLoadingCargos(true);
    setCargosError(null);
    try {
      const list = await fetchCargos(tenantSlug);
      setCargos(list);
    } catch (err) {
      setCargosError(err instanceof Error ? err.message : "No se pudieron obtener los cargos.");
      setCargos([]);
    } finally {
      setLoadingCargos(false);
    }
  };

  const handleCreateFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (createVacantePreview && createVacantePreview.startsWith("blob:")) {
      URL.revokeObjectURL(createVacantePreview);
    }
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setCreateVacanteFile(null);
      setCreateVacantePreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setCreateVacanteError("Solo se permiten archivos de imagen (jpg o png).");
      setCreateVacanteFile(null);
      setCreateVacantePreview(null);
      event.target.value = "";
      return;
    }
    setCreateVacanteError(null);
    setCreateVacanteFile(file);
    setCreateVacantePreview(URL.createObjectURL(file));
  };

  const handleEditFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (editVacantePreview && editVacantePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editVacantePreview);
    }
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setEditVacanteFile(null);
      setEditVacantePreview(resolveAssetUrl(selectedVacante?.imagenUrl));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUpdateError("Solo se permiten archivos de imagen (jpg o png).");
      setEditVacanteFile(null);
      setEditVacantePreview(resolveAssetUrl(selectedVacante?.imagenUrl));
      event.target.value = "";
      return;
    }
    setUpdateError(null);
    setEditVacanteFile(file);
    setEditVacantePreview(URL.createObjectURL(file));
  };

  const handleCrearCargo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!puedeGestionar) return;
    setCreatingCargo(true);
    setCreateCargoMessage(null);
    setCreateCargoError(null);

    try {
      let competenciasObj: Record<string, unknown> | undefined;
      if (createCargoCompetencias.trim()) {
        try {
          competenciasObj = JSON.parse(createCargoCompetencias);
        } catch (jsonError) {
          throw new Error("Las competencias deben estar en formato JSON valido.");
        }
      }
      await createCargo({ nombre: createCargoNombre.trim(), competencias: competenciasObj });
      setCreateCargoMessage("Cargo creado correctamente.");
      setCreateCargoNombre("");
      setCreateCargoCompetencias("");
      await loadCargos();
    } catch (err) {
      setCreateCargoError(err instanceof Error ? err.message : "No se pudo crear el cargo.");
    } finally {
      setCreatingCargo(false);
    }
  };

  const handleCrearVacante = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!puedeGestionar) return;
    if (!createVacanteForm.cargoId) {
      setCreateVacanteError("Selecciona un cargo antes de crear la vacante.");
      return;
    }
    setCreatingVacante(true);
    setCreateVacanteMessage(null);
    setCreateVacanteError(null);

    try {
      const nueva = await createVacante({
        cargoId: createVacanteForm.cargoId,
        ubicacion: createVacanteForm.ubicacion.trim() || undefined,
        tipoContrato: createVacanteForm.tipoContrato.trim() || undefined,
        estado: createVacanteForm.estado,
      });
      if (createVacanteFile) {
        await uploadVacanteImagen(nueva.id, createVacanteFile);
      }
      setCreateVacanteMessage(
        createVacanteFile ? "Vacante creada y la imagen se guardó correctamente." : "Vacante creada correctamente.",
      );
      setCreateVacanteForm({
        cargoId: "",
        ubicacion: "",
        tipoContrato: "",
        estado: "abierta",
      });
      setCreateVacanteFile(null);
      setCreateVacantePreview(null);
      await loadVacantes();
    } catch (err) {
      setCreateVacanteError(err instanceof Error ? err.message : "No se pudo crear la vacante.");
    } finally {
      setCreatingVacante(false);
    }
  };

  const handleActualizarVacante = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!puedeGestionar || !selectedVacante) return;
    if (!canEditSelected) {
      setUpdateError("Solo el autor de la vacante o un superadmin pueden actualizarla.");
      return;
    }

    const payload: UpdateVacantePayload = {};
    if (editForm.cargoId && editForm.cargoId !== (selectedVacante.cargo?.id ?? (selectedVacante as any).cargoId)) {
      payload.cargoId = editForm.cargoId;
    }
    if (editForm.ubicacion.trim() !== (selectedVacante.ubicacion ?? "")) {
      payload.ubicacion = editForm.ubicacion.trim() || undefined;
    }
    if (editForm.tipoContrato.trim() !== (selectedVacante.tipoContrato ?? "")) {
      payload.tipoContrato = editForm.tipoContrato.trim() || undefined;
    }
    if (editForm.estado !== (selectedVacante.estado as EstadoVacante)) {
      payload.estado = editForm.estado;
    }

    if (Object.keys(payload).length === 0 && !editVacanteFile) {
      setUpdateMessage("No hay cambios para guardar.");
      setUpdateError(null);
      return;
    }

    setSavingVacante(true);
    setUpdateMessage(null);
    setUpdateError(null);

    try {
      let updatedRecord = selectedVacante;
      if (Object.keys(payload).length > 0) {
        updatedRecord = await updateVacante(selectedVacante.id, payload);
      }
      if (editVacanteFile) {
        updatedRecord = await uploadVacanteImagen(selectedVacante.id, editVacanteFile);
      }
      setUpdateMessage(
        editVacanteFile ? "Vacante e imagen actualizadas correctamente." : "Vacante actualizada correctamente.",
      );
      setEditVacanteFile(null);
      setEditVacantePreview(resolveAssetUrl(updatedRecord.imagenUrl));
      await loadVacantes();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "No se pudo actualizar la vacante.");
    } finally {
      setSavingVacante(false);
    }
  };

  if (!tenantSlug) {
    return (
      <section className="card">
        <h2>No hay tenant seleccionado</h2>
        <p>Tu usuario no tiene un tenant asignado. Solicita acceso a un tenant para gestionar vacantes internas.</p>
      </section>
    );
  }

  if (!puedeGestionar) {
    return (
      <section className="card">
        <h2>Sin permisos para gestionar vacantes</h2>
        <p>
          Necesitas el rol ADMIN o RECLUTADOR para administrar las vacantes del tenant <strong>{tenantSlug}</strong>.
          Contacta al superadmin para que habilite tu acceso.
        </p>
      </section>
    );
  }

  return (
    <div className="vacantes-shell">
      <section className="card vacantes-overview">
        <header className="vacantes-header">
          <div>
            <p className="pill pill--accent">Tenant {tenantSlug}</p>
            <h2>Vacantes internas</h2>
            <p className="text-muted">
              Publlica, filtra y actualiza las vacantes del tenant. Los cambios impactan en la visibilidad interna y en
              los canales publicos si asi lo configuras.
            </p>
          </div>
          <div className="vacantes-controls">
            <label>
              Estado
              <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}>
                <option value="">Todos</option>
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="button button--ghost" onClick={() => void loadVacantes()} disabled={loadingVacantes}>
              Recargar
            </button>
          </div>
        </header>

        <section className="mini-metrics">
          {stats.map((metric) => (
            <article key={metric.label} className={`mini-metric mini-metric--${metric.tone}`}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        {vacantesError && <div className="alert alert--error">{vacantesError}</div>}

        <div className="vacantes-layout">
          <aside className="vacantes-list">
            {loadingVacantes && (
              <div className="vacantes-skeleton">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeleton-card">
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-line--short" />
                  </div>
                ))}
              </div>
            )}

            {!loadingVacantes && vacantes.length === 0 && (
              <div className="empty-state">
                <h3>No hay vacantes registradas</h3>
                <p>Crea una nueva vacante para este tenant y comenzara a aparecer en los reportes y listados.</p>
              </div>
            )}

            {!loadingVacantes &&
              vacantes.map((vacante) => {
                const tone = ESTADO_TONE[vacante.estado.toLowerCase()] ?? ESTADO_TONE.cerrada;
                return (
                  <button
                    key={vacante.id}
                    type="button"
                    className={`vacante-list-item${selectedId === vacante.id ? " vacante-list-item--active" : ""}`}
                    onClick={() => setSelectedId(vacante.id)}
                  >
                    <div>
                      <p className="vacante-list-item__title">{vacante.cargo?.nombre ?? "Cargo sin nombre"}</p>
                      <p className="vacante-list-item__meta">{vacante.ubicacion ?? "Sin ubicacion"}</p>
                    </div>
                    <span className={`status-chip status-chip--${tone.tone}`}>{tone.label}</span>
                  </button>
                );
              })}
          </aside>

          <section className="vacantes-detail">
            {selectedVacante ? (
              <>
                <header>
                  <h3>{selectedVacante.cargo?.nombre ?? "Cargo sin nombre"}</h3>
                  <p className="text-muted">
                    ID interno: <code>{selectedVacante.id}</code>
                  </p>
                </header>

                {editVacantePreview && (
                  <div className="image-preview image-preview--detail">
                    <img src={editVacantePreview} alt="Imagen asociada a la vacante" />
                  </div>
                )}

                {!canEditSelected && (
                  <div className="alert alert--info">
                    Solo el usuario que creó la vacante o un superadmin pueden editar la información.
                  </div>
                )}

                <dl className="vacante-meta">
                  <div>
                    <dt>Estado actual</dt>
                    <dd>{selectedVacante.estado.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt>Ubicacion</dt>
                    <dd>{selectedVacante.ubicacion ?? "Sin ubicacion definida"}</dd>
                  </div>
                  <div>
                    <dt>Tipo de contrato</dt>
                    <dd>{selectedVacante.tipoContrato ?? "No informado"}</dd>
                  </div>
                  <div>
                    <dt>Visibilidad</dt>
                    <dd>{selectedVacante.visibilidad ?? "No especificada"}</dd>
                  </div>
                </dl>

                <form className="form-grid" onSubmit={handleActualizarVacante}>
                  <label>
                    Cargo asignado
                    <select
                      value={editForm.cargoId}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, cargoId: event.target.value }))}
                      disabled={!canEditSelected}
                    >
                      <option value="">Mantener cargo actual</option>
                      {cargos.map((cargo) => (
                        <option key={cargo.id} value={cargo.id}>
                          {cargo.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Ubicacion
                    <input
                      value={editForm.ubicacion}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                      placeholder="Remoto, Asuncion, etc."
                      disabled={!canEditSelected}
                    />
                  </label>

                  <label>
                    Tipo de contrato
                    <select
                      value={editForm.tipoContrato}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, tipoContrato: event.target.value }))}
                      disabled={!canEditSelected}
                    >
                      <option value="">Selecciona una opcion</option>
                      {CONTRATOS.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Estado de la vacante
                    <select
                      value={editForm.estado}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, estado: event.target.value as EstadoVacante }))
                      }
                      disabled={!canEditSelected}
                    >
                      {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="file-input">
                    Imagen (jpg o png)
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleEditFileChange}
                      disabled={!canEditSelected}
                    />
                  </label>

                  <button type="submit" className="button button--primary" disabled={savingVacante || !canEditSelected}>
                    {savingVacante ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>

                {updateMessage && <div className="alert alert--success">{updateMessage}</div>}
                {updateError && <div className="alert alert--error">{updateError}</div>}
              </>
            ) : (
              <div className="empty-state">
                <h3>Selecciona una vacante</h3>
                <p>El panel mostrara aqui los detalles y permitira actualizar el estado y la informacion clave.</p>
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="card vacantes-form">
        <h3>Crear nueva vacante</h3>
        <p className="text-muted">
          Elige un cargo existente y completa los datos minimos. Podras actualizar la descripcion desde el backend o
          integraciones posteriores.
        </p>

        <form className="form-grid" onSubmit={handleCrearVacante}>
          <label>
            Cargo
            <select
              value={createVacanteForm.cargoId}
              onChange={(event) => setCreateVacanteForm((prev) => ({ ...prev, cargoId: event.target.value }))}
              disabled={loadingCargos}
              required
            >
              <option value="">Selecciona un cargo</option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ubicacion
            <input
              value={createVacanteForm.ubicacion}
              onChange={(event) => setCreateVacanteForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
              placeholder="Remoto, hibrido, ciudad..."
            />
          </label>

          <label>
            Tipo de contrato
            <select
              value={createVacanteForm.tipoContrato}
              onChange={(event) => setCreateVacanteForm((prev) => ({ ...prev, tipoContrato: event.target.value }))}
            >
              <option value="">Selecciona una opcion</option>
              {CONTRATOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado inicial
            <select
              value={createVacanteForm.estado}
              onChange={(event) =>
                setCreateVacanteForm((prev) => ({ ...prev, estado: event.target.value as EstadoVacante }))
              }
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="file-input">
            Imagen (opcional)
            <input type="file" accept="image/png,image/jpeg" onChange={handleCreateFileChange} />
          </label>
          {createVacantePreview && (
            <div className="image-preview">
              <img src={createVacantePreview} alt="Previsualizaci�n de la vacante" />
            </div>
          )}

          <button type="submit" className="button button--primary" disabled={creatingVacante}>
            {creatingVacante ? "Creando..." : "Crear vacante"}
          </button>
        </form>

        {createVacanteMessage && <div className="alert alert--success">{createVacanteMessage}</div>}
        {createVacanteError && <div className="alert alert--error">{createVacanteError}</div>}
      </section>

      <section className="card vacantes-form">
        <h3>Crear nuevo cargo</h3>
        <p className="text-muted">
          Define cargos base para reutilizarlos en nuevas vacantes. Puedes adjuntar competencias en formato JSON para
          integraciones futuras.
        </p>

        <form className="form-grid" onSubmit={handleCrearCargo}>
          <label>
            Nombre del cargo
            <input
              value={createCargoNombre}
              onChange={(event) => setCreateCargoNombre(event.target.value)}
              placeholder="Ej. Analista de talento"
              required
            />
          </label>

          <label>
            Competencias (JSON opcional)
            <textarea
              value={createCargoCompetencias}
              onChange={(event) => setCreateCargoCompetencias(event.target.value)}
              placeholder='{"skills":["Comunicacion","Excel"]}'
            />
          </label>

          <button type="submit" className="button button--ghost" disabled={creatingCargo}>
            {creatingCargo ? "Guardando..." : "Guardar cargo"}
          </button>
        </form>

        {createCargoMessage && <div className="alert alert--success">{createCargoMessage}</div>}
        {createCargoError && <div className="alert alert--error">{createCargoError}</div>}
        {cargosError && <div className="alert alert--error">{cargosError}</div>}
      </section>
    </div>
  );
}

export default VacantesTenant;
