//@flow
import { curry } from "lodash/fp";
import { getPropertySpecification } from "../specifications";
import type {
  PropertiesCollection,
  Specification,
  ResourceProperties
} from "../specifications";
import { makeResourceError, prependPath } from "../errors";
import type { TemplateError, ErrorGenerator } from "../errors";
import { getPropertyIntersectionError, getPropertyErrors } from "./";
import { getPropertiesCollectionErrors } from "../resource"
import { isArrayReturningFunction, isIntrinsicFunction } from "../intrinsicFunctions";

const validators = [
  getPrimitivePropertyErrors,
  getPrimitiveListErrors,
  getPrimitiveMapErrors,
  getTypedPropertyErrors,
  getTypedListPropertyErrors
];

//checks all properties to ensure they match the specification
export default function getInvalidPropertiesErrors(
  property: { [key: string]: mixed },
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  const propertyName = Object.keys(property)[0];
  if (!specification.Properties.hasOwnProperty(propertyName)) return [];
  const propertySpecification = specification.Properties[propertyName];

  return validators
    .reduce((newErrors, validator) => {
      return [
        ...newErrors,
        ...validator(
          propertySpecification,
          property[propertyName],
          resourceTypeName
        )
      ];
    }, [])
    .map(prependPath(propertyName));
}

/*
  Checks that primitive properties match the specification
  -- longs, decimals and timestamp are checked that typeof === "number"
  -- json is checked that typeof === "string"
  -- the rest are checked that typeof === lowered(typename from specification) and they
     contain a proper property
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
      makeInvalidPrimitivePropertyError(
        propertySpecification.PrimitiveType,
        typeof property
      )
    ];
  }
  return [];
}

const makeInvalidPrimitivePropertyError = (correctType, instanceType) =>
  makeResourceError(
    `Should be of type '${correctType} but got '${instanceType}'`,
    "InvalidPrimitveProperty"
  );

function getPrimitiveMapErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateError> {
  return hasPrimitiveMapError(propertySpecification, property)
    ? [
        makeInvalidMapPropertyError(
          propertySpecification.PrimitiveItemType,
          typeof property
        )
      ]
    : [];
}

const makeInvalidMapPropertyError = (
  correctType: ?string,
  instanceType: string
) =>
  makeResourceError(
    `Should be a map with values of type '${unwrap(
      correctType
    )} but got property of type '${instanceType}'`,
    "InvalidMapPropertyproperty"
  );

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
      makeInvalidListPropertyError(
        propertySpecification.PrimitiveItemType,
        typeof property
      )
    ];
  }
  return [];
}

const makeInvalidListPropertyError = (
  correctType: ?string,
  instanceType: string
) =>
  makeResourceError(
    `Should be a list with values of type '${unwrap(
      correctType
    )} but got property of type '${instanceType}'`,
    "InvalidListPropertyproperty"
  );

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
  property: mixed,
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
    if (typeof property !== "object" || property === null)
      return [makeInvalidTypedPropertyError(typeof property)];
    return getPropertyErrors(
      property,
      resourceTypeName,
      propertyTypeSpecification
    );
  }
  return [];
}

const makeInvalidTypedPropertyError = instanceType =>
  makeResourceError(
    `Should be an object but got a '${instanceType}'`,
    "InvalidTypedProperty"
  );


//note - this recursively calls getPropertiesErrors
//to check nested type meets all properties requirements
function getTypedListPropertyErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateError> {
  if (
    !!propertySpecification.ItemType &&
    propertySpecification.Type === "List"
  ) {
    const propertyTypeSpecification = getPropertySpecification(
      `${resourceTypeName}.${unwrap(propertySpecification.ItemType)}`
    );
    if (!isArrayReturningFunction(property) && !Array.isArray(property))
      return [makeInvalidTypedListPropertyError(unwrap(propertySpecification.ItemType), typeof property)];
    if (isArrayReturningFunction(property)) return []; // not handling this right now
    return property.reduce((errors, item) => {
      return [...errors, ...getPropertiesCollectionErrors(
        item,
        propertyTypeSpecification,
        resourceTypeName
      )]
    }, []);
  }
  return [];
}

const makeInvalidTypedListPropertyError = (itemType, instanceType) =>
  makeResourceError(
    `Should be a list of '${itemType}' but found a '${instanceType}'`,
    "InvalidTypedListProperty"
  );

/*
  Primitive utilities
*/

function arePrimitiveMapValuesValid(
  property: mixed,
  itemTypeName: ?string
): boolean {
  if (typeof property !== "object") return false;
  return Object.values(property).every(val =>
    isPrimitiveTypeValueValid(val, itemTypeName)
  );
}

function arePrimitiveListValuesValid(
  property: mixed,
  itemTypeName: ?string
): boolean {
  if (isArrayReturningFunction(property)) return true;
  if (!Array.isArray(property)) return false;
  return property.every(val => isPrimitiveTypeValueValid(val, itemTypeName));
}

const integerStringRegex = /^[0-9]+$/;

function isPrimitiveTypeValueValid(
  property: mixed,
  typeName: ?string
): boolean {
  if (isIntrinsicFunction(property)) return true;
  const normalizedTypeName = makeNormalizedPrimitiveTypeName(typeName);
  if (normalizedTypeName === "integer") {
    return Number.isInteger(property) || integerStringRegex.test(property);
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
