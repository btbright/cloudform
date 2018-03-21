// @flow
import specData from "../data/spec.json";

export type Specification = ResourceSpecification | PropertySpecification;

type ResourceSpecification = {
  Properties: PropertiesCollection<ResourceProperties>,
  Attributes: PropertiesCollection<AttributeProperties>
};

type PropertySpecification = {
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
): ResourceSpecification {
  const compactType = specData.r[resourceSpecificationKey];
  return parseCompactResourceSpecification(compactType);
}

export function getPropertySpecification(
  propertySpecificationKey: string
): PropertySpecification {
  const compactType = specData.p[propertySpecificationKey];
  return parseCompactResourceSpecification(compactType);
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
  compactType: any
): ResourceSpecification {
  const ret = {};
  if (compactType.a) {
    ret.Attributes = parseCompactResourceSection(compactType.a);
  }
  if (compactType.p) {
    ret.Properties = parseCompactResourceSection(compactType.p);
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
