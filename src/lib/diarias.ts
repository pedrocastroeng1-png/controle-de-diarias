/** Mirrors the live daily-rate formula; applies the percentage exactly once. */
export function calcularDiaria(registro: {
  presente: boolean;
  tipo_colaborador?: string | null;
  valor_diaria?: number | null;
  percentual_diaria?: number | null;
  tipo_diaria?: string | null;
}): number {
  if (!registro.presente || registro.tipo_colaborador === 'CLT') return 0;
  const valor = registro.valor_diaria ?? 0;
  const percentual = registro.percentual_diaria ?? (registro.tipo_diaria === 'MEIA_DIARIA' ? 50 : 100);
  if (!Number.isFinite(valor) || !Number.isFinite(percentual) || valor < 0 || ![50, 100].includes(percentual)) {
    throw new Error('Valor ou percentual de diária inválido.');
  }
  // Rates are monetary values in cents; avoid rounding a floating half-cent twice.
  const centavos = Math.round(valor * 100);
  return Math.round(centavos * percentual / 100) / 100;
}
