export async function serverApi<T = any>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
): Promise<T> {
  const token = localStorage.getItem("@diarias:token");
  if (!token)
    throw new Error(
      "Entre novamente para validar sua sessão e carregar os cadastros.",
    );
  const response = await fetch(path, {
    method,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new Error("O servidor não respondeu corretamente. Tente novamente.");
  }
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem("@diarias:token");
    throw new Error(json.error || "Não foi possível carregar os cadastros.");
  }
  return json;
}
