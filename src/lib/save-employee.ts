import type { Funcionario } from './types';
import type { TablesUpdate } from '../types/database.generated';
type NewEmployee = Omit<Funcionario, 'id' | 'funcao' | 'obra'>;
type Dependencies = {
  createFuncionario: (payload: NewEmployee) => Promise<Funcionario>;
  updateFuncionario: (id: string, payload: TablesUpdate<'funcionarios'>) => Promise<unknown>;
  uploadEmployeePhoto: (file: File, id: string) => Promise<string>;
};
export async function saveEmployee(api: Dependencies, id: string | null, payload: NewEmployee, photo: File | null, removePhoto: boolean, onCreated: (employee: Funcionario) => void) {
  let employeeId = id;
  if (!employeeId) {
    const created = await api.createFuncionario(payload);
    employeeId = created.id;
    // Keep the committed ID even when a subsequent upload fails: retry edits the same row.
    onCreated(created);
    if (!photo && !removePhoto) return employeeId;
  }
  const update: TablesUpdate<'funcionarios'> = { ...payload };
  if (photo) update.photo_path = await api.uploadEmployeePhoto(photo, employeeId);
  else if (removePhoto) update.photo_path = null;
  await api.updateFuncionario(employeeId, update);
  return employeeId;
}
