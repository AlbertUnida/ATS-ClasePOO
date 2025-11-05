
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4050';
const STORAGE_KEY = 'ats_access_token';

const getStoredToken = () => localStorage.getItem(STORAGE_KEY);

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // cuerpo vacío
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export interface LoginResponse {
  access_token: string;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantSlug?: string;
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface CurrentUser {
  id: string;
  tenantId: string;
  tenant: string;
  roles: string[];
  perms: string[];
  isSuperAdmin: boolean;
  email: string;
  tipoUsuario: string;
}

export function fetchCurrentUser() {
  return request<CurrentUser>('/auth/me');
}

export interface VacantePublica {
  id: string;
  tenantId?: string;
  cargoId?: string;
  resumen?: string | null;
  descripcion?: string | null;
  publicSlug?: string | null;
  estado: string;
  tenant: { name: string; slug: string };
  cargo: { id: string; nombre: string };
  visibilidad?: string | null;
  imagenUrl?: string | null;
}

export function fetchVacantesPublicas(tenantSlug: string) {
  const params = new URLSearchParams({ tenant: tenantSlug });
  return request<VacantePublica[]>(`/vacantes/publicas?${params.toString()}`);
}

export interface VacantePrivada extends VacantePublica {
  cargoId: string;
  ubicacion?: string | null;
  tipoContrato?: string | null;
  visibilidad?: string;
  imagenUrl?: string | null;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
}

export function fetchVacantesPorTenant(tenantSlug: string, estado?: string) {
  const params = new URLSearchParams({ tenant: tenantSlug });
  if (estado) params.append('estado', estado);
  return request<VacantePrivada[]>(`/vacantes?${params.toString()}`);
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export function fetchTenants(page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return request<PaginatedResponse<TenantItem>>(`/tenants?${params.toString()}`);
}

export function fetchTenantById(id: string) {
  return request<TenantItem>(`/tenants/${encodeURIComponent(id)}`);
}

export interface TenantRole {
  id: string;
  name: string;
}

export function fetchRolesByTenant(slug: string) {
  return request<TenantRole[]>(`/tenants/${encodeURIComponent(slug)}/roles`);
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
}

export interface UserListItem {
  id: string;
  email: string;
  name_usuario: string;
  tenantId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name_rol: string | null;
  name_empresa: string | null;
}

export function fetchUsers(params: ListUsersParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.append('page', String(params.page));
  if (params.limit) search.append('limit', String(params.limit));
  const suffix = search.toString();
  return request<PaginatedResponse<UserListItem>>(`/auth/users${suffix ? `?${suffix}` : ''}`);
}

export interface CreateTenantPayload {
  name: string;
  slug?: string;
  status?: 'activo' | 'suspendido' | 'archivado';
}

export function createTenant(body: CreateTenantPayload) {
  return request<TenantItem>('/tenants', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

export function updateTenant(id: string, body: UpdateTenantPayload) {
  return request<TenantItem>(`/tenants/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface CreateTenantUserDto {
  name: string;
  email: string;
  password: string;
  tenantSlug?: string;
  roleId?: string;
  roleName?: string;
}

export function createTenantUser(body: CreateTenantUserDto, isSuperAdmin: boolean) {
  const url = isSuperAdmin ? '/auth/users' : '/auth/tenant/users';
  return request<UserListItem>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type UpdateTenantUserPayload = Partial<CreateTenantUserDto>;

export function updateTenantUser(id: string, body: UpdateTenantUserPayload) {
  return request<UserListItem>(`/auth/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface CargoItem {
  id: string;
  nombre: string;
}

export function fetchCargos(tenantSlug?: string) {
  const params = new URLSearchParams();
  if (tenantSlug) params.append('tenant', tenantSlug);
  const suffix = params.toString();
  return request<CargoItem[]>(`/cargos${suffix ? `?${suffix}` : ''}`);
}

export interface CreateCargoPayload {
  nombre: string;
  competencias?: Record<string, any>;
}

export interface CreateVacantePayload {
  cargoId: string;
  ubicacion?: string;
  tipoContrato?: string;
  estado?: 'abierta' | 'pausada' | 'cerrada';
  flujoAprobacion?: Record<string, any>;
  imagenUrl?: string;
}

export function createCargo(body: CreateCargoPayload) {
  return request<CargoItem>('/cargos', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createVacante(body: CreateVacantePayload) {
  return request<VacantePrivada>('/vacantes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type UpdateVacantePayload = Partial<CreateVacantePayload>;

export function updateVacante(id: string, body: UpdateVacantePayload) {
  return request<VacantePrivada>(`/vacantes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadVacanteImagen(id: string, file: File) {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/vacantes/${encodeURIComponent(id)}/imagen`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // noop
    }
    throw new Error(message);
  }

  return (await response.json()) as VacantePrivada;
}

