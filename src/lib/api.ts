const TOKEN_KEY = "admin_token";

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  isFormData?: boolean;
};

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const apiRequest = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {};
  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body
      ? options.isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
  });

  if (!response.ok) {
    let message = `Ошибка ${response.status}`;
    const text = await response.text();
    if (text) {
      try {
        const errorPayload = JSON.parse(text);
        message = errorPayload.error || errorPayload.message || message;
      } catch {
        const trimmed = text.trim().slice(0, 200);
        message = trimmed || message;
      }
    }
    if (
      response.status === 404 &&
      (!message ||
        message.startsWith("Ошибка 404") ||
        message[0] === "<" ||
        message.includes("Cannot GET") ||
        message.includes("Cannot POST"))
    ) {
      message =
        "Сервер не нашёл маршрут (404). Перезапустите API (npm run dev:api), чтобы подтянулись последние изменения.";
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const authApi = {
  async login(email: string, password: string) {
    const data = await apiRequest<{ token: string; user: { id: string; email: string } }>(
      "/api/auth/login",
      {
        method: "POST",
        body: { email, password },
      },
    );
    setToken(data.token);
    return data.user;
  },
  async getSession(): Promise<{ user: { id: string; email: string } | null }> {
    const token = getToken();
    if (!token) return { user: null };
    try {
      return await apiRequest<{ user: { id: string; email: string } }>("/api/auth/session", { auth: true });
    } catch (_error) {
      clearToken();
      return { user: null };
    }
  },
  logout() {
    clearToken();
  },
  getToken,
};

export { apiRequest };
