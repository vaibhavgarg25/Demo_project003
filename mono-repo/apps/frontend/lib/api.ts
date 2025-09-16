const API_BASE_URL = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");

    // Get token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Create a Headers instance from any provided headers (safe + type-friendly)
    const headers = new Headers(options.headers ?? {});

    // Only set Content-Type for JSON bodies where appropriate
    // (Don't set for FormData uploads)
    if (!options.body || typeof options.body === "string") {
      // If there's a string body (JSON), ensure content-type exists
      // Only set it if it isn't already set
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Attempt to parse JSON; adjust if some endpoints return non-JSON
    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.token = response.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
    }

    return response;
  }

  // Trainset operations
  async getTrainsets() {
    return this.request<any[]>("/api/train/getTrains");
  }

  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    // Use Headers only for Authorization — DO NOT set Content-Type for FormData
    const headers = new Headers();
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseUrl}/api/upload/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`CSV upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
