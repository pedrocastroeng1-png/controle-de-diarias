import { normalizeParsedPurchaseResponse } from './src/lib/aiInterpreter';

function assertDeepEqual(a: any, b: any, msg: string) {
  const as = JSON.stringify(a);
  const bs = JSON.stringify(b);
  if (as !== bs) {
    throw new Error(`${msg}\nExpected: ${bs}\nActual:   ${as}`);
  }
}

async function runTests() {
  console.log("Running normalization tests...");

  // Test 1: Valid structure
  const mock1 = {
    obra_id: "obra-1",
    obra_nome: "Casa deputado",
    items: [
      {
        material_id: "mat-1",
        material_nome: "Cimento 50kg",
        quantidade: 50,
        unidade: "SACO",
        funcionario_id: null,
        confidence: 0.95,
        needs_confirmation: false
      }
    ],
    data: null,
    fornecedor: null,
    recibo: null,
    observacao: null
  };

  const res1 = normalizeParsedPurchaseResponse(mock1);
  if (res1.items.length !== 1 || res1.items[0].quantidade !== 50 || res1.obra_id !== "obra-1") {
    throw new Error("Test 1 failed.");
  }

  // Test 2: Invalid structure (no items)
  try {
    normalizeParsedPurchaseResponse({ obra_id: "1" });
    throw new Error("Should have thrown error for missing items.");
  } catch (e: any) {
    if (!e.message.includes("Não foi possível interpretar")) {
      throw new Error("Wrong error message for missing items");
    }
  }

  // Test 3: Null quantity, null material_id, ambiguous
  const mock3 = {
    items: [
      {
        material_id: null,
        quantidade: null,
        ambiguous_materials: [
          { id: "1", nome: "M1" },
          { id: "2", nome: "M2", unidade: "kg" }
        ]
      }
    ]
  };

  const res3 = normalizeParsedPurchaseResponse(mock3);
  if (res3.items[0].quantidade !== null) throw new Error("Quant should be null");
  if (res3.items[0].ambiguous_materials?.length !== 2) throw new Error("Ambiguous materials length mismatch");
  if (res3.items[0].ambiguous_materials[1].unidade !== "kg") throw new Error("Ambiguous material wrong un");

  // Test 4: Missing optional fields & strange values
  const mock4 = {
    items: [
      null,
      "invalid string item",
      {
        quantidade: "NaN",
        confidence: "high"
      }
    ]
  };
  const res4 = normalizeParsedPurchaseResponse(mock4);
  if (res4.items.length !== 3) throw new Error("Items length mismatch");
  if (res4.items[0].needs_confirmation !== true) throw new Error("Null item should need confirmation");
  if (res4.items[1].needs_confirmation !== true) throw new Error("String item should need confirmation");
  if (res4.items[2].quantidade !== null) throw new Error("NaN quantity should be null");
  if (res4.items[2].confidence !== 0) throw new Error("Invalid confidence should be 0");

  console.log("All tests passed!");
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
