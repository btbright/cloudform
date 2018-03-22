//@flow
import { curry } from "lodash";
import { getPropertySpecification } from "../specifications";
import type {
  PropertiesCollection,
  Specification,
  ResourceProperties
} from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError, ErrorGenerator } from "../errors";
import { getPropertyIntersectionErrors, getPropertiesErrors } from "./";
import { isArrayReturningFunction } from "../intrinsicFunctions";

const validators = [
  getPrimitivePropertyErrors, getPrimitiveListErrors, getPrimitiveMapErrors, getTypedPropertyErrors
];

//checks all properties to ensure they match the specification
export default function getInvalidPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  return Object.keys(properties).reduce((errors, propertyName: string) => {
    //ignore missing properties
    if (!specification.Properties.hasOwnProperty(propertyName)) return errors;
    const property = properties[propertyName];
    const propertySpecification = specification.Properties[propertyName];

    return validators.reduce((newErrors, validator) => {
      return [...newErrors, ...validator(propertySpecification, property, resourceTypeName)]
    }, errors);
  }, []);
}

/*
  Checks that primitive properties match the specification
  -- longs, decimals and timestamp are checked that typeof === "number"
  -- json is checked that typeof === "string"
  -- the rest are checked that typeof === lowered(typename from specification) and they
     contain a proper value
*/
function getPrimitivePropertyErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateError> {
  if (
    !!propertySpecification.PrimitiveType &&
    !isPrimitiveTypeValueValid(property, propertySpecification.PrimitiveType)
  ) {
    return [
      {
        errorString: `${typeof property} found instead of ${
          propertySpecification.PrimitiveType
        }`
      }
    ];
  }
  return [];
}

function getPrimitiveMapErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateError> {
  return hasPrimitiveMapError(propertySpecification, property)
    ? [
        {
          errorString: `should be a map that contains ${unwrap(
            propertySpecification.PrimitiveItemType
          )}`
        }
      ]
    : [];
}

function hasPrimitiveMapError(
  propertySpecification: ResourceProperties,
  property: mixed
): boolean {
  return (
    propertySpecification.Type === "Map" &&
    !!propertySpecification.PrimitiveItemType &&
    !arePrimitiveMapValuesValid(
      property,
      propertySpecification.PrimitiveItemType
    )
  );
}

function getPrimitiveListErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateError> {
  if (hasPrimitiveListError(propertySpecification, property)) {
    return [
      {
        errorString: `should be a list that contains ${unwrap(
          propertySpecification.PrimitiveItemType
        )}`
      }
    ];
  }
  return [];
}

function hasPrimitiveListError(
  propertySpecification: ResourceProperties,
  property: mixed
): boolean %checks {
  return (
    !!propertySpecification.PrimitiveItemType &&
    propertySpecification.Type === "List" &&
    !arePrimitiveListValuesValid(
      property,
      propertySpecification.PrimitiveItemType
    )
  );
}

//note - this recursively calls getPropertiesErrors
//to check nested type meets all properties requirements
function getTypedPropertyErrors(
  propertySpecification: ResourceProperties,
  value: mixed,
  resourceTypeName: string
): Array<TemplateError> {
  if (
    !!propertySpecification.Type &&
    propertySpecification.Type !== "Map" &&
    propertySpecification.Type !== "List"
  ) {
    const propertyTypeSpecification = getPropertySpecification(
      `${resourceTypeName}.${propertySpecification.Type}`
    );
    if (typeof value !== "object" || value === null)
      return [{ errorString: `Type ${resourceTypeName} contains invalid property: ${unwrap(propertySpecification.Type)} - found ${typeof value} instead of object` }];
    return getPropertiesErrors(
      value,
      resourceTypeName,
      propertyTypeSpecification
    );
  }
  return [];
}

/*
  Primitive utilities
*/

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

function unwrap(str: ?string): string {
  return !str ? "unknown" : str;
}
