import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTenantUser,
  fetchTenantById,
  fetchUsers,
  PaginatedResponse,
  updateTenantUser,
  UserListItem,
} from '../api/backend';
import { useAuth } from '../context/AuthContext';

type RoleOption = {
  value: string;
  label: string;
  superAdminOnly?: boolean;
};

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'SUPERADMIN', label: 'Root (Superadmin)', superAdminOnly: true },
  { value: 'ADMIN', label: 'Administrador / Gerencia' },
  { value: 'RECLUTADOR', label: 'Reclutador / People Ops' },
];

function Users() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const defaultTenant = user?.tenant ?? '';

  const [tenantSlug, setTenantSlug] = useState(isSuperAdmin ? '' : defaultTenant);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editTenantSlug, setEditTenantSlug] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<UserListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = data?.totalPages ?? 1;
  const canCreate = useMemo(() => !!user && (user.isSuperAdmin || user.roles.includes('ADMIN')), [user]);
  const availableRoleOptions = useMemo(
    () => ROLE_OPTIONS.filter((option) => !option.superAdminOnly || isSuperAdmin),
    [isSuperAdmin],
  );

  const loadUsers = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchUsers({ page: pageToLoad, limit: 10 });
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo obtener la lista de usuarios');
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadUsers(page);
  }, [page, loadUsers]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;

    if (isSuperAdmin && !tenantSlug.trim()) {
      setCreateError('Debes indicar el slug del tenant.');
      return;
    }

    if (!roleName) {
      setCreateError('Selecciona un rol.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateMessage(null);

    try {
      await createTenantUser(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          tenantSlug: isSuperAdmin ? tenantSlug.trim() : undefined,
          roleName,
        },
        isSuperAdmin,
      );
      setCreateMessage('Usuario creado correctamente.');
      setName('');
      setEmail('');
      setPassword('');
      setRoleName('');
      await loadUsers(page);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectUser = useCallback(
    async (item: UserListItem) => {
      setSelectedUser(item);
      setEditName(item.name_usuario);
      setEditEmail(item.email);
      setEditPassword('');
      setEditRoleName('');
      setEditMessage(null);
      setEditError(null);

      if (isSuperAdmin) {
        try {
          const tenant = await fetchTenantById(item.tenantId);
          setEditTenantSlug(tenant.slug);
        } catch (err) {
          setEditTenantSlug('');
          setEditError(err instanceof Error ? err.message : 'No se pudo obtener el tenant del usuario.');
        }
      } else {
        setEditTenantSlug(user?.tenant ?? '');
      }
    },
    [isSuperAdmin, user],
  );

  const handleUpdateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;

    const payload: Parameters<typeof updateTenantUser>[1] = {};

    if (editName.trim() && editName.trim() !== selectedUser.name_usuario) {
      payload.name = editName.trim();
    }
    if (editEmail.trim() && editEmail.trim().toLowerCase() !== selectedUser.email) {
      payload.email = editEmail.trim().toLowerCase();
    }
    if (editPassword.trim()) {
      payload.password = editPassword.trim();
    }
    if (editRoleName) {
      payload.roleName = editRoleName;
    }
    if (isSuperAdmin) {
      if (!editTenantSlug.trim()) {
        setEditError('Debes indicar el slug del tenant para actualizar.');
        return;
      }
      payload.tenantSlug = editTenantSlug.trim();
    }

    if (Object.keys(payload).length === 0) {
      setEditError('No hay cambios para guardar.');
      return;
    }

    setUpdating(true);
    setEditError(null);
    setEditMessage(null);
    try {
      await updateTenantUser(selectedUser.id, payload);
      setEditMessage('Usuario actualizado correctamente.');
      setEditPassword('');
      await loadUsers(page);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="card">
      <h2>Usuarios</h2>
      <p>Listado y creacion de usuarios segun tus permisos.</p>

      {canCreate && (
        <form className="form" onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <h3>Crear usuario</h3>
          {isSuperAdmin && (
            <label>
              Tenant slug
              <input
                value={tenantSlug}
                onChange={(event) => setTenantSlug(event.target.value)}
                placeholder="ej: tecnoedil"
              />
            </label>
          )}
          <label>
            Nombre completo
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Correo electronico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Contrasena
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <label>
            Rol
            <select value={roleName} onChange={(event) => setRoleName(event.target.value)} required>
              <option value="">Selecciona un rol</option>
              {availableRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button" disabled={creating}>
            {creating ? 'Guardando...' : 'Crear usuario'}
          </button>
          {createMessage && <div className="alert alert--success">{createMessage}</div>}
          {createError && <div className="alert alert--error">{createError}</div>}
        </form>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Editar usuario</h3>
        {selectedUser ? (
          <form className="form" onSubmit={handleUpdateUser}>
            <label>
              Nombre completo
              <input value={editName} onChange={(event) => setEditName(event.target.value)} />
            </label>
            <label>
              Correo electronico
              <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
            </label>
            <label>
              Contrasena (deja vacio para mantenerla)
              <input
                type="password"
                value={editPassword}
                onChange={(event) => setEditPassword(event.target.value)}
                minLength={editPassword ? 8 : undefined}
              />
            </label>
            <label>
              Tenant slug
              {isSuperAdmin ? (
                <input
                  value={editTenantSlug}
                  onChange={(event) => setEditTenantSlug(event.target.value)}
                  placeholder="ej: tecnoedil"
                />
              ) : (
                <input value={editTenantSlug} readOnly />
              )}
            </label>
            <label>
              Rol (opcional)
              <select value={editRoleName} onChange={(event) => setEditRoleName(event.target.value)}>
                <option value="">Mantener rol actual</option>
                {availableRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button" disabled={updating}>
              {updating ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {editMessage && <div className="alert alert--success">{editMessage}</div>}
            {editError && <div className="alert alert--error">{editError}</div>}
          </form>
        ) : (
          <p>Selecciona un usuario de la tabla para editarlo.</p>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Tenant</th>
              <th>Activo</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && data?.data?.length ? (
              data.data.map((item) => (
                <tr
                  key={item.id}
                  className={selectedUser?.id === item.id ? 'row-selected' : ''}
                  onClick={() => void handleSelectUser(item)}
                >
                  <td>{item.name_usuario}</td>
                  <td>{item.email}</td>
                  <td>{item.name_rol ?? 'N/A'}</td>
                  <td>{item.name_empresa ?? 'N/A'}</td>
                  <td>{item.active ? 'Si' : 'No'}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>
                    Sin usuarios para mostrar.
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
          Pagina {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}

export default Users;

