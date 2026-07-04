const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function getToken() {
  return localStorage.getItem("taskflow_token");
}

async function request(path, options = {}) {
  const { method = "GET", body, auth = true } = options;
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => {
    throw new Error(
      "Cannot connect to backend. Make sure FastAPI is running at http://127.0.0.1:8000."
    );
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.detail || "Something went wrong. Please try again.";
    throw new Error(Array.isArray(message) ? message[0]?.msg : message);
  }

  return data;
}

export const authApi = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
};

export const tasksApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return request(`/tasks/${query ? `?${query}` : ""}`);
  },
  create: (payload) => request("/tasks/", { method: "POST", body: payload }),
  update: (taskId, payload) => request(`/tasks/${taskId}`, { method: "PUT", body: payload }),
  updateStatus: (taskId, status) =>
    request(`/tasks/${taskId}/status`, { method: "PUT", body: { status } }),
  remove: (taskId) => request(`/tasks/${taskId}`, { method: "DELETE" }),
};

export const dashboardApi = {
  stats: () => request("/dashboard/stats"),
};
