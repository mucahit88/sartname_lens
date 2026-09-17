import { ComparisonStatus, NormalizedRequirement, ParameterDefinition, ProductParameterValue } from "./types";

export type ComparisonResult = { status:ComparisonStatus; reason:string; productValue?:number|boolean|string; requirement:NormalizedRequirement };
export function compareRequirement(requirement:NormalizedRequirement, definition:ParameterDefinition, productValue?:ProductParameterValue):ComparisonResult {
  if (!productValue || productValue.knowledgeStatus === "UNKNOWN") return {status:"UNKNOWN",reason:"Ürün bilgisi bilinmiyor.",requirement};
  if (requirement.unit && definition.unit && requirement.unit !== definition.unit) return {status:"MANUAL_REVIEW",reason:"Birimler güvenli biçimde karşılaştırılamıyor.",requirement};
  const value = definition.valueType === "NUMBER" ? productValue.numericValue : definition.valueType === "BOOLEAN" ? productValue.booleanValue : definition.valueType === "ENUM" ? productValue.enumValue : productValue.textValue;
  if (value === undefined || value === null) return {status:"UNKNOWN",reason:"Ürün için doğrulanmış değer yok.",requirement};
  if (definition.valueType === "NUMBER") {
    if (typeof value !== "number" || typeof requirement.value !== "number") return {status:"MANUAL_REVIEW",reason:"Sayısal gereksinim geçersiz.",requirement};
    const pass = requirement.operator === ">" ? value > requirement.value : requirement.operator === ">=" ? value >= requirement.value : requirement.operator === "<" ? value < requirement.value : requirement.operator === "<=" ? value <= requirement.value : requirement.operator === "=" ? value === requirement.value : value >= requirement.value && value <= (requirement.upperValue ?? requirement.value);
    return {status:pass?"COMPLIANT":"NON_COMPLIANT",reason:pass?"Deterministik sayısal kontrol sağlandı.":"Deterministik sayısal kontrol sağlanmadı.",productValue:value,requirement};
  }
  if (definition.valueType === "BOOLEAN") {
    if (typeof requirement.value !== "boolean" || typeof value !== "boolean") return {status:"MANUAL_REVIEW",reason:"Boolean gereksinim geçersiz.",requirement};
    return {status:value===requirement.value?"COMPLIANT":"NON_COMPLIANT",reason:value===requirement.value?"Boolean değer eşleşiyor.":"Boolean değer eşleşmiyor.",productValue:value,requirement};
  }
  if (definition.valueType === "ENUM") return {status:String(value).trim().toUpperCase()===String(requirement.value).trim().toUpperCase()?"COMPLIANT":"NON_COMPLIANT",reason:"Enum değeri karşılaştırıldı.",productValue:String(value),requirement};
  return {status:"MANUAL_REVIEW",reason:"Bu değer tipi için otomatik kural tanımlı değil.",requirement};
}
