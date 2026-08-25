const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

code = code.replace(
  /getPhotoUrl: async \([\s\S]*?return data\.signedUrl;\n  \},/m,
  `getPhotoUrl: async (
    bucket:
      | "employee-photos"
      | "attendance-photos"
      | "medical-certificates"
      | "fotos_ferramentas",
    path: string,
  ): Promise<string> => {
    if (!supabase) throw new Error("Supabase não configurado");

    console.log(\`[getPhotoUrl] Requesting signed URL - Bucket: \${bucket} | Path: \${path}\`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (error) {
      console.error(\`[getPhotoUrl] Storage error - Bucket: \${bucket} | Path: \${path} | Status: \${(error as any).status} | Message: \${error.message}\`);
      throw error;
    }
    
    console.log(\`[getPhotoUrl] Success - Generated URL for \${path}\`);
    return data.signedUrl;
  },`
);

fs.writeFileSync('src/lib/api.ts', code);
