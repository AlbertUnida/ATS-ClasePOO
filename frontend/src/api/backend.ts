
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
      // cuerpo vac�o
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

export interface PermissionItem {
  id: string;
  codigo: string;
  descripcion?: string | null;
}

export interface RolePermissionEdge {
  permiso: PermissionItem;
  allowed: boolean;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  tenantId: string;
  tenant?: { slug: string; name: string };
  RolePermisos: RolePermissionEdge[];
}

export function fetchRolesCatalog(tenantSlug?: string) {
  const params = tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : "";
  return request<RoleWithPermissions[]>(`/roles-permisos${params}`);
}

export function fetchPermissionsCatalog() {
  return request<PermissionItem[]>(`/roles-permisos/permisos/list`);
}

export interface CreateRolePayload {
  tenantSlug: string;
  name: string;
  permissionIds?: string[];
}

export function createRole(payload: CreateRolePayload) {
  return request<RoleWithPermissions>(`/roles-permisos`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function syncRolePermissions(roleId: string, permissionIds: string[]) {
  return request<RoleWithPermissions>(`/roles-permisos/${encodeURIComponent(roleId)}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  });
}

export function updateRole(roleId: string, body: Partial<CreateRolePayload>) {
  return request<RoleWithPermissions>(`/roles-permisos/${encodeURIComponent(roleId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteRole(roleId: string) {
  return request<{ message: string }>(`/roles-permisos/${encodeURIComponent(roleId)}`, {
    method: 'DELETE',
  });
}

export interface CandidateScore {
  id: string;
  puntajeTotal: number;
  detalleJson?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidatePostulacionSummary {
  id: string;
  estado: string;
  vacanteId: string;
  createdAt: string;
  vacante?: {
    id: string;
    estado?: string;
    tenant?: { name: string; slug: string };
    cargo?: { nombre: string };
  };
  entrevistas?: Array<{
    id: string;
    tipo?: string;
    inicioTs?: string;
    finTs?: string;
    canal?: string;
    resultado?: string;
  }>;
  feedbacks?: Array<{
    id: string;
    puntaje?: number;
    comentario?: string;
    recomendacion?: boolean;
    ts?: string;
  }>;
  eventos?: Array<{
    id: string;
    estadoFrom?: string | null;
    estadoTo?: string | null;
    motivo?: string | null;
    inicioTs?: string | null;
    finTs?: string | null;
  }>;
}

export interface CandidateListItem {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  cvUrl?: string | null;
  tenantId?: string | null;
  createdAt: string;
  updatedAt: string;
  perfil?: Record<string, any> | null;
  score?: CandidateScore | null;
  postulaciones: CandidatePostulacionSummary[];
}

export type CandidateListResponse = PaginatedResponse<CandidateListItem>;

export interface FetchCandidatesParams {
  tenant: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function fetchCandidates(params: FetchCandidatesParams) {
  const searchParams = new URLSearchParams();
  searchParams.append('tenant', params.tenant);
  if (params.search) searchParams.append('search', params.search);
  if (params.page) searchParams.append('page', String(params.page));
  if (params.limit) searchParams.append('limit', String(params.limit));
  return request<CandidateListResponse>(`/candidatos?${searchParams.toString()}`);
}

export type CandidateDetail = CandidateListItem & {
  tenant?: { id: string; slug: string; name: string } | null;
};

export function fetchCandidateDetail(id: string) {
  return request<CandidateDetail>(`/candidatos/${encodeURIComponent(id)}`);
}

export interface PostulacionItem {
  id: string;
  estado: string;
  vacanteId: string;
  candidatoId: string;
  createdAt: string;
  updatedAt: string;
  vacante?: {
    id: string;
    estado: string;
    tenantId: string;
    cargo?: { nombre: string };
  };
  candidato?: {
    id: string;
    nombre: string;
    email: string;
  };
}

export interface FetchPostulacionesParams {
  tenant: string;
  vacanteId?: string;
  candidatoId?: string;
  estado?: string;
}

export function fetchPostulaciones(params: FetchPostulacionesParams) {
  const searchParams = new URLSearchParams();
  searchParams.append('tenant', params.tenant);
  if (params.vacanteId) searchParams.append('vacanteId', params.vacanteId);
  if (params.candidatoId) searchParams.append('candidatoId', params.candidatoId);
  if (params.estado) searchParams.append('estado', params.estado);
  return request<PostulacionItem[]>(`/postulaciones?${searchParams.toString()}`);
}

export interface EmailTemplate {
  id: string;
  name: string;
  code: string;
  subject: string;
  body: string;
  channel: string;
  active: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  trigger: string;
  action: string;
  conditionsJson?: Record<string, any> | null;
  actionConfigJson?: Record<string, any> | null;
  active: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTenantParams {
  tenant: string;
}

export function fetchEmailTemplates(params: AutomationTenantParams) {
  const search = new URLSearchParams({ tenant: params.tenant });
  return request<EmailTemplate[]>(`/automations/templates?${search.toString()}`);
}

export function createEmailTemplate(body: {
  tenantSlug: string;
  name: string;
  code: string;
  subject: string;
  body: string;
}) {
  return request<EmailTemplate>(`/automations/templates`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateEmailTemplate(id: string, body: Partial<EmailTemplate> & { tenantSlug?: string }) {
  return request<EmailTemplate>(`/automations/templates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function fetchAutomationRules(params: AutomationTenantParams) {
  const search = new URLSearchParams({ tenant: params.tenant });
  return request<AutomationRule[]>(`/automations/rules?${search.toString()}`);
}

export function createAutomationRule(body: {
  tenantSlug: string;
  name: string;
  trigger: string;
  action: string;
  description?: string;
  conditionsJson?: Record<string, any>;
  actionConfigJson?: Record<string, any>;
}) {
  return request<AutomationRule>(`/automations/rules`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateAutomationRule(id: string, body: Partial<AutomationRule> & { tenantSlug?: string }) {
  return request<AutomationRule>(`/automations/rules/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface EntrevistaItem {
  id: string;
  postulacionId: string;
  tipo: string;
  inicioTs: string;
  finTs: string;
  canal?: string | null;
  resultado?: string | null;
  notas?: string | null;
  postulacion?: {
    id: string;
    vacante?: { cargo?: { nombre?: string } };
    candidato?: { nombre?: string; email?: string };
  };
}

export function fetchEntrevistas(params: { tenant: string; postulacionId?: string; tipo?: string; resultado?: string }) {
  const searchParams = new URLSearchParams({ tenant: params.tenant });
  if (params.postulacionId) searchParams.append('postulacionId', params.postulacionId);
  if (params.tipo) searchParams.append('tipo', params.tipo);
  if (params.resultado) searchParams.append('resultado', params.resultado);
  return request<EntrevistaItem[]>(`/entrevistas?${searchParams.toString()}`);
}

export interface CreateEntrevistaPayload {
  tenantSlug: string;
  postulacionId: string;
  tipo: string;
  inicioTs: string;
  finTs: string;
  canal?: string;
  resultado?: string;
  notas?: string;
}

export function createEntrevista(body: CreateEntrevistaPayload) {
  return request<EntrevistaItem>(`/entrevistas`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateEntrevista(id: string, body: Partial<CreateEntrevistaPayload>) {
  return request<EntrevistaItem>(`/entrevistas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface FeedbackItem {
  id: string;
  postulacionId: string;
  puntaje: number;
  comentario?: string | null;
  recomendacion?: boolean | null;
  competenciasJson?: Record<string, any> | null;
  evaluadorUserId?: string | null;
  ts: string;
  postulacion?: {
    id: string;
    vacante?: { cargo?: { nombre?: string } };
    candidato?: { nombre?: string };
  };
}

export function fetchFeedbacks(params: { tenant: string; postulacionId?: string; evaluadorUserId?: string }) {
  const searchParams = new URLSearchParams({ tenant: params.tenant });
  if (params.postulacionId) searchParams.append('postulacionId', params.postulacionId);
  if (params.evaluadorUserId) searchParams.append('evaluadorUserId', params.evaluadorUserId);
  return request<FeedbackItem[]>(`/feedbacks?${searchParams.toString()}`);
}

export interface CreateFeedbackPayload {
  tenantSlug: string;
  postulacionId: string;
  puntaje: number;
  competenciasJson?: Record<string, any>;
  comentario?: string;
  recomendacion?: boolean;
}

export function createFeedback(body: CreateFeedbackPayload) {
  const payload = {
    ...body,
    competenciasJson: body.competenciasJson ? JSON.stringify(body.competenciasJson) : undefined,
  };
  return request<FeedbackItem>(`/feedbacks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFeedback(id: string, body: Partial<CreateFeedbackPayload>) {
  const payload = {
    ...body,
    competenciasJson: body.competenciasJson ? JSON.stringify(body.competenciasJson) : undefined,
  };
  return request<FeedbackItem>(`/feedbacks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export interface ReportOverview {
  tenant: string;
  totals: {
    vacantes: number;
    vacantesAbiertas: number;
    candidatos: number;
    postulaciones: number;
    entrevistasProximas: number;
    promedioDiasContratacion: number | null;
  };
  postulacionesPorEstado: Array<{ estado: string; total: number }>;
  timeline: Array<{ period: string; total: number }>;
}

export function fetchReportOverview(params: { tenant: string; from?: string; to?: string }) {
  const search = new URLSearchParams({ tenant: params.tenant });
  if (params.from) search.append('from', params.from);
  if (params.to) search.append('to', params.to);
  return request<ReportOverview>(`/reports/overview?${search.toString()}`);
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



export function fetchVacantesPublicasTodas(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request<VacantePublica[]>(`/vacantes/publicas/todas${query}`);
}
