import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const RETRYABLE_AUTH_PATTERNS = ["token expired", "id-token-expired", "auth/id-token-expired"];
let inflightTokenRefresh = null;

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  let data;

  if (response.status === 204 || response.status === 205) {
    // No Content responses: do not attempt to parse a body
    data = null;
  } else if (contentType.includes("application/json")) {
    // Safely attempt to parse JSON when indicated by Content-Type
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    // Fallback: read as text and wrap in an object to preserve message semantics
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  return data;
}

function responseErrorMessage(data) {
  return (
    (data &&
      typeof data === "object" &&
      "message" in data &&
      data.message) ||
    (typeof data === "string" && data) ||
    "API request failed"
  );
}

function shouldRetryAuth(response, data) {
  if (response.status !== 401) return false;
  const message = String(responseErrorMessage(data) || "").toLowerCase();
  return RETRYABLE_AUTH_PATTERNS.some((pattern) => message.includes(pattern));
}

async function getFreshAuthHeader(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication required");
  }

  if (forceRefresh) {
    if (!inflightTokenRefresh) {
      inflightTokenRefresh = user
        .getIdToken(true)
        .finally(() => {
          inflightTokenRefresh = null;
        });
    }
    await inflightTokenRefresh;
  }

  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function executeRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(responseErrorMessage(data));
    error.response = response;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiRequest(endpoint, options = {}) {
  try {
    return await executeRequest(endpoint, options);
  } catch (err) {
    throw new Error(err?.message || "API request failed");
  }
}

export async function apiAuthRequest(endpoint, options = {}) {
  try {
    const authHeaders = await getFreshAuthHeader(false);
    return await executeRequest(endpoint, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...authHeaders,
      },
    });
  } catch (err) {
    const response = err?.response;
    const data = err?.data;

    if (response && shouldRetryAuth(response, data)) {
      try {
        const refreshedHeaders = await getFreshAuthHeader(true);
        return await executeRequest(endpoint, {
          ...options,
          headers: {
            ...(options.headers || {}),
            ...refreshedHeaders,
          },
        });
      } catch (retryErr) {
        throw new Error(retryErr?.message || "API request failed");
      }
    }

    throw new Error(err?.message || "API request failed");
  }
}
