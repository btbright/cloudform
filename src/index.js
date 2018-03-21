// @flow
import { isArray, curry } from "lodash";
import {
  getResourceSpecification,
  getPropertySpecification
} from "./specifications";
import { isArrayReturningFunction } from "./intrinsicFunctions";
import type {
  PropertiesCollection,
  Specification,
  ResourceProperties
} from "./specifications";

type TemplateError = {
  errorString: string
};

type Resource = {
  Type: string,
  Properties: PropertiesCollection<mixed>,
  Attributes: ?PropertiesCollection<mixed>
};

type Validator = (
  PropertiesCollection<mixed>,
  string,
  Specification
) => Array<TemplateError>;

const propertyValidators: Array<Validator> = [
  getMissingRequiredPropertiesErrors,
  getUnknownPropertiesErrors,
  getInvalidPropertiesErrors
];

export function getResourceErrors(resource: Resource) {
  const specification = getResourceSpecification(resource.Type);
  return validateProperties(resource.Properties, resource.Type, specification);
}

function validateProperties(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  return propertyValidators.reduce((errors, validator) => {
    return [
      ...errors,
      ...validator(properties, resourceTypeName, specification)
    ];
  }, []);
}

type ErrorGenerator = (propertyName: string) => TemplateError;
type ErrorGeneratorGenerator = (resourceTypeName: string) => ErrorGenerator;

const makeResourceError = (errorString: string) => ({ errorString });

const makeUnknownPropertyErrorGenerator = curry(
  (resourceTypeName: string, propertyName: string) =>
    makeResourceError(
      `Type ${resourceTypeName} contains invalid property: ${propertyName}`
    )
);

function getUnknownPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  const errorGenerator = makeUnknownPropertyErrorGenerator(resourceTypeName);
  return getKeys(properties).reduce(
    addMissingPropertyError(
      resourceTypeName,
      specification.Properties,
      errorGenerator
    ),
    []
  );
}

//flow wanted this... not sure why
function getKeys(properties: PropertiesCollection<mixed>): string[] {
  return Object.keys(properties);
}

const makeMissingPropertyErrorGenerator = curry(
    (resourceTypeName: string, propertyName: string) =>
      makeResourceError(
        `Type ${resourceTypeName} contains invalid property: ${propertyName}`
      )
  );

function getMissingRequiredPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  const errorGenerator = makeMissingPropertyErrorGenerator(resourceTypeName);
  return getRequiredPropertyNames(specification).reduce(
    addMissingPropertyError(resourceTypeName, properties, errorGenerator),
    []
  );
}

function addMissingPropertyError<T>(
  resourceTypeName: string,
  properties: PropertiesCollection<T>,
  errorGenerator: ErrorGenerator
) {
  return (errors: Array<TemplateError>, propertyName: string) => {
    if (!properties.hasOwnProperty(propertyName)) {
      errors.push(errorGenerator(propertyName));
    }
    return errors;
  };
}

function getRequiredPropertyNames(specification: Specification): string[] {
  return Object.keys(specification.Properties).filter(
    propertyKey => specification.Properties[propertyKey].Required
  );
}

function getInvalidPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  return Object.keys(properties).reduce((errors, propertyKey: string) => {
    //ignore missing properties
    if (!specification.Properties.hasOwnProperty(propertyKey)) return errors;
    const property = properties[propertyKey];
    const propertyDefinition = specification.Properties[propertyKey];

    if (
      !!propertyDefinition.PrimitiveType &&
      !isPrimitiveTypeValueValid(property, propertyDefinition.PrimitiveType)
    ) {
      errors.push({
        errorString: `Type ${resourceTypeName} has invalid ${propertyKey}: ${typeof property} found instead of ${
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
        errorString: `Type ${resourceTypeName} has invalid ${propertyKey}: should be a list that contains ${
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
        errorString: `Type ${resourceTypeName} has invalid ${propertyKey}: should be a map that contains ${
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
        resourceTypeName,
        propertyDefinition.Type
      );
      errors = [...errors, ...subErrors];
    }

    return errors;
  }, []);
}

function getTypedPropertyErrors(
  value: mixed,
  resourceTypeName: string,
  typeName: string
): Array<TemplateError> {
  const propertySpecification = getPropertySpecification(
    `${resourceTypeName}.${typeName}`
  );
  if (typeof value !== "object" || value === null)
    return [{ errorString: `Invalid type ... more dat` }];
  return validateProperties(value, resourceTypeName, propertySpecification);
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
