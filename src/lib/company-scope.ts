/** Client scoping only; server authorization must be enforced separately. */
export const getEmpresaId = () => {
  try {
    const userStr = localStorage.getItem("@diarias:usuario");
    if (userStr) {
      return JSON.parse(userStr).empresa_id;
    }
  } catch (e) {}
  return null;
};

export const withEmpresa = <T>(query: T, isAuth = false): T => {
  const empId = getEmpresaId();
  if (!isAuth && !empId) throw new Error('Empresa não identificada. Faça login novamente.');
  if (empId && !isAuth) {
    if (typeof (query as any).eq !== "function") {
      return new Proxy(query as object, {
        get(target, prop) {
          if (["select", "update", "delete"].includes(prop as string)) {
            return (...args: any[]) => {
              const filterBuilder = (target as any)[prop](...args);
              return filterBuilder.eq("empresa_id", empId);
            };
          }
          return (target as any)[prop];
        },
      }) as T;
    }
    return (query as any).eq("empresa_id", empId) as T;
  }
  return query;
};

export const addEmpresaId = (payload: any) => {
  const empId = getEmpresaId();
  if (!empId) throw new Error('Empresa não identificada. Faça login novamente.');
  if (Array.isArray(payload)) {
    return payload.map((p: any) => ({ ...p, empresa_id: p.empresa_id || empId }));
  }
  return { ...payload, empresa_id: payload.empresa_id || empId };
};

