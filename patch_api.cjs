const fs = require('fs');
let api = fs.readFileSync('src/lib/api.ts', 'utf-8');

// We'll append sendAutomationTest to api object before the last closing brace
const insertPoint = api.lastIndexOf('};');
if (insertPoint !== -1) {
  const newMethod = `
  sendAutomationTest: async (params: { title: string; message: string; channels: string[]; userId: string }): Promise<void> => {
    if (!supabase) throw new Error('Supabase not connected');
    const { title, message, channels, userId } = params;

    if (channels.includes('CENTRAL') || channels.includes('PUSH')) {
      const { data: comm, error: commError } = await supabase
        .from('communications')
        .insert({
          title: title || 'Teste de Automação',
          message: message,
          type: 'INFO',
          priority: 'NORMAL',
          target_audience: 'OPERATOR',
          target_operator_id: userId,
          created_by: userId,
          is_active: true
        })
        .select()
        .single();
        
      if (commError) throw commError;

      const { error: recError } = await supabase
        .from('communication_recipients')
        .insert({
          communication_id: comm.id,
          operator_id: userId
        });
        
      if (recError) throw recError;

      if (channels.includes('PUSH')) {
        const { error: pushError } = await supabase.rpc('request_communication_push', {
          p_communication_id: comm.id,
          p_usuario_id: userId
        });
        
        if (pushError) throw pushError;
      }
    }
  },
`;
  api = api.slice(0, insertPoint) + newMethod + api.slice(insertPoint);
  fs.writeFileSync('src/lib/api.ts', api);
}
