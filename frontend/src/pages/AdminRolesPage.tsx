import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createRole,
  deleteRole,
  fetchPermissionsCatalog,
  fetchRolesCatalog,
  fetchUsers,
  syncRolePermissions,
  updateRole,
  type PermissionItem,
  type RoleWithPermissions,
  type UserListItem,
  updateTenantUser,
} from "../api/backend";
import { useAuth } from "../context/AuthContext";

type RoleFormState = {
  tenantSlug: string;
  name: string;
  permissionIds: string[];
};

function AdminRolesPage() {
  const { user } = useAuth();
  const defaultTenant = user?.tenant ?? "";

  const [tenantFilter, setTenantFilter] = useState(user?.isSuperAdmin ? defaultTenant : defaultTenant);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<string[]>([]);
  const [roleForm, setRoleForm] = useState<RoleFormState>({
    tenantSlug: defaultTenant,
    name: "",
    permissionIds: [],
  });
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [roleForUser, setRoleForUser] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId), [roles, selectedRoleId]);

  useEffect(() => {
    setLoadingPermissions(true);
    fetchPermissionsCatalog()
      .then(setPermissions)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los permisos."))
      .finally(() => setLoadingPermissions(false));
  }, []);

  useEffect(() => {
    if (!tenantFilter) return;
    void loadRoles(tenantFilter);
  }, [tenantFilter]);

  useEffect(() => {
    fetchUsers({ limit: 50 })
      .then((response) => setUsers(response.data))
      .catch(() => {
        /* ignore silently to no break UI */
      });
  }, []);

  useEffect(() => {
    if (selectedRole) {
      const ids = selectedRole.RolePermisos.filter((item) => item.allowed).map((item) => item.permiso.id);
      setPermissionsDraft(ids);
    } else {
      setPermissionsDraft([]);
    }
  }, [selectedRole]);

  const loadRoles = async (tenantSlug: string) => {
    setLoadingRoles(true);
    setError(null);
    try {
      const data = await fetchRolesCatalog(tenantSlug);
      setRoles(data);
      if (data.length > 0 && !data.some((role) => role.id === selectedRoleId)) {
        setSelectedRoleId(data[0].id);
      }
      if (editingRoleId && !data.some((role) => role.id === editingRoleId)) {
        setEditingRoleId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los roles.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleForm.name.trim()) {
      setError("Debes indicar un nombre para el rol.");
      return;
    }
    const tenantSlug = roleForm.tenantSlug.trim() || defaultTenant;
    if (!tenantSlug) {
      setError("Necesitas indicar un tenant para crear roles.");
      return;
    }
    setSavingRole(true);
    setError(null);
    setMessage(null);
    try {
      if (editingRoleId) {
        await updateRole(editingRoleId, {
          tenantSlug,
          name: roleForm.name.trim().toUpperCase(),
          permissionIds: roleForm.permissionIds,
        });
        setMessage("Rol actualizado correctamente.");
      } else {
        await createRole({
          tenantSlug,
          name: roleForm.name.trim().toUpperCase(),
          permissionIds: roleForm.permissionIds,
        });
        setMessage("Rol creado correctamente.");
      }
      setRoleForm((prev) => ({ ...prev, name: "", permissionIds: [] }));
      setEditingRoleId(null);
      await loadRoles(tenantSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el rol.");
    } finally {
      setSavingRole(false);
    }
  };

  const toggleRolePermission = (permissionId: string) => {
    setRoleForm((prev) => {
      const exists = prev.permissionIds.includes(permissionId);
      return {
        ...prev,
        permissionIds: exists ? prev.permissionIds.filter((id) => id !== permissionId) : [...prev.permissionIds, permissionId],
      };
    });
  };

  const handleStartEdit = (role: RoleWithPermissions) => {
    setEditingRoleId(role.id);
    setRoleForm({
      tenantSlug: role.tenant?.slug ?? tenantFilter,
      name: role.name,
      permissionIds: role.RolePermisos.filter((edge) => edge.allowed).map((edge) => edge.permiso.id),
    });
    setSelectedRoleId(role.id);
  };

  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setRoleForm((prev) => ({ ...prev, name: "", permissionIds: [] }));
  };

  const handleDeleteRole = async (role: RoleWithPermissions) => {
    if (role.name === "SUPERADMIN") {
      setError("No puedes eliminar el rol SUPERADMIN.");
      return;
    }
    if (!window.confirm(`¿Eliminar el rol ${role.name}?`)) return;
    setError(null);
    setMessage(null);
    try {
      await deleteRole(role.id);
      if (editingRoleId === role.id) {
        handleCancelEdit();
      }
      await loadRoles(tenantFilter || role.tenant?.slug || "");
      setMessage("Rol eliminado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el rol.");
    }
  };

  const toggleDraftPermission = (permissionId: string) => {
    setPermissionsDraft((prev) => {
      const exists = prev.includes(permissionId);
      return exists ? prev.filter((id) => id !== permissionId) : [...prev, permissionId];
    });
  };

  const handleSyncPermissions = async () => {
    if (!selectedRole) return;
    setSavingPermissions(true);
    setError(null);
    setMessage(null);
    try {
      await syncRolePermissions(selectedRole.id, permissionsDraft);
      await loadRoles(tenantFilter);
      setMessage("Permisos sincronizados correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los permisos.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleAssignRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId || !roleForUser) {
      setError("Selecciona un usuario y un rol para continuar.");
      return;
    }
    setAssigningRole(true);
    setError(null);
    setMessage(null);
    try {
      await updateTenantUser(selectedUserId, { roleId: roleForUser });
      setMessage("Rol asignado al usuario.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo asignar el rol.");
    } finally {
      setAssigningRole(false);
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Roles y permisos</h1>
          <p>Define qué acciones puede realizar cada perfil dentro de Talent Flow ATS.</p>
        </div>
      </header>

      {(message || error) && (
        <div className={`alert ${error ? "alert--error" : "alert--success"}`}>
          {error ?? message}
        </div>
      )}

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <div>
              <h2>Roles registrados</h2>
              <p>Filtra por tenant para ver los perfiles disponibles.</p>
            </div>
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                void loadRoles(tenantFilter || defaultTenant);
              }}
            >
              <input
                value={tenantFilter}
                onChange={(event) => setTenantFilter(event.target.value)}
                placeholder="Tenant (slug)"
                disabled={!user?.isSuperAdmin}
              />
              <button type="submit" className="button button--ghost" disabled={loadingRoles}>
                Aplicar
              </button>
            </form>
          </header>

          {loadingRoles ? (
            <p className="muted">Cargando roles...</p>
          ) : roles.length === 0 ? (
            <p className="muted">No hay roles para el tenant indicado.</p>
          ) : (
            <ul className="role-list">
          {roles.map((role) => (
            <li key={role.id} className={`role-list__item${selectedRoleId === role.id ? " selected" : ""}`}>
              <div>
                <p className="role-list__name">{role.name}</p>
                <p className="muted">
                  {role.RolePermisos.filter((permiso) => permiso.allowed).length} permisos
                </p>
                {role.tenant?.slug && <small className="muted">Tenant: {role.tenant.slug}</small>}
              </div>
              <div className="role-list__actions">
                <button type="button" className="button button--ghost" onClick={() => handleStartEdit(role)}>
                  Editar
                </button>
                {role.name !== "SUPERADMIN" && (
                  <button type="button" className="button button--ghost danger" onClick={() => void handleDeleteRole(role)}>
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
            </ul>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Crear o actualizar rol</h2>
            <p>Registra un nuevo rol para tu tenant indicando los permisos iniciales.</p>
          </header>
          <form className="form" onSubmit={handleRoleFormSubmit}>
            <label>
              Tenant (slug)
              <input
                value={roleForm.tenantSlug}
                onChange={(event) => setRoleForm((prev) => ({ ...prev, tenantSlug: event.target.value }))}
                placeholder="ej. root"
                disabled={!user?.isSuperAdmin}
              />
            </label>
            <label>
              Nombre del rol
              <input
                value={roleForm.name}
                onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="ADMIN, RECLUTADOR..."
                required
              />
            </label>

            <fieldset className="form-fieldset">
              <legend>Permisos disponibles</legend>
              {loadingPermissions ? (
                <p className="muted">Cargando permisos...</p>
              ) : (
                <div className="permissions-grid">
                  {permissions.map((permiso) => (
                    <label key={permiso.id} className="checkbox">
                      <input
                        type="checkbox"
                        checked={roleForm.permissionIds.includes(permiso.id)}
                        onChange={() => toggleRolePermission(permiso.id)}
                      />
                      <span>
                        <strong>{permiso.codigo}</strong>
                        <small>{permiso.descripcion ?? "Sin descripción"}</small>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <div className="form__actions">
              {editingRoleId && (
                <button type="button" className="button button--ghost" onClick={handleCancelEdit} disabled={savingRole}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="button" disabled={savingRole}>
                {savingRole ? "Guardando..." : editingRoleId ? "Actualizar rol" : "Guardar rol"}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <div>
              <h2>Permisos del rol seleccionado</h2>
              <p>Activa o desactiva permisos y sincroniza los cambios.</p>
            </div>
          </header>

          {!selectedRole ? (
            <p className="muted">Selecciona un rol para editar los permisos.</p>
          ) : (
            <div className="form">
              <p className="muted">Editando: <strong>{selectedRole.name}</strong></p>
              <div className="permissions-grid">
                {permissions.map((permiso) => (
                  <label key={permiso.id} className="checkbox">
                    <input
                      type="checkbox"
                      checked={permissionsDraft.includes(permiso.id)}
                      onChange={() => toggleDraftPermission(permiso.id)}
                    />
                    <span>
                      <strong>{permiso.codigo}</strong>
                      <small>{permiso.descripcion ?? "Sin descripción"}</small>
                    </span>
                  </label>
                ))}
              </div>
              <button type="button" className="button" onClick={handleSyncPermissions} disabled={savingPermissions}>
                {savingPermissions ? "Sincronizando..." : "Sincronizar permisos"}
              </button>
            </div>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <div>
              <h2>Asignar rol a usuario</h2>
              <p>Actualiza el acceso de usuarios existentes.</p>
            </div>
          </header>

          {users.length === 0 ? (
            <p className="muted">No se pudo cargar la lista de usuarios o no existen registros.</p>
          ) : (
            <form className="form" onSubmit={handleAssignRole}>
              <label>
                Selecciona un usuario
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required>
                  <option value="">Selecciona un usuario</option>
                  {users.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.email} ({item.name_rol ?? "Sin rol"})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Rol a asignar
                <select value={roleForUser} onChange={(event) => setRoleForUser(event.target.value)} required>
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="button" disabled={assigningRole}>
                {assigningRole ? "Actualizando..." : "Asignar"}
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}

export default AdminRolesPage;
