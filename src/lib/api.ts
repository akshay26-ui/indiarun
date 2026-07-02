const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token") || "";
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // --- MOCK AUTHENTICATION FOR UI PROTOTYPING ---
  if (endpoint.startsWith("/auth/signup") || endpoint.startsWith("/auth/login")) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ access_token: "mock-jwt-token-123" });
      }, 800); // 800ms delay to simulate network request
    });
  }
  // ----------------------------------------------

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    // Optional: auto-logout on 401
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  if (!response.ok) {
    let message = "An error occurred";
    try {
      const errData = await response.json();
      message = errData.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}
