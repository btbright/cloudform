// @flow
import specData from "../data/spec.json";

export type Specification = ResourceSpecification | PropertySpecification;

export type ResourceSpecification = {
  SpecificationType: string,
  Properties: PropertiesCollection<ResourceProperties>,
  Attributes: ?PropertiesCollection<AttributeProperties>
};

type PropertySpecification = {
  SpecificationType: string,
  Properties: PropertiesCollection<ResourceProperties>
};

export type PropertiesCollection<T> = { [key: string]: T };

type AttributeProperties = {
  ItemType: ?string,
  PrimitiveType: ?string,
  PrimitiveItemType: ?string,
  Type: ?string
};

export type ResourceProperties = {
  Required: boolean,
  DuplicatesAllowed: ?boolean,
  ItemType: ?string,
  PrimitiveType: ?string,
  PrimitiveItemType: ?string,
  Type: ?string
};

export function getResourceSpecification(
  resourceSpecificationKey: string
): ?ResourceSpecification {
  const compactType = specData.r[resourceSpecificationKey];
  if (!compactType) return
  return parseCompactResourceSpecification(compactType, "Resource");
}

export function getPropertySpecification(
  propertySpecificationKey: string
): PropertySpecification {
  const compactType = specData.p[propertySpecificationKey];
  return parseCompactResourceSpecification(compactType, "Property");
}

const finalPropertyKeys = {
  req: "Required",
  da: "DuplicatesAllowed",
  t: "Type",
  pt: "PrimitiveType",
  it: "ItemType",
  pit: "PrimitiveItemType"
};

function parseCompactResourceSpecification(
  compactType: any,
  typeName: string
): ResourceSpecification {
  const ret = {
    SpecificationType: typeName,
    Properties: parseCompactResourceSection(compactType.p),
    Attributes: undefined
  };
  if (compactType.a) {
    ret.Attributes = parseCompactResourceSection(compactType.a);
  }
  return ret;
}

function parseCompactResourceSection<
  T: ResourceProperties | AttributeProperties
>(compactSection: any): { [key: string]: T } {
  return Object.keys(compactSection).reduce((properties, propertyKey) => {
    const property = compactSection[propertyKey];

    properties[propertyKey] = Object.keys(property).reduce(
      (propertyAttributes, propertyAttributeKey) => {
        const finalKey = finalPropertyKeys[propertyAttributeKey];
        const test = property[propertyAttributeKey];
        propertyAttributes[finalKey] = test;
        return propertyAttributes;
      },
      {}
    );

    return properties;
  }, {});
}
