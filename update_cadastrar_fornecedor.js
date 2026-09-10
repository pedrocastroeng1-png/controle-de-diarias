import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

const newCatch = `
    } catch (err: any) {
      if (err.message && err.message.includes('já está cadastrado')) {
        alert('Este fornecedor já está cadastrado. Selecionando-o automaticamente...');
        // Refresh and find it
        const fornecedoresData = await api.getFornecedores({ ativo: true });
        setFornecedores(fornecedoresData);
        const existing = fornecedoresData.find(f => f.nome.toLowerCase() === novoFornecedorNome.trim().toLowerCase());
        if (existing) {
          setCompraForm(prev => ({ ...prev, fornecedor_id: existing.id }));
        }
        setShowFornecedorModal(false);
        setNovoFornecedorNome('');
      } else {
        alert('Erro ao cadastrar fornecedor.');
      }
    } finally {
`;

content = content.replace(
/\} catch \(err: any\) \{[\s\S]*?\} finally \{/,
newCatch
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
