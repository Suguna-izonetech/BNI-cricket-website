const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function createUser(payload: FormData): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    let errorMessage = "Unable to register player.";
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) errorMessage = data.message;
    } catch {
      // Keep fallback message when response body is not JSON.
    }
    throw new Error(errorMessage);
  }

  return response.json().catch(() => ({}));
}
