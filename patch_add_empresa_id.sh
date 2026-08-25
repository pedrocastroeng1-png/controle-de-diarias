#!/bin/bash
sed -i 's/return payload.map((p) => ({ ...p, empresa_id: empId }));/return payload.map((p) => ({ ...p, empresa_id: p.empresa_id || empId }));/' src/lib/api.ts
sed -i 's/return { ...payload, empresa_id: empId };/return { ...payload, empresa_id: payload.empresa_id || empId };/' src/lib/api.ts
