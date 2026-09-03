const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Relatorios.tsx', 'utf8');

// The first table header block:
const targetHeaders = `<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo da Diária</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentual</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor da Diária</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Calculado</th>`;

const newHeaders = `<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra Principal</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subobra</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário / Função</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentual</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Final</th>`;

code = code.replace(targetHeaders, newHeaders);

// The first table data block:
const targetDataBlock = `                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {p.funcionario_nome || p.funcionario}
                          <div className="text-xs text-gray-500">{p.funcao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {p.obra_nome || p.obra}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${statusClass}\`}>
                            {pStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {tipoDiaria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {percent}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(vBase)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(vCalc)}
                        </td>`;

const newDataBlock = `                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                          {p.obra_principal || p.obra_nome || p.obra}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {p.subobra || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {p.funcionario_nome || p.funcionario}
                          <div className="text-xs text-gray-500">{p.funcao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${statusClass}\`}>
                            {pStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {percent}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(vCalc)}
                        </td>`;

code = code.replace(targetDataBlock, newDataBlock);

// The consolidated table header block:
const targetConsolidatedHeaders = `<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obra
                    </th>`;

const newConsolidatedHeaders = `<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obra / Subobra
                    </th>`;

code = code.replace(targetConsolidatedHeaders, newConsolidatedHeaders);

// The consolidated table data block:
const targetConsolidatedData = `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {p.obra_nome || p.obra}
                      </td>`;
const newConsolidatedData = `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-medium text-gray-900">{p.obra_principal || p.obra_nome || p.obra}</div>
                        {p.subobra && <div className="text-xs text-gray-500">{p.subobra}</div>}
                      </td>`;

code = code.replace(targetConsolidatedData, newConsolidatedData);

// The export PDF logic (we can skip fixing the internal PDF structure if it's too complex, but let's try just renaming):
code = code.replace(`['Data', 'Funcionário', 'Função', 'Obra', 'Status', 'Tipo Diária', '%', 'V. Base', 'V. Calc.']`, `['Data', 'Obra Prin.', 'Subobra', 'Funcionário', 'Função', 'Status', '%', 'V. Calc.']`);

code = code.replace(`[
          p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '',
          p.funcionario_nome || p.funcionario,
          p.funcao || '',
          p.obra_nome || p.obra,
          pStatus,
          tipoDiaria,
          percent + '%',
          formatCurrency(vBase),
          formatCurrency(vCalc)
        ]`, `[
          p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '',
          p.obra_principal || p.obra_nome || p.obra || '',
          p.subobra || '-',
          p.funcionario_nome || p.funcionario || '',
          p.funcao || '',
          pStatus,
          percent + '%',
          formatCurrency(vCalc)
        ]`);

fs.writeFileSync('src/pages/admin/Relatorios.tsx', code);
