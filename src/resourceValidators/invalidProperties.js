// @flow
import { curry } from "lodash/fp";
import { getPropertySpecification } from "../specifications";
import type { Specification, ResourceProperties } from "../specifications";
import { makeResourceError, prependPath } from "../errors";
import type { TemplateIssue } from "../errors";
import { getPropertyErrors } from "./";
import { getPropertiesCollectionErrors } from "../resource";
import {
  isArrayReturningFunction,
  isIntrinsicFunction,
  isTemplateStructureError
} from "../intrinsicFunctions";

const validators = [
  getPrimitivePropertyErrors,
  getPrimitiveListErrors,
  getPrimitiveMapErrors,
  getTypedPropertyErrors,
  getTypedListPropertyErrors,
  getTypedMapPropertyErrors
];

//checks all properties to ensure they match the specification
export default function getInvalidPropertiesErrors(
  property: { [key: string]: mixed },
  resourceTypeName: string,
  specification: Specification
): Array<TemplateIssue> {
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
): Array<TemplateIssue> {
  if (!propertySpecification.PrimitiveType) return [];

  return makePrimitivePropertyErrors(
    propertySpecification.PrimitiveType,
    property
  );
}

function makePrimitivePropertyErrors(
  primitiveType: string,
  property: mixed
): TemplateIssue[] {
  const error = makeInvalidPrimitivePropertyError(
    primitiveType,
    typeof property
  );

  if (isIntrinsicFunction(property)) {
    return [error.toResolvable(isTemplateStructureError)];
  }
  return !isPrimitiveTypeValueValid(property, primitiveType) ? [error] : [];
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
): Array<TemplateIssue> {
  if (
    propertySpecification.Type !== "Map" ||
    !propertySpecification.PrimitiveItemType
  )
    return [];

  if (typeof property !== "object")
    return [
      makeInvalidPrimitiveMapError(propertySpecification.PrimitiveItemType)
    ];

  return Object.keys(property).reduce((errors, propertyKey) => {
    const prop = property[propertyKey];
    return [
      ...errors,
      ...makePrimitivePropertyErrors(
        propertySpecification.PrimitiveItemType,
        prop
      ).map(prependPath(propertyKey))
    ];
  }, []);
}

const makeInvalidPrimitiveMapError = correctType =>
  makeResourceError(
    `Should be of map with string keys and values of type '${correctType} but got...`,
    "InvalidPrimitveMap"
  );

function getPrimitiveListErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateIssue> {
  if (
    propertySpecification.Type !== "List" ||
    !propertySpecification.PrimitiveItemType
  )
    return [];

  const invalidTypeError = makeInvalidPrimitiveListError(
    propertySpecification.PrimitiveItemType
  );

  if (isArrayReturningFunction(property)) {
    return [invalidTypeError.toResolvable(isTemplateStructureError)];
  }
  //this is handling non-list, invalid intrinsic functions, should return more info - e.g. "can't use Fn::Join here...""
  if (!Array.isArray(property)) return [invalidTypeError];

  return property.reduce((errors, propertyItem, i) => {
    return [
      ...errors,
      ...makePrimitivePropertyErrors(
        propertySpecification.PrimitiveItemType,
        propertyItem
      ).map(prependPath(`[${i}]`))
    ];
  }, []);
}

const makeInvalidPrimitiveListError = correctType =>
  makeResourceError(
    `Should be of list of type '${correctType} but got...`,
    "InvalidPrimitveList"
  );

//note - this recursively calls getPropertiesErrors
//to check nested type meets all properties requirements
function getTypedPropertyErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateIssue> {
  if (
    !propertySpecification.Type ||
    propertySpecification.Type === "Map" ||
    propertySpecification.Type === "List"
  )
    return [];

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

const makeInvalidTypedPropertyError = instanceType =>
  makeResourceError(
    `Should be an object but got a '${instanceType}'`,
    "InvalidTypedProperty"
  );

function getTypedListPropertyErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateIssue> {
  if (!propertySpecification.ItemType || propertySpecification.Type !== "List")
    return [];

  const error = makeInvalidTypedListPropertyError(
    unwrap(propertySpecification.ItemType),
    typeof property
  );

  const propertyTypeSpecification = getPropertySpecification(
    `${resourceTypeName}.${unwrap(propertySpecification.ItemType)}`
  );

  if (isArrayReturningFunction(property)) {
    return [error.toResolvable(isTemplateStructureError)];
  }
  //this is handling invalid intrinsic functions, should return more info - e.g. "can't use Fn::Join here...""
  if (!Array.isArray(property)) return [error];

  return property.reduce((errors, item, i) => {
    return [
      ...errors,
      ...getPropertiesCollectionErrors(
        item,
        propertyTypeSpecification,
        resourceTypeName
      ).map(prependPath(`[${i}]`))
    ];
  }, []);
}

const makeInvalidTypedListPropertyError = (itemType, instanceType) =>
  makeResourceError(
    `Should be a list of '${itemType}' but found a '${instanceType}'`,
    "InvalidTypedListProperty"
  );

function getTypedMapPropertyErrors(
  propertySpecification: ResourceProperties,
  property: mixed,
  resourceTypeName: string
): Array<TemplateIssue> {
  if (!propertySpecification.ItemType || propertySpecification.Type !== "Map")
    return [];

  const error = makeInvalidTypedMapPropertyError(
    unwrap(propertySpecification.ItemType),
    typeof property
  );

  const propertyTypeSpecification = getPropertySpecification(
    `${resourceTypeName}.${unwrap(propertySpecification.ItemType)}`
  );
  if (typeof property !== "object") return [error];

  return Object.keys(property).reduce((errors, itemKey) => {
    const item = property[itemKey];
    return [
      ...errors,
      ...getPropertiesCollectionErrors(
        item,
        propertyTypeSpecification,
        resourceTypeName
      ).map(prependPath(itemKey))
    ];
  }, []);
}

const makeInvalidTypedMapPropertyError = (itemType, instanceType) =>
  makeResourceError(
    `Should be a map with values of '${itemType}' but found a '${instanceType}'`,
    "InvalidTypedMapProperty"
  );

/*
  Primitive utilities
*/

const integerStringRegex = /^[0-9]+$/;

function isPrimitiveTypeValueValid(
  property: mixed,
  typeName: ?string
): boolean {
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
