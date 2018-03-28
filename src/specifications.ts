import specData from "../data/spec.json";

export interface ISpecification {
  SpecificationType: string;
  Properties: IPropertiesCollection<IResourceProperties>;
  Attributes: IPropertiesCollection<IAttributeProperties> | undefined;
}

export interface IPropertiesCollection<T> {
  [key: string]: T;
}

export interface IAttributeProperties {
  ItemType: string;
  PrimitiveType: string;
  PrimitiveItemType: string;
  Type: string;
}

export interface IResourceProperties {
  Required: boolean;
  DuplicatesAllowed: boolean;
  ItemType: string;
  PrimitiveType: string;
  PrimitiveItemType: string;
  Type: string;
}

export function getResourceSpecification(
  resourceSpecificationKey: string
): ISpecification | undefined {
  const compactType = specData.r[resourceSpecificationKey];
  if (!compactType) {
    return;
  }
  return parseCompactResourceSpecification(compactType, "Resource");
}

export function getPropertySpecification(
  propertySpecificationKey: string
): ISpecification {
  const compactType = specData.p[propertySpecificationKey];
  return parseCompactResourceSpecification(compactType, "Property");
}

const finalPropertyKeys: any = {
  da: "DuplicatesAllowed",
  it: "ItemType",
  pit: "PrimitiveItemType",
  pt: "PrimitiveType",
  req: "Required",
  t: "Type"
};

function parseCompactResourceSpecification(
  compactType: any,
  typeName: string
): ISpecification {
  const ret: ISpecification = {
    Attributes: undefined,
    Properties: parseCompactResourceSection(compactType.p),
    SpecificationType: typeName
  };
  if (compactType.a) {
    ret.Attributes = parseCompactResourceSection(compactType.a);
  }
  return ret;
}

function parseCompactResourceSection<T>(
  compactSection: any
): { [key: string]: T } {
  return Object.keys(compactSection).reduce(
    (properties: { [key: string]: T }, propertyKey: string) => {
      const property = compactSection[propertyKey];

      properties[propertyKey] = Object.keys(property).reduce(
        (propertyAttributes: any, propertyAttributeKey: string) => {
          const finalKey = finalPropertyKeys[propertyAttributeKey];
          const test = property[propertyAttributeKey];
          propertyAttributes[finalKey] = test;
          return propertyAttributes;
        },
        {}
      );

      return properties;
    },
    {}
  );
}
