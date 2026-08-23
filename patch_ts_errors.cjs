const fs = require('fs');

// Patch api.ts
let apiCode = fs.readFileSync('src/lib/api.ts', 'utf-8');
const oldLoop = `for (const item of (data || [])) {
      const matId = item.material.id;
      const obraId = item.compra.obra_id;`;

const newLoop = `for (const rawItem of (data || [])) {
      const item: any = rawItem;
      const mat = Array.isArray(item.material) ? item.material[0] : item.material;
      const comp = Array.isArray(item.compra) ? item.compra[0] : item.compra;
      const cat = mat?.category ? (Array.isArray(mat.category) ? mat.category[0] : mat.category) : null;
      const ob = comp?.obra ? (Array.isArray(comp.obra) ? comp.obra[0] : comp.obra) : null;
      
      const matId = mat?.id;
      const obraId = comp?.obra_id;`;

apiCode = apiCode.replace(oldLoop, newLoop);

// Replace remaining item.material and item.compra
apiCode = apiCode.replace(/item\.material\.nome/g, "mat?.nome");
apiCode = apiCode.replace(/item\.material\.unidade/g, "mat?.unidade");
apiCode = apiCode.replace(/item\.material\.categoria_id/g, "mat?.categoria_id");
apiCode = apiCode.replace(/item\.material\.category\?\.nome/g, "cat?.nome");
apiCode = apiCode.replace(/item\.compra\.obra\?\.nome/g, "ob?.nome");
apiCode = apiCode.replace(/item\.compra\.data_compra/g, "comp?.data_compra");
apiCode = apiCode.replace(/item\.compra\.fornecedor/g, "comp?.fornecedor");
// The other references are to item.quantidade, etc which are fine on rawItem but since item is any it will work.

fs.writeFileSync('src/lib/api.ts', apiCode, 'utf-8');

// Patch QuantidadeMateriaisTab.tsx
let tabCode = fs.readFileSync('src/pages/admin/QuantidadeMateriaisTab.tsx', 'utf-8');
tabCode = tabCode.replace("setObras(obrasData.filter(o => o.status === 'ATIVA'));", "setObras(obrasData);");
fs.writeFileSync('src/pages/admin/QuantidadeMateriaisTab.tsx', tabCode, 'utf-8');
