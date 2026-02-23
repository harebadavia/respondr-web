// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

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

  if (!response.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        data.message) ||
      (typeof data === "string" && data) ||
      "API request failed";
    throw new Error(message);
  }

  return data;
}