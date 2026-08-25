#!/bin/bash
sed -i '/const registrosToSave = await Promise.all(/i \
      if (!usuario || !usuario.empresa_id) {\
        console.error("Contexto de empresa inválido:", { empresa_id: usuario?.empresa_id, id: usuario?.id, perfil: usuario?.perfil });\
        throw new Error("Empresa não identificada. Atualize sua sessão e tente novamente.");\
      }\
      if (usuario.perfil === "CONSULTA") {\
        throw new Error("Acesso negado: Usuários com perfil CONSULTA não podem registrar presenças.");\
      }\
' src/pages/operador/Presenca.tsx
