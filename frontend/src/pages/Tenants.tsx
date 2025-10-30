import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createTenant,
  fetchRolesByTenant,
  fetchTenants,
  PaginatedResponse,
  TenantItem,
  TenantRole,
  updateTenant,
} from '../api/backend';

const STATUS_OPTIONS: Array<'activo' | 'suspendido' | 'archivado'> = ['activo', 'suspendido', 'archivado'];

function Tenants() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<TenantItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<TenantItem | null>(null);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'activo' | 'suspendido' | 'archivado'>('activo');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editStatus, setEditStatus] = useState<'activo' | 'suspendido' | 'archivado'>('activo');
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const totalPages = data?.totalPages ?? 1;

  const loadTenants = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchTenants(pageToLoad, 10);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadTenants(page);
  }, [page, loadTenants]);

  const handleSelectTenant = async (tenant: TenantItem) => {
    setSelected(tenant);
    setEditName(tenant.name);
    setEditSlug(tenant.slug);
    setEditStatus((tenant.status as typeof editStatus) ?? 'activo');
    setUpdateMessage(null);
    setUpdateError(null);
    setRoles([]);
    setRolesError(null);
    setRolesLoading(true);
    try {
      const result = await fetchRolesByTenant(tenant.slug);
      setRoles(result);
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'No se pudieron obtener los roles.');
    } finally {
      setRolesLoading(false);
    }
  };

  const handleCreateTenant = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateMessage(null);
    try {
      await createTenant({
        name: name.trim(),
        slug: slug.trim() || undefined,
        status,
      });
      setCreateMessage('Tenant creado correctamente.');
      setName('');
      setSlug('');
      setStatus('activo');
      setPage(1);
      await loadTenants(1);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear el tenant.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTenant = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setUpdating(true);
    setUpdateMessage(null);
    setUpdateError(null);
    try {
      const updated = await updateTenant(selected.id, {
        name: editName.trim() || undefined,
        slug: editSlug.trim() || undefined,
        status: editStatus,
      });
      setUpdateMessage('Tenant actualizado.');
      setSelected(updated);
      await loadTenants(page);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'No se pudo actualizar el tenant.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="card">
      <h2>Tenants</h2>
      <p>Gestiona los tenants del sistema (solo SuperAdmin).</p>

      <form className="form" onSubmit={handleCreateTenant} style={{ marginBottom: '2rem' }}>
        <h3>Crear nuevo tenant</h3>
        <label>
          Nombre
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Slug (opcional)
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="ej: tecnoedil"
          />
        </label>
        <label>
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="button" disabled={creating}>
          {creating ? 'Creando...' : 'Crear tenant'}
        </button>
        {createMessage && <div className="alert alert--success">{createMessage}</div>}
        {createError && <div className="alert alert--error">{createError}</div>}
      </form>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && data?.data?.length ? (
              data.data.map((tenant) => (
                <tr
                  key={tenant.id}
                  className={selected?.id === tenant.id ? 'row-selected' : ''}
                  onClick={() => handleSelectTenant(tenant)}
                >
                  <td>{tenant.name}</td>
                  <td>{tenant.slug}</td>
                  <td>{tenant.status}</td>
                  <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    No hay tenants
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Siguiente
        </button>
      </div>

      <div className="grid" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3>Roles del tenant seleccionado</h3>
          {selected ? (
            <>
              <p>
                Tenant: <strong>{selected.name}</strong> ({selected.slug})
              </p>
              {rolesLoading && <p>Cargando roles...</p>}
              {rolesError && <div className="alert alert--error">{rolesError}</div>}
              {!rolesLoading && !rolesError && (
                <ul>
                  {roles.length ? roles.map((role) => <li key={role.id}>{role.name}</li>) : <li>Sin roles definidos</li>}
                </ul>
              )}
            </>
          ) : (
            <p>Selecciona un tenant de la tabla para ver sus roles.</p>
          )}
        </div>

        <div className="card">
          <h3>Editar tenant</h3>
          {selected ? (
            <form className="form" onSubmit={handleUpdateTenant}>
              <label>
                Nombre
                <input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </label>
              <label>
                Slug
                <input value={editSlug} onChange={(event) => setEditSlug(event.target.value)} />
              </label>
              <label>
                Estado
                <select value={editStatus} onChange={(event) => setEditStatus(event.target.value as typeof editStatus)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="button" disabled={updating}>
                {updating ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {updateMessage && <div className="alert alert--success">{updateMessage}</div>}
              {updateError && <div className="alert alert--error">{updateError}</div>}
            </form>
          ) : (
            <p>Selecciona un tenant para editar sus datos.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Tenants;
