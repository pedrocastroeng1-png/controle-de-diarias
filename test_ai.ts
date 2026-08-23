import { interpretPurchaseText } from './src/lib/aiInterpreter.js';

const catalog = {
  materiais: [
    { id: '1', nome: 'Corda', unidade: 'm', categoria_id: 'c1' },
    { id: '2', nome: 'Cimento 40kg', unidade: 'SACO', categoria_id: 'c2' },
    { id: '3', nome: 'Cimento 50kg', unidade: 'SACO', categoria_id: 'c2' },
    { id: '4', nome: 'Bota', unidade: 'PAR', categoria_id: 'c3' },
    { id: '5', nome: 'Argamassa AC2', unidade: 'SACO', categoria_id: 'c2' }
  ],
  obras: [
    { id: 'o1', nome: 'Casa deputado' }
  ],
  funcionarios: [
    { id: 'f1', nome: 'Antonio de Jesus' }
  ]
};

async function run() {
  console.log("TEST 1");
  console.log(await interpretPurchaseText("Comprei 10 metros de corda para Casa deputado", catalog));

  console.log("\nTEST 2");
  console.log(await interpretPurchaseText("Comprei 50 sacos de cimento", catalog));

  console.log("\nTEST 3");
  console.log(await interpretPurchaseText("Comprei uma bota para Antonio de Jesus", catalog));

  console.log("\nTEST 4");
  console.log(await interpretPurchaseText("Comprei 50 sacos de cimento 50kg, 20 sacos de argamassa AC2 e 10 metros de corda para Casa deputado", catalog));
}

run();
