const ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export const API_ROOT = `${ORIGIN}/api/v1`;

export const ACCESS_KEY = "ceip_access";
export const REFRESH_KEY = "ceip_refresh";

export async function request(path, { token, body, method = "GET" } = {}) {
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    if (response.status === 401 && token && path !== "/auth/logout") {
      window.dispatchEvent(new CustomEvent("ceip:unauthorized"));
    }
    const detail = payload?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg).join("; ")
          : `Request failed (${response.status})`,
    );
  }
  return payload;
}
