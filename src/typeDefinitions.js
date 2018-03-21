// @flow
import specData from "../data/spec.json";

export type ResourceType = {
  Properties: PropertyCollection<ResourceProperty>,
  Attributes: PropertyCollection<AttributeProperty>
};

export type PropertyType = {
  Properties: PropertyCollection<ResourceProperty>
};

export type PropertyCollection<T> = { [key: string]: T };

type AttributeProperty = {
  ItemType: ?string,
  PrimitiveType: ?string,
  PrimitiveItemType: ?string,
  Type: ?string
};

export type ResourceProperty = {
  Required: boolean,
  DuplicatesAllowed: ?boolean,
  ItemType: ?string,
  PrimitiveType: ?string,
  PrimitiveItemType: ?string,
  Type: ?string
};

export function getResourceTypeDefinition(
  resourceTypeKey: string
): ResourceType {
  const compactType = specData.r[resourceTypeKey];
  return parseCompactResourceType(compactType);
}

export function getPropertyTypeDefinition(
  propertyTypeKey: string
): PropertyType {
  const compactType = specData.p[propertyTypeKey];
  return parseCompactResourceType(compactType);
}

const finalPropertyKeys = {
  req: "Required",
  da: "DuplicatesAllowed",
  t: "Type",
  pt: "PrimitiveType",
  it: "ItemType",
  pit: "PrimitiveItemType"
};

function parseCompactResourceType(compactType: any): ResourceType {
  const ret = {};
  if (compactType.a){
    ret.Attributes = parseCompactResourceSection(compactType.a);
  }
  if (compactType.p){
    ret.Properties = parseCompactResourceSection(compactType.p);
  }
  return ret;
}

function parseCompactResourceSection<T: ResourceProperty | AttributeProperty>(
  compactSection: any
): { [key: string]: T } {
  return Object.keys(compactSection).reduce((properties, propertyKey) => {
    const property = compactSection[propertyKey];
    
    properties[propertyKey] = Object.keys(property).reduce((propertyAttributes, propertyAttributeKey) => {
      const finalKey = finalPropertyKeys[propertyAttributeKey];
      const test = property[propertyAttributeKey];
      propertyAttributes[finalKey] = test;
      return propertyAttributes;
    }, {});

    return properties;
  }, {});
}
