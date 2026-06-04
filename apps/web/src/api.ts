import type {
  AuthUserResponse,
  GalleryImage,
  ImageListResponse,
  ImageUpdateBody,
  LoginBody,
  RegisterBody
} from "@artmuseum/shared";
import { ErrorCodes, type ErrorCode } from "@artmuseum/shared";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode
  ) {
    super(code);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: init.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init.headers }
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const code = data?.error?.code ?? ErrorCodes.BadRequest;
    throw new ApiClientError(response.status, code);
  }
  return data as T;
}

export const api = {
  listImages: () => apiFetch<ImageListResponse>("/api/images"),
  getMe: () => apiFetch<AuthUserResponse>("/api/auth/me"),
  register: (body: RegisterBody) =>
    apiFetch<AuthUserResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  login: (body: LoginBody) =>
    apiFetch<AuthUserResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  logout: () =>
    apiFetch<void>("/api/auth/logout", {
      method: "POST"
    }),
  uploadImage: (body: FormData) =>
    apiFetch<GalleryImage>("/api/images", {
      method: "POST",
      body
    }),
  myImages: () => apiFetch<ImageListResponse>("/api/images/mine"),
  updateImage: (id: string, body: ImageUpdateBody) =>
    apiFetch<GalleryImage>(`/api/images/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  deleteImage: (id: string) =>
    apiFetch<void>(`/api/images/${id}`, {
      method: "DELETE"
    })
};
