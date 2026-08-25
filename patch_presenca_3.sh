#!/bin/bash
sed -i 's/data: selectedDate,/empresa_id: usuario?.empresa_id,\n                            data: selectedDate,/' src/pages/operador/Presenca.tsx
