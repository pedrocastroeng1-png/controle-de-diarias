/** Brazilian WhatsApp destination, stored with country code; blank remains optional. */
export function normalizeWhatsAppPhone(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || /[^\d\s()+-]/.test(value)) {
    throw new Error('Informe um WhatsApp brasileiro válido, com DDD.');
  }
  let digits = value.replace(/\D/g, '');
  if (!digits) {
    if (!value.trim()) return null;
    throw new Error('Informe um WhatsApp brasileiro válido, com DDD.');
  }
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digits)) {
    throw new Error('Informe um WhatsApp brasileiro válido, com DDD. Ex.: (82) 99999-9999.');
  }
  return digits;
}

export function whatsAppLink(phone: string, message: string): string {
  const destination = normalizeWhatsAppPhone(phone);
  if (!destination) throw new Error('Informe o WhatsApp do destinatário.');
  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}
