import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTenantUser,
  fetchRolesByTenant,
  fetchTenantById,
  fetchUsers,
  PaginatedResponse,
  TenantRole,
  updateTenantUser,
  UserListItem,
} from '../api/backend';
import { useAuth } from '../context/AuthContext';

function Users() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const defaultTenant = user?.tenant ?? '';

  const [tenantSlug, setTenantSlug] = useState(isSuperAdmin ? '' : defaultTenant);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editTenantSlug, setEditTenantSlug] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [editRoles, setEditRoles] = useState<TenantRole[]>([]);
  const [editRolesLoading, setEditRolesLoading] = useState(false);
  const [editRolesError, setEditRolesError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<UserListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = data?.totalPages ?? 1;
  const canCreate = useMemo(() => !!user && (user.isSuperAdmin || user.roles.includes('ADMIN')), [user]);

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

  const loadCreateRoles = useCallback(
    async (slug: string) => {
      if (!slug) {
        setRoles([]);
        setRolesError('Debe indicar un tenant para cargar los roles');
        return;
      }
      setRolesLoading(true);
      setRolesError(null);
      try {
        const result = await fetchRolesByTenant(slug);
        setRoles(result);
        if (result.length === 0) {
          setRolesError('El tenant no posee roles definidos aún.');
        }
      } catch (err) {
        setRolesError(err instanceof Error ? err.message : 'No se pudieron cargar los roles');
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    },
    [],
  );

  const loadEditRoles = useCallback(
    async (slug: string) => {
      if (!slug) {
        setEditRoles([]);
        setEditRolesError('Indica el slug del tenant para cargar roles.');
        return;
      }
      setEditRolesLoading(true);
      setEditRolesError(null);
      try {
        const result = await fetchRolesByTenant(slug);
        setEditRoles(result);
        if (!result.length) {
          setEditRolesError('El tenant no posee roles definidos aún.');
        }
      } catch (err) {
        setEditRolesError(err instanceof Error ? err.message : 'No se pudieron cargar los roles del tenant.');
        setEditRoles([]);
      } finally {
        setEditRolesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadUsers(page);
  }, [page, loadUsers]);

  useEffect(() => {
    if (user && !isSuperAdmin) {
      loadCreateRoles(user.tenant);
    }
  }, [user, isSuperAdmin, loadCreateRoles]);

  useEffect(() => {
    if (roles.length && !roles.some((role) => role.id === roleId)) {
      setRoleId('');
    }
  }, [roles, roleId]);

  useEffect(() => {
    if (editRoles.length && editRoleId && !editRoles.some((role) => role.id === editRoleId)) {
      setEditRoleId('');
    }
  }, [editRoles, editRoleId]);

  useEffect(() => {
    if (isSuperAdmin) {
      setRoles([]);
      setRoleId('');
      setRolesError(null);
    }
  }, [tenantSlug, isSuperAdmin]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;

    if (isSuperAdmin && !tenantSlug.trim()) {
      setCreateError('Debes indicar el slug del tenant.');
      return;
    }

    if (!roleId) {
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
          roleId,
        },
        isSuperAdmin,
      );
      setCreateMessage('Usuario creado correctamente.');
      setName('');
      setEmail('');
      setPassword('');
      setRoleId('');
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
      setEditRoleId('');
      setEditMessage(null);
      setEditError(null);
      setEditRoles([]);
      setEditRolesError(null);

      let slugValue = '';
      if (isSuperAdmin) {
        try {
          const tenant = await fetchTenantById(item.tenantId);
          slugValue = tenant.slug;
        } catch (err) {
          setEditRolesError(
            err instanceof Error ? err.message : 'No se pudo obtener el tenant asociado al usuario.',
          );
        }
      } else {
        slugValue = user?.tenant ?? '';
      }

      setEditTenantSlug(slugValue);
      if (slugValue) {
        await loadEditRoles(slugValue);
      }
    },
    [isSuperAdmin, loadEditRoles, user],
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
    if (editRoleId) {
      payload.roleId = editRoleId;
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
      <p>Listado y creación de usuarios según tus permisos.</p>

      {canCreate && (
        <form className="form" onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <h3>Crear usuario</h3>
          {isSuperAdmin && (
            <label>
              Tenant slug
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  value={tenantSlug}
                  onChange={(event) => setTenantSlug(event.target.value)}
                  placeholder="ej: tecnoedil"
                  style={{ flex: '1 1 220px' }}
                />
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => loadCreateRoles(tenantSlug.trim())}
                  disabled={rolesLoading}
                >
                  {rolesLoading ? 'Cargando...' : 'Cargar roles'}
                </button>
              </div>
            </label>
          )}
          <label>
            Nombre completo
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Contraseña
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
            <select value={roleId} onChange={(event) => setRoleId(event.target.value)} required>
              <option value="">Selecciona un rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          {rolesError && <div className="alert alert--error">{rolesError}</div>}
          <button type="submit" className="button" disabled={creating || rolesLoading}>
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
              Correo electrónico
              <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
            </label>
            <label>
              Contraseña (deja vacío para mantenerla)
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
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    value={editTenantSlug}
                    onChange={(event) => setEditTenantSlug(event.target.value)}
                    placeholder="ej: tecnoedil"
                    style={{ flex: '1 1 220px' }}
                  />
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() => loadEditRoles(editTenantSlug.trim())}
                    disabled={editRolesLoading}
                  >
                    {editRolesLoading ? 'Cargando...' : 'Cargar roles'}
                  </button>
                </div>
              ) : (
                <input value={editTenantSlug} readOnly />
              )}
            </label>
            <label>
              Rol (opcional)
              <select value={editRoleId} onChange={(event) => setEditRoleId(event.target.value)}>
                <option value="">Mantener rol actual</option>
                {editRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            {editRolesError && <div className="alert alert--error">{editRolesError}</div>}
            <button type="submit" className="button" disabled={updating || editRolesLoading}>
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
                  <td>{item.active ? 'Sí' : 'No'}</td>
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
    </section>
  );
}

export default Users;

