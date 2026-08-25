#!/bin/bash
perl -pi -e 's/(\?\.\w+)?\n(\s+)data: selectedDate,/$1,\n$2empresa_id: usuario?.empresa_id,\n$2data: selectedDate,/g' src/pages/operador/Presenca.tsx
