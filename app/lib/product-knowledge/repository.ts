import { Pool } from "pg";
import { ProductKnowledgeStore } from "./types";

let pool: Pool | undefined;

function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL yapılandırılmamış.");
  }

  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 20_000,
    max: 3,
  }));
}

const optional = <T>(input: T | null): T | undefined =>
  input === null ? undefined : input;

const isoDate = (input: Date | string): string =>
  input instanceof Date ? input.toISOString() : new Date(input).toISOString();

export async function readProductKnowledge(): Promise<ProductKnowledgeStore> {
  const client = await db().connect();

  try {
    const [products, parameters, values, aliases] = await Promise.all([
      client.query("select * from products order by manufacturer, product_name"),
      client.query(
        "select * from parameter_definitions where active=true order by category, label_tr",
      ),
      client.query("select * from product_parameter_values"),
      client.query("select * from parameter_aliases"),
    ]);

    return {
      products: products.rows.map((row) => ({
        id: row.id,
        productCode: row.product_code,
        manufacturer: row.manufacturer,
        productName: row.product_name,
        modality: row.modality,
        systemClass: row.system_class,
        active: row.active,
        notes: optional(row.notes),
        createdAt: isoDate(row.created_at),
        updatedAt: isoDate(row.updated_at),
      })),
      parameters: parameters.rows.map((row) => ({
        id: row.id,
        canonicalKey: row.canonical_key,
        labelTr: row.label_tr,
        category: row.category,
        valueType: row.value_type,
        unit: optional(row.unit),
        isCore: row.is_core,
        tenderRelevance: row.tender_relevance,
        aliases: aliases.rows
          .filter((alias) => alias.parameter_definition_id === row.id)
          .map((alias) => alias.alias),
        notes: optional(row.notes),
        active: row.active,
      })),
      values: values.rows.map((row) => ({
        productId: row.product_id,
        parameterDefinitionId: row.parameter_definition_id,
        numericValue:
          row.numeric_value === null ? undefined : Number(row.numeric_value),
        booleanValue: optional(row.boolean_value),
        textValue: optional(row.text_value),
        enumValue: optional(row.enum_value),
        rangeMin: row.range_min === null ? undefined : Number(row.range_min),
        rangeMax: row.range_max === null ? undefined : Number(row.range_max),
        knowledgeStatus: row.knowledge_status,
        updatedAt: isoDate(row.updated_at),
      })),
    };
  } finally {
    client.release();
  }
}

export function prepareProductKnowledgeRows(store: ProductKnowledgeStore) {
  const productsById = new Map(
    store.products.map((product) => [product.id, product]),
  );
  const parametersById = new Map(
    store.parameters.map((parameter) => [parameter.id, parameter]),
  );

  const products = store.products.map((product) => ({
    product_code: product.productCode,
    manufacturer: product.manufacturer,
    product_name: product.productName,
    modality: product.modality,
    system_class: product.systemClass,
    active: product.active,
    notes: product.notes ?? null,
  }));

  const parameters = store.parameters.map((parameter) => ({
    canonical_key: parameter.canonicalKey,
    label_tr: parameter.labelTr,
    category: parameter.category,
    value_type: parameter.valueType,
    unit: parameter.unit ?? null,
    is_core: parameter.isCore,
    tender_relevance: parameter.tenderRelevance,
    notes: parameter.notes ?? null,
    active: parameter.active,
  }));

  const aliases = store.parameters.flatMap((parameter) =>
    parameter.aliases.map((alias) => ({
      canonical_key: parameter.canonicalKey,
      alias,
    })),
  );

  const values = store.values.map((item) => {
    const product = productsById.get(item.productId);
    const parameter = parametersById.get(item.parameterDefinitionId);

    if (!product || !parameter) {
      throw new Error("Ürün değeri geçersiz ürün veya parametreye bağlı.");
    }

    return {
      product_code: product.productCode,
      canonical_key: parameter.canonicalKey,
      numeric_value: item.numericValue ?? null,
      boolean_value: item.booleanValue ?? null,
      text_value: item.textValue ?? null,
      enum_value: item.enumValue ?? null,
      range_min: item.rangeMin ?? null,
      range_max: item.rangeMax ?? null,
      knowledge_status: item.knowledgeStatus,
    };
  });

  return { products, parameters, aliases, values };
}

export async function replaceProductKnowledge(
  store: ProductKnowledgeStore,
  sourceFilename?: string,
) {
  const rows = prepareProductKnowledgeRows(store);
  const client = await db().connect();

  try {
    await client.query("begin");

    await client.query(
      `insert into parameter_definitions
        (canonical_key, label_tr, category, value_type, unit, is_core, tender_relevance, notes, active)
       select canonical_key, label_tr, category, value_type, unit, is_core, tender_relevance, notes, active
       from jsonb_to_recordset($1::jsonb) as input(
         canonical_key text, label_tr text, category text, value_type text,
         unit text, is_core boolean, tender_relevance text, notes text, active boolean
       )
       on conflict (canonical_key) do update set
         label_tr=excluded.label_tr,
         category=excluded.category,
         value_type=excluded.value_type,
         unit=excluded.unit,
         is_core=excluded.is_core,
         tender_relevance=excluded.tender_relevance,
         notes=excluded.notes,
         active=excluded.active,
         updated_at=now()`,
      [JSON.stringify(rows.parameters)],
    );

    await client.query(
      `delete from parameter_aliases
       where parameter_definition_id in (
         select id from parameter_definitions
         where canonical_key = any($1::text[])
       )`,
      [rows.parameters.map((parameter) => parameter.canonical_key)],
    );

    await client.query(
      `insert into parameter_aliases
        (parameter_definition_id, alias, normalized_alias)
       select definition.id, input.alias, lower(trim(input.alias))
       from jsonb_to_recordset($1::jsonb) as input(canonical_key text, alias text)
       join parameter_definitions definition
         on definition.canonical_key=input.canonical_key
       on conflict do nothing`,
      [JSON.stringify(rows.aliases)],
    );

    await client.query(
      `insert into products
        (product_code, manufacturer, product_name, modality, system_class, active, notes)
       select product_code, manufacturer, product_name, modality, system_class, active, notes
       from jsonb_to_recordset($1::jsonb) as input(
         product_code text, manufacturer text, product_name text, modality text,
         system_class text, active boolean, notes text
       )
       on conflict (product_code) do update set
         manufacturer=excluded.manufacturer,
         product_name=excluded.product_name,
         modality=excluded.modality,
         system_class=excluded.system_class,
         active=excluded.active,
         notes=excluded.notes,
         updated_at=now()`,
      [JSON.stringify(rows.products)],
    );

    await client.query(
      `insert into product_parameter_values
        (product_id, parameter_definition_id, numeric_value, boolean_value,
         text_value, enum_value, range_min, range_max, knowledge_status, updated_at)
       select product.id, definition.id, input.numeric_value, input.boolean_value,
              input.text_value, input.enum_value, input.range_min, input.range_max,
              input.knowledge_status, now()
       from jsonb_to_recordset($1::jsonb) as input(
         product_code text, canonical_key text, numeric_value numeric,
         boolean_value boolean, text_value text, enum_value text,
         range_min numeric, range_max numeric, knowledge_status text
       )
       join products product on product.product_code=input.product_code
       join parameter_definitions definition
         on definition.canonical_key=input.canonical_key
       on conflict (product_id, parameter_definition_id) do update set
         numeric_value=excluded.numeric_value,
         boolean_value=excluded.boolean_value,
         text_value=excluded.text_value,
         enum_value=excluded.enum_value,
         range_min=excluded.range_min,
         range_max=excluded.range_max,
         knowledge_status=excluded.knowledge_status,
         updated_at=now()`,
      [JSON.stringify(rows.values)],
    );

    if (sourceFilename) {
      await client.query(
        `insert into import_runs
          (source_filename, status, product_count, parameter_count, value_count,
           warning_count, error_count, summary)
         values ($1, 'COMPLETED', $2, $3, $4, 0, 0, $5::jsonb)`,
        [
          sourceFilename,
          store.products.length,
          store.parameters.length,
          store.values.length,
          JSON.stringify({ source: "excel", writeMode: "bulk" }),
        ],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
