import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const hoje = new Date();
const dataStr = format(hoje, 'yyyy-MM-dd');
const sevenDaysAgo = format(subDays(hoje, 6), 'yyyy-MM-dd');

console.log(dataStr, sevenDaysAgo);
