import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createCargo,
  createVacante,
  updateVacante,
  fetchCargos,
  fetchVacantesPorTenant,
  VacantePrivada,
} from '../api/backend';
import { useAuth } from '../context/AuthContext';

const ESTADOS = ['abierta', 'pausada', 'cerrada'] as const;
type EstadoVacante = typeof ESTADOS[number];

function VacantesTenant() {
  const { user } = useAuth();
  const tenantSlug = user?.tenant ?? '';
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [loadingVacantes, setLoadingVacantes] = useState(false);
  const [vacantes, setVacantes] = useState<VacantePrivada[]>([]);
  const [vacantesError, setVacantesError] = useState<string | null>(null);

  const [cargos, setCargos] = useState<Array<{ id: string; nombre: string }>>([]);
  const [cargosLoading, setCargosLoading] = useState(false);
  const [cargosError, setCargosError] = useState<string | null>(null);

  const [cargoNombre, setCargoNombre] = useState('');
  const [cargoCompetencias, setCargoCompetencias] = useState('');
  const [creandoCargo, setCreandoCargo] = useState(false);
  const [cargoMessage, setCargoMessage] = useState<string | null>(null);
  const [cargoErrorMessage, setCargoErrorMessage] = useState<string | null>(null);

  const [vacanteCargoId, setVacanteCargoId] = useState('');
  const [vacanteUbicacion, setVacanteUbicacion] = useState('');
  const [vacanteTipoContrato, setVacanteTipoContrato] = useState('');
  const [vacanteEstado, setVacanteEstado] = useState<EstadoVacante>('abierta');
  const [creandoVacante, setCreandoVacante] = useState(false);
  const [vacanteMessage, setVacanteMessage] = useState<string | null>(null);
  const [vacanteErrorMessage, setVacanteErrorMessage] = useState<string | null>(null);

  const puedeGestionar = useMemo(() => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.roles.includes('ADMIN') || user.roles.includes('RECLUTADOR');
  }, [user]);

  useEffect(() => {
    if (tenantSlug && puedeGestionar) {
      loadCargos();
      loadVacantes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, puedeGestionar]);

  const applySelectedVacante = (vacante: VacantePrivada) => {
    setSelectedVacante(vacante);
    setEditVacanteCargoId(vacante.cargo?.id ?? (vacante as any).cargoId ?? '');
    setEditVacanteUbicacion(vacante.ubicacion ?? '');
    setEditVacanteTipoContrato(vacante.tipoContrato ?? '');
    setEditVacanteEstado((vacante.estado as EstadoVacante) ?? 'abierta');
      };

  const loadVacantes = async () => {
    if (!tenantSlug) return;
    setLoadingVacantes(true);
    setVacantesError(null);
    try {
      const data = await fetchVacantesPorTenant(tenantSlug, estadoFiltro || undefined);
      setVacantes(data);
    } catch (err) {
      setVacantesError(err instanceof Error ? err.message : 'No se pudieron cargar las vacantes');
      setVacantes([]);
    } finally {
      setLoadingVacantes(false);
    }
  };

  const loadCargos = async () => {
    if (!tenantSlug) return;
    setCargosLoading(true);
    setCargosError(null);
    try {
      const list = await fetchCargos(tenantSlug);
      setCargos(list);
    } catch (err) {
      setCargosError(err instanceof Error ? err.message : 'No se pudieron obtener los cargos');
      setCargos([]);
    } finally {
      setCargosLoading(false);
    }
  };

  const handleBuscarVacantes = async (event: FormEvent) => {
    event.preventDefault();
    await loadVacantes();
  };

  const handleCrearCargo = async (event: FormEvent) => {
    event.preventDefault();
    if (!puedeGestionar) return;
    setCreandoCargo(true);
    setCargoMessage(null);
    setCargoErrorMessage(null);
    try {
      let competenciasObj: Record<string, any> | undefined;
      if (cargoCompetencias.trim()) {
        try {
          competenciasObj = JSON.parse(cargoCompetencias);
        } catch (jsonError) {
          throw new Error('Las competencias deben ser un JSON válido.');
        }
      }
      await createCargo({ nombre: cargoNombre.trim(), competencias: competenciasObj });
      setCargoMessage('Cargo creado correctamente.');
      setCargoNombre('');
      setCargoCompetencias('');
      await loadCargos();
    } catch (err) {
      setCargoErrorMessage(err instanceof Error ? err.message : 'Error al crear el cargo');
    } finally {
      setCreandoCargo(false);
    }
  };

  const handleCrearVacante = async (event: FormEvent) => {
    event.preventDefault();
    if (!puedeGestionar) return;
    if (!vacanteCargoId) {
      setVacanteErrorMessage('Selecciona un cargo para la nueva vacante.');
      return;
    }
    setCreandoVacante(true);
    setVacanteMessage(null);
    setVacanteErrorMessage(null);
    try {
      await createVacante({
        cargoId: vacanteCargoId,
        ubicacion: vacanteUbicacion.trim() || undefined,
        tipoContrato: vacanteTipoContrato.trim() || undefined,
        estado: vacanteEstado,
      });
      setVacanteMessage('Vacante creada correctamente.');
      setVacanteCargoId('');
      setVacanteUbicacion('');
      setVacanteTipoContrato('');
      setVacanteEstado('abierta');
      await loadVacantes();
    } catch (err) {
      setVacanteErrorMessage(err instanceof Error ? err.message : 'No se pudo crear la vacante');
    } finally {
      setCreandoVacante(false);
    }
  };

  const handleSelectVacante = (vacante: VacantePrivada) => {
    setEditVacanteMessage(null);
    setEditVacanteError(null);
    applySelectedVacante(vacante);
  };

  const handleActualizarVacante = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedVacante) return;

    const payload: Parameters<typeof updateVacante>[1] = {};

    const originalCargoId = (selectedVacante as any).cargoId ?? selectedVacante.cargo?.id ?? '';
    if (editVacanteCargoId && editVacanteCargoId !== originalCargoId) {
      payload.cargoId = editVacanteCargoId;
    }
    if (editVacanteUbicacion.trim() !== (selectedVacante.ubicacion ?? '')) {
      payload.ubicacion = editVacanteUbicacion.trim() || undefined;
    }
    if (editVacanteTipoContrato.trim() !== (selectedVacante.tipoContrato ?? '')) {
      payload.tipoContrato = editVacanteTipoContrato.trim() || undefined;
    }
    if (editVacanteEstado && editVacanteEstado !== selectedVacante.estado) {
      payload.estado = editVacanteEstado;
    }

    if (Object.keys(payload).length === 0) {
      setEditVacanteError('No hay cambios para actualizar.');
      return;
    }

    setActualizandoVacante(true);
        try {
      await updateVacante(selectedVacante.id, payload);
      setEditVacanteMessage('Vacante actualizada correctamente.');
      await loadVacantes();
    } catch (err) {
      setEditVacanteError(err instanceof Error ? err.message : 'No se pudo actualizar la vacante.');
    } finally {
      setActualizandoVacante(false);
    }
  };

  if (!puedeGestionar) {
    return (
      <section className="card">
        <h2>Vacantes internas</h2>
        <p>No tienes suficientes permisos para gestionar vacantes internas.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Vacantes internas</h2>
      <p>Consulta y crea vacantes para el tenant actual.</p>

      <form className="form" onSubmit={handleBuscarVacantes} style={{ marginBottom: '1.5rem' }}>
        <label>
          Estado
          <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="button" disabled={loadingVacantes}>
          {loadingVacantes ? 'Buscando...' : 'Buscar vacantes'}
        </button>
      </form>

      {vacantesError && <div className="alert alert--error">{vacantesError}</div>}

      <div className="vacantes-list">
        {vacantes.map((vacante) => (
          <article
            key={vacante.id}
            className={`vacante-item ${selectedVacante?.id === vacante.id ? 'selected' : ''}`}
            onClick={() => handleSelectVacante(vacante)}
          >
            <h3>{vacante.cargo?.nombre ?? 'Cargo sin nombre'}</h3>
            <p>
              Estado: <strong>{vacante.estado.toUpperCase()}</strong> | Visibilidad: {vacante.visibilidad}
            </p>
            {vacante.ubicacion && <p>Ubicación: {vacante.ubicacion}</p>}
            {vacante.tipoContrato && <p>Tipo de contrato: {vacante.tipoContrato}</p>}
            {vacante.resumen && <p>{vacante.resumen}</p>}
          </article>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Editar vacante seleccionada</h3>
        {selectedVacante ? (
          <form className="form" onSubmit={handleActualizarVacante}>
            <label>
              Cargo
              <select value={editVacanteCargoId} onChange={(event) => setEditVacanteCargoId(event.target.value)}>
                <option value="">Mantener cargo actual</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ubicación
              <input value={editVacanteUbicacion} onChange={(event) => setEditVacanteUbicacion(event.target.value)} />
            </label>
            <label>
              Tipo de contrato
              <input
                value={editVacanteTipoContrato}
                onChange={(event) => setEditVacanteTipoContrato(event.target.value)}
              />
            </label>
            <label>
              Estado
              <select value={editVacanteEstado} onChange={(event) => setEditVacanteEstado(event.target.value as EstadoVacante)}>
                {ESTADOS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button" disabled={actualizandoVacante}>
              {actualizandoVacante ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {editVacanteMessage && <div className="alert alert--success">{editVacanteMessage}</div>}
            {editVacanteError && <div className="alert alert--error">{editVacanteError}</div>}
          </form>
        ) : (
          <p>Selecciona una vacante de la lista para editarla.</p>
        )}
      </div>

      {!loadingVacantes && !vacantesError && vacantes.length === 0 && (
        <p style={{ marginTop: '1rem', color: 'rgba(148, 163, 184, 0.8)' }}>No hay vacantes con el filtro actual.</p>
      )}

      <div className="grid" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Crear cargo</h3>
          <form className="form" onSubmit={handleCrearCargo}>
            <label>
              Nombre del cargo
              <input value={cargoNombre} onChange={(event) => setCargoNombre(event.target.value)} required />
            </label>
            <label>
              Competencias (JSON opcional)
              <textarea
                value={cargoCompetencias}
                onChange={(event) => setCargoCompetencias(event.target.value)}
                placeholder='{"skills":["Node","React"]}'
              />
            </label>
            <button type="submit" className="button" disabled={creandoCargo}>
              {creandoCargo ? 'Creando...' : 'Crear cargo'}
            </button>
            {cargoMessage && <div className="alert alert--success">{cargoMessage}</div>}
            {cargoErrorMessage && <div className="alert alert--error">{cargoErrorMessage}</div>}
            {cargosError && <div className="alert alert--error">{cargosError}</div>}
          </form>
        </div>

        <div className="card">
          <h3>Crear vacante</h3>
          <form className="form" onSubmit={handleCrearVacante}>
            <label>
              Cargo
              <select value={vacanteCargoId} onChange={(event) => setVacanteCargoId(event.target.value)} required>
                <option value="">Selecciona un cargo</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ubicación
              <input value={vacanteUbicacion} onChange={(event) => setVacanteUbicacion(event.target.value)} />
            </label>
            <label>
              Tipo de contrato
              <input value={vacanteTipoContrato} onChange={(event) => setVacanteTipoContrato(event.target.value)} />
            </label>
            <label>
              Estado
              <select value={vacanteEstado} onChange={(event) => setVacanteEstado(event.target.value as EstadoVacante)}>
                {ESTADOS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button" disabled={creandoVacante || cargosLoading}>
              {creandoVacante ? 'Creando...' : 'Crear vacante'}
            </button>
            {vacanteMessage && <div className="alert alert--success">{vacanteMessage}</div>}
            {vacanteErrorMessage && <div className="alert alert--error">{vacanteErrorMessage}</div>}
          </form>
        </div>
      </div>
    </section>
  );
}

export default VacantesTenant;






