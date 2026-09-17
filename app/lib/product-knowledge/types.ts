export type ValueType = "NUMBER" | "BOOLEAN" | "ENUM" | "TEXT" | "RANGE";
export type KnowledgeStatus = "PM_VERIFIED" | "USER_VERIFIED" | "AI_INFERRED" | "UNKNOWN";
export type ComparisonStatus = "COMPLIANT" | "NON_COMPLIANT" | "UNKNOWN" | "MANUAL_REVIEW" | "PARTIAL";

export type Product = { id:string; productCode:string; manufacturer:string; productName:string; modality:string; systemClass:string; active:boolean; notes?:string; createdAt:string; updatedAt:string };
export type ParameterDefinition = { id:string; canonicalKey:string; labelTr:string; category:string; valueType:ValueType; unit?:string; isCore:boolean; tenderRelevance:string; aliases:string[]; notes?:string; active:boolean };
export type ProductParameterValue = { productId:string; parameterDefinitionId:string; numericValue?:number; booleanValue?:boolean; textValue?:string; enumValue?:string; rangeMin?:number; rangeMax?:number; knowledgeStatus:KnowledgeStatus; updatedAt:string };
export type ProductKnowledgeStore = { products:Product[]; parameters:ParameterDefinition[]; values:ProductParameterValue[] };
export type NormalizedRequirement = { parameterKey:string; operator:">"|">="|"<"|"<="|"="|"between"; value?:number|boolean|string; upperValue?:number; unit?:string };
