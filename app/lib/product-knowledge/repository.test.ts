import { describe, expect, it } from "vitest";
import { prepareProductKnowledgeRows } from "./repository";
import { ProductKnowledgeStore } from "./types";

const store: ProductKnowledgeStore = {
  products: [
    {
      id: "product-client-id",
      productCode: "DEMO-RF-A",
      manufacturer: "DemoMed",
      productName: "Demo RF",
      modality: "FLUOROSCOPY",
      systemClass: "REMOTE_CONTROLLED_RF",
      active: true,
      createdAt: "2026-09-17T00:00:00.000Z",
      updatedAt: "2026-09-17T00:00:00.000Z",
    },
  ],
  parameters: [
    {
      id: "parameter-client-id",
      canonicalKey: "generator.power_kw",
      labelTr: "Jeneratör gücü",
      category: "Jeneratör",
      valueType: "NUMBER",
      unit: "kW",
      isCore: true,
      tenderRelevance: "Çok Yüksek",
      aliases: ["Generator power"],
      active: true,
    },
  ],
  values: [
    {
      productId: "product-client-id",
      parameterDefinitionId: "parameter-client-id",
      numericValue: 0,
      knowledgeStatus: "PM_VERIFIED",
      updatedAt: "2026-09-17T00:00:00.000Z",
    },
  ],
};

describe("prepareProductKnowledgeRows", () => {
  it("client kimliklerini canonical anahtarlara çevirir ve sıfırı korur", () => {
    const rows = prepareProductKnowledgeRows(store);

    expect(rows.products).toHaveLength(1);
    expect(rows.parameters).toHaveLength(1);
    expect(rows.aliases).toEqual([
      {
        canonical_key: "generator.power_kw",
        alias: "Generator power",
      },
    ]);
    expect(rows.values[0]).toMatchObject({
      product_code: "DEMO-RF-A",
      canonical_key: "generator.power_kw",
      numeric_value: 0,
      knowledge_status: "PM_VERIFIED",
    });
  });

  it("geçersiz ürün-parametre bağlantısını reddeder", () => {
    expect(() =>
      prepareProductKnowledgeRows({
        ...store,
        values: [{ ...store.values[0], productId: "missing" }],
      }),
    ).toThrow("geçersiz ürün veya parametreye bağlı");
  });
});
