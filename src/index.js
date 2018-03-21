// @flow
import {
  getResourceTypeDefinition,
  getPropertyTypeDefinition
} from "./typeDefinitions";
import { isArray } from "lodash";
import { isArrayReturningFunction } from "./intrinsicFunctions";
import type {
  ResourceType,
  PropertyCollection,
  ResourceProperty,
  PropertyType
} from "./typeDefinitions";

type TemplateError = {
  errorString: string
};

type Resource = {
  Type: string,
  Properties: { [key: string]: mixed },
  Attributes: { [key: string]: mixed }
};

type Validator<T: ResourceType | PropertyType> = (
  PropertyCollection<mixed>,
  string,
  T
) => Array<TemplateError>;

export function getResourceErrors(resource: any) {
  const typeDefinition = getResourceTypeDefinition(resource.Type);
  return validateProperties(resource.Properties, resource.Type, typeDefinition);
}

function validateProperties<T: ResourceType | PropertyType>(
  properties: PropertyCollection<mixed>,
  resourceType: string,
  typeDefinition: T
): Array<TemplateError> {
  const validators: Array<Validator<ResourceType | PropertyType>> = [
    getMissingRequiredPropertiesErrors,
    getUnknownPropertiesErrors,
    getInvalidPropertiesErrors
  ];
  return validators.reduce((errors, validator) => {
    return [...errors, ...validator(properties, resourceType, typeDefinition)];
  }, []);
}

function getInvalidPropertiesErrors<T: ResourceType | PropertyType>(
  properties: PropertyCollection<mixed>,
  resourceType: string,
  typeDefinition: T
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  return Object.keys(properties).reduce((errors, propertyKey: string) => {
    //ignore missing properties
    if (!typeDefinition.Properties.hasOwnProperty(propertyKey)) return errors;
    const property = properties[propertyKey];
    const propertyDefinition = typeDefinition.Properties[propertyKey];

    if (
      !!propertyDefinition.PrimitiveType &&
      !isPrimitiveTypeValueValid(property, propertyDefinition.PrimitiveType)
    ) {
      errors.push({
        errorString: `Type ${resourceType} has invalid ${propertyKey}: ${typeof property} found instead of ${
          propertyDefinition.PrimitiveType
        }`
      });
    }

    if (
      propertyDefinition.Type === "List" &&
      !!propertyDefinition.PrimitiveItemType &&
      !arePrimitiveListValuesValid(
        property,
        propertyDefinition.PrimitiveItemType
      )
    ) {
      errors.push({
        errorString: `Type ${resourceType} has invalid ${propertyKey}: should be a list that contains ${
          propertyDefinition.PrimitiveItemType
        }`
      });
    }

    if (
      propertyDefinition.Type === "Map" &&
      !!propertyDefinition.PrimitiveItemType &&
      !arePrimitiveMapValuesValid(
        property,
        propertyDefinition.PrimitiveItemType
      )
    ) {
      errors.push({
        errorString: `Type ${resourceType} has invalid ${propertyKey}: should be a map that contains ${
          propertyDefinition.PrimitiveItemType
        }`
      });
    }

    if (
      !!propertyDefinition.Type &&
      propertyDefinition.Type !== "Map" &&
      propertyDefinition.Type !== "List"
    ) {
      const subErrors = getTypedPropertyErrors(
        property,
        resourceType,
        propertyDefinition.Type
      );
      errors = [...errors, ...subErrors];
    }

    return errors;
  }, []);
}

function getTypedPropertyErrors(
  value: mixed,
  resourceType: string,
  typeName: string
): Array<TemplateError> {
  const propertyType = getPropertyTypeDefinition(`${resourceType}.${typeName}`);
  if (typeof value !== "object" || value === null)
    return [{ errorString: `Invalid type ... more dat` }];
  return validateProperties(value, resourceType, propertyType);
}

function arePrimitiveMapValuesValid(
  value: mixed,
  itemTypeName: ?string
): boolean {
  if (typeof value !== "object") return false;
  return Object.values(value).every(val =>
    isPrimitiveTypeValueValid(val, itemTypeName)
  );
}

function arePrimitiveListValuesValid(
  value: mixed,
  itemTypeName: ?string
): boolean {
  if (isArrayReturningFunction(value)) return true;
  if (!Array.isArray(value)) return false;
  return value.every(val => isPrimitiveTypeValueValid(val, itemTypeName));
}

function isPrimitiveTypeValueValid(value: mixed, typeName: ?string): boolean {
  const normalizedTypeName = makeNormalizedPrimitiveTypeName(typeName);
  if (normalizedTypeName === "integer") {
    return Number.isInteger(value);
  }
  if (normalizedTypeName === "boolean") {
    return typeof value === "boolean" || value === "true" || value === "false";
  }
  return typeof value === normalizedTypeName;
}

function isInteger(value: mixed): boolean {
  return typeof value === "number" && value % 1 === 0;
}

function makeNormalizedPrimitiveTypeName(typeName: ?string): string {
  if (typeof typeName !== "string") {
    return "unknown";
  }
  const loweredTypeName = typeName.toLowerCase();
  switch (loweredTypeName) {
    case "long":
    case "double":
    case "timestamp":
      return "number";
    case "json":
      return "string";
    default:
      return loweredTypeName;
  }
}

function getUnknownPropertiesErrors<T: ResourceType | PropertyType>(
  properties: PropertyCollection<mixed>,
  resourceType: string,
  typeDefinition: T
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  return Object.keys(properties).reduce((errors, propertyKey: string) => {
    if (!typeDefinition.Properties.hasOwnProperty(propertyKey)) {
      errors.push({
        errorString: `Type ${resourceType} contains invalid property: ${propertyKey}`
      });
    }
    return errors;
  }, []);
}

function getMissingRequiredPropertiesErrors<T: ResourceType | PropertyType>(
  properties: PropertyCollection<mixed>,
  resourceType: string,
  typeDefinition: T
): Array<TemplateError> {
  return getRequiredPropertyNames(typeDefinition).reduce(
    (errors, propertyKey: string) => {
      if (typeof properties !== "object" || properties === null)
        return [{ errorString: "invalid" }];
      if (!properties.hasOwnProperty(propertyKey)) {
        errors.push({
          errorString: `Type ${resourceType} missing required property: ${propertyKey}`
        });
      }
      return errors;
    },
    []
  );
}

function getRequiredPropertyNames(
  typeDefinition: ResourceType | PropertyType
): string[] {
  return Object.keys(typeDefinition.Properties).filter(
    propertyKey => typeDefinition.Properties[propertyKey].Required
  );
}
