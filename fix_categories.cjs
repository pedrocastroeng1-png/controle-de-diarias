const fs = require('fs');
let content = fs.readFileSync('src/lib/api.ts', 'utf8');

content = content.replace(
  /getMaterialCategories:\s*async\s*\(\):\s*Promise<any\[\]>\s*=>\s*{\s*if\s*\(!supabase\)\s*throw\s*new\s*Error\("Supabase não configurado"\);\s*const\s*{\s*data,\s*error\s*}\s*=\s*await\s*withEmpresa\(\s*supabase\.from\("material_categories"\),\s*\)\s*\.select\("\*"\)/,
  `getMaterialCategories: async (): Promise<any[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await withEmpresa(
      supabase.from("material_categories"),
    )
      .select("*")
      .eq("ativo", true)`
);
fs.writeFileSync('src/lib/api.ts', content);
