
const integerStringRegex = /^[0-9]+$/;
const decimalStringRegex = /^[0-9]+.?[0-9]*$/;

export function isPrimitiveTypeValueValid(property: any, typeName: string): boolean {
  const normalizedTypeName = makeNormalizedPrimitiveTypeName(typeName);
  if (normalizedTypeName === "integer") {
    // rejects non-int numbers and accepts int strings
    return integerStringRegex.test(property.toString());
  }
  if (normalizedTypeName === "double" || normalizedTypeName === "long"){
    return decimalStringRegex.test(property.toString());
  }
  if (normalizedTypeName === "boolean") {
    return (
      typeof property === "boolean" ||
      property === "true" ||
      property === "false"
    );
  }
  return typeof property === normalizedTypeName;
}

export function makeNormalizedPrimitiveTypeName(typeName: string): string {
  if (typeof typeName !== "string") {
    return "unknown";
  }
  const loweredTypeName = typeName.toLowerCase();
  switch (loweredTypeName) {
    case "timestamp":
      return "number";
    case "json":
      return "string";
    default:
      return loweredTypeName;
  }
}
