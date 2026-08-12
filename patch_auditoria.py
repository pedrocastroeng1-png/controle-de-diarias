import re

with open('src/pages/admin/AuditoriaPresencas.tsx', 'r') as f:
    content = f.read()

# Replace the attendance photo URL logic to check if photo_taken_at > 20 days
# and set a flag or just use the onError approach.
# It's better to check photo_taken_at.

open_modal_replacement = """  async function openModal(presenca: Presenca) {
    console.log('--- DEBUG AUDITORIA ---');
    console.log('Opening modal for presenca:', presenca);
    console.log('Photo path:', presenca.photo_path);
    
    setSelectedPresenca(presenca);
    setAttendancePhotoUrl('');
    
    try {
      if (presenca.photo_path) {
         // Check if photo is expired (older than 20 days)
         const photoDate = (presenca as any).photo_taken_at ? new Date((presenca as any).photo_taken_at) : new Date(presenca.created_at || presenca.data);
         const twentyDaysAgo = new Date();
         twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
         
         if (photoDate < twentyDaysAgo) {
            console.log('Photo is expired based on retention policy (> 20 days).');
            setAttendancePhotoUrl('EXPIRED');
         } else {
            const bucket = (presenca as any).is_atestado ? 'medical-certificates' : 'attendance-photos';
            console.log(`Generating signed URL for ${bucket}:`, presenca.photo_path);
            const url = await api.getPhotoUrl(bucket, presenca.photo_path);
            console.log('Generated Signed URL:', url);
            setAttendancePhotoUrl(url);
         }
      } else {
         console.log('No photo_path found for this attendance record.');
      }
"""

content = re.sub(r'async function openModal\(presenca: Presenca\) \{[\s\S]*?if \(presenca\.photo_path\) \{[\s\S]*?const url = await api\.getPhotoUrl\([\s\S]*?setAttendancePhotoUrl\(url\);\s*\}\s*else\s*\{\s*console\.log\(\'No photo_path found for this attendance record\.\'\);\s*\}', open_modal_replacement, content)

# Replace rendering
render_replacement = """{attendancePhotoUrl === 'EXPIRED' ? (
                            <span className="text-gray-400 text-sm font-medium flex flex-col items-center">
                              <Camera className="h-12 w-12 text-gray-300 mb-2 opacity-50" />
                              Foto Expirada
                              <span className="text-xs text-gray-400 mt-1">(Retenção de 20 dias)</span>
                            </span>
                          ) : attendancePhotoUrl ? (
                            <img src={attendancePhotoUrl} alt="Presença" className="h-full w-full object-cover" onError={(e) => {
                              console.error('Failed to load image from URL:', attendancePhotoUrl);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
                              e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-xs text-red-500 mt-2 text-center p-2">Foto Expirada ou Inacessível</span>');
                            }} />
                          ) : (
                            <span className="text-gray-400 text-sm font-medium flex flex-col items-center">
                              <User className="h-12 w-12 text-gray-300 mb-2" />
                              Sem Foto
                            </span>
                          )}"""

content = re.sub(r'\{attendancePhotoUrl \? \([\s\S]*?\}\} />[\s\S]*?\) : \([\s\S]*?Sem Foto[\s\S]*?</span>[\s\S]*?\)\}', render_replacement, content)

with open('src/pages/admin/AuditoriaPresencas.tsx', 'w') as f:
    f.write(content)
