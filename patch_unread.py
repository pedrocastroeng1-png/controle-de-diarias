import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_func = """  getUnreadCommunications: async (operatorId: string): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    // Get all mandatory communications that are active, not expired, and target this operator or ALL
    const { data: comms, error: commsError } = await supabase
      .from('communications')
      .select('*, creator:usuarios!created_by(id, usuario), attachments:communication_attachments(*)')
      .eq('is_active', true);
      
    if (commsError) throw commsError;
    
    const validComms = (comms || []).filter(c => {
      // Check expiration
      if (c.expiration_date && c.expiration_date < today) return false;
      // Check audience
      if (c.target_audience === 'OPERATOR' && c.target_operator_id !== operatorId) return false;
      return true;
    });
    
    if (validComms.length === 0) return [];
    
    // Now check which ones have been read
    const { data: reads, error: readsError } = await supabase
      .from('communication_recipients')
      .select('communication_id')
      .eq('operator_id', operatorId)
      .in('communication_id', validComms.map(c => c.id));
      
    if (readsError) throw readsError;
    
    const readIds = new Set((reads || []).map(r => r.communication_id));
    return validComms.filter(c => !readIds.has(c.id)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  },"""

new_func = """  getUnreadCommunications: async (operatorId: string): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    // Get all active communications
    const { data: comms, error: commsError } = await supabase
      .from('communications')
      .select('*, creator:usuarios!created_by(id, usuario), attachments:communication_attachments(*)')
      .eq('is_active', true);
      
    if (commsError) throw commsError;

    // Get all recipient records for this operator
    const commIds = (comms || []).map(c => c.id);
    let reads: any[] = [];
    if (commIds.length > 0) {
      const { data, error: readsError } = await supabase
        .from('communication_recipients')
        .select('communication_id, read_at')
        .eq('operator_id', operatorId)
        .in('communication_id', commIds);
      if (readsError) throw readsError;
      reads = data || [];
    }

    const recipientRecords = new Map(reads.map(r => [r.communication_id, r]));
    
    const validComms = (comms || []).filter(c => {
      // Check expiration
      if (c.expiration_date && c.expiration_date < today) return false;
      
      const rec = recipientRecords.get(c.id);
      
      // Check audience
      if (c.target_audience === 'OPERATOR') {
        // Must be explicitly targeted via target_operator_id or recipient table
        if (c.target_operator_id !== operatorId && !rec) return false;
      }
      
      // Check if read
      if (rec && rec.read_at) return false; // Already read
      
      return true;
    });
    
    return validComms.sort((a, b) => a.created_at.localeCompare(b.created_at));
  },"""

if old_func in content:
    content = content.replace(old_func, new_func)
else:
    print("old_func not found")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

