const fs = require('fs');
let content = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

const targetImport = `import { api } from "../../lib/api";`;
const replacementImport = `import { api } from "../../lib/api";\nimport { Feriado } from "../../lib/types";`;
content = content.replace(targetImport, replacementImport);

const targetState = `  const [funcionariosNaoRegistrados, setFuncionariosNaoRegistrados] = useState<
    Funcionario[]
  >([]);`;
const replacementState = `  const [funcionariosNaoRegistrados, setFuncionariosNaoRegistrados] = useState<
    Funcionario[]
  >([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const isFeriado = feriados.some(f => f.data === selectedDate);`;
content = content.replace(targetState, replacementState);

const targetFetch = `        setFuncionarios(funcs);
      } catch (error) {`;
const replacementFetch = `        setFuncionarios(funcs);
        try {
          const fetchedFeriados = await api.getFeriados();
          setFeriados(fetchedFeriados || []);
        } catch(e) { console.error('Erro ao buscar feriados', e); }
      } catch (error) {`;
content = content.replace(targetFetch, replacementFetch);

const targetUI = `          <h2 className="text-xl font-semibold text-gray-800">
            Lista de Funcionários
          </h2>`;
const replacementUI = `          <h2 className="text-xl font-semibold text-gray-800">
            Lista de Funcionários
          </h2>
          {isFeriado && (
            <div className="bg-amber-100 text-amber-800 p-4 rounded-xl font-medium">
              A data selecionada é um Feriado/Folga. O registro de presença não é permitido (todos são marcados como ausentes).
            </div>
          )}`;
content = content.replace(targetUI, replacementUI);

const targetButton = `                    disabled={!isAdmin && jaRegistradoHoje}`;
const replacementButton = `                    disabled={(!isAdmin && jaRegistradoHoje) || isFeriado}`;
content = content.replace(targetButton, replacementButton);

const targetSelect = `                      onChange={(e) => {
                        const val = e.target.value === "true";
                        setPresencas((prev) => ({ ...prev, [f.id]: val }));
                      }}
                      disabled={!isAdmin && temRegistros}
                    >
                      <option value="true">Presente</option>
                      <option value="false">Falta</option>
                    </select>`;
const replacementSelect = `                      onChange={(e) => {
                        const val = e.target.value === "true";
                        setPresencas((prev) => ({ ...prev, [f.id]: val }));
                      }}
                      disabled={(!isAdmin && temRegistros) || isFeriado}
                    >
                      <option value="true">Presente</option>
                      <option value="false">Falta</option>
                    </select>`;
// We will just replace 'disabled={!isAdmin && temRegistros}' with 'disabled={(!isAdmin && temRegistros) || isFeriado}' globally for presenca file? No, better do a global replace in this file.
content = content.replace(/disabled=\{!isAdmin && temRegistros\}/g, `disabled={(!isAdmin && temRegistros) || isFeriado}`);

fs.writeFileSync('src/pages/operador/Presenca.tsx', content);
