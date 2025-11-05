import { API_BASE_URL } from "./backend";

const CANDIDATE_TOKEN_KEY = "ats_candidate_token";

export const getStoredCandidateToken = () => localStorage.getItem(CANDIDATE_TOKEN_KEY);

export const storeCandidateToken = (token: string) => {
  localStorage.setItem(CANDIDATE_TOKEN_KEY, token);
};

export const clearCandidateToken = () => {
  localStorage.removeItem(CANDIDATE_TOKEN_KEY);
};

async function candidateRequest<TResponse>(
  path: string,
  init: RequestInit = {},
  requireAuth = true,
): Promise<TResponse> {
  const token = getStoredCandidateToken();
  const headers = new Headers(init.headers ?? {});

  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (requireAuth && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "omit",
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

export interface CandidateRegisterPayload {
  name: string;
  email: string;
  password: string;
  telefono?: string;
  cvUrl?: string;
}

export function candidateRegister(payload: CandidateRegisterPayload) {
  return candidateRequest<{ message?: string }>("/auth/candidatos/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export interface CandidateLoginPayload {
  email: string;
  password: string;
}

export interface CandidateLoginResponse {
  access_token: string;
  message: string;
}

export async function candidateLogin(payload: CandidateLoginPayload) {
  const response = await candidateRequest<CandidateLoginResponse>("/auth/candidatos/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);

  storeCandidateToken(response.access_token);
  return response;
}

export async function candidateLogout() {
  try {
    return await candidateRequest<{ message: string }>("/auth/candidatos/logout", {
      method: "POST",
    });
  } finally {
    clearCandidateToken();
  }
}

export interface CandidateProfile {
  id: string;
  nombre?: string;
  email: string;
  telefono?: string;
  cvUrl?: string | null;
  perfil?: Record<string, unknown>;
  tipoUsuario?: string;
}

export function fetchCandidateProfile() {
  return candidateRequest<CandidateProfile>("/auth/candidatos/me");
}

export type UpdateCandidateProfilePayload = {
  nombre?: string;
  telefono?: string;
  cvUrl?: string;
  perfil?: Record<string, unknown>;
};

export function updateCandidateProfile(body: UpdateCandidateProfilePayload) {
  return candidateRequest<CandidateProfile>("/auth/candidatos/me", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export interface CandidatePostulacionPayload {
  tenantSlug: string;
  vacanteId: string;
  fuente?: string;
  mensaje?: string;
  cvExtraUrl?: string;
}

export function postularVacanteComoCandidato(body: CandidatePostulacionPayload) {
  return candidateRequest("/auth/candidatos/postular", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface CandidatePostulacion {
  id: string;
  vacanteId: string;
  estado: string;
  createdAt: string;
  vacante: {
    id: string;
    estado: string;
    tenantId: string;
    cargo?: { nombre: string };
    tenant?: { name: string };
  };
}

export interface CandidatePostulacionesResponse {
  postulaciones: CandidatePostulacion[];
}

export function fetchCandidatePostulaciones() {
  return candidateRequest<CandidatePostulacionesResponse>("/auth/candidatos/postulaciones");
}

export function uploadCandidateCv(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return candidateRequest<CandidateProfile>("/auth/candidatos/cv", {
    method: "POST",
    body: formData,
  });
}
