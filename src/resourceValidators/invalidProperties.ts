// @flow
import { makeResourceError, prependPath, TemplateIssue } from "../errors";
import {
  getContingentIntrinsicError,
  isIntrinsicFunction,
  isTemplateStructureError
} from "../intrinsicFunctions";
import { getPropertiesCollectionErrors } from "../resource";
import {
  getPropertySpecification,
  IResourceProperties,
  ISpecification
} from "../specifications";
import { isPrimitiveTypeValueValid } from "../utilities/primitives";
import { getPropertyErrors } from "./";

const validators = [
  getPrimitivePropertyErrors,
  getPrimitiveListErrors,
  getPrimitiveMapErrors,
  getTypedPropertyErrors,
  getTypedListPropertyErrors,
  getTypedMapPropertyErrors
];

// checks all properties to ensure they match the specification
export default function getInvalidPropertiesErrors(
  property: { [key: string]: any },
  resourceTypeName: string,
  specification: ISpecification
): TemplateIssue[] {
  const propertyName = Object.keys(property)[0];
  if (!specification.Properties.hasOwnProperty(propertyName)) {
    return [];
  }
  const propertySpecification = specification.Properties[propertyName];
  return validators
    .reduce((newErrors: TemplateIssue[], validator) => {
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
  propertySpecification: IResourceProperties,
  property: any,
  resourceTypeName: string
): TemplateIssue[] {
  if (!propertySpecification.PrimitiveType) {
    return [];
  }

  return makePrimitivePropertyErrors(propertySpecification, property);
}

function makePrimitivePropertyErrors(
  propertySpecification: IResourceProperties,
  property: any
): TemplateIssue[] {
  const error = makeInvalidPrimitivePropertyError(
    propertySpecification.PrimitiveType || propertySpecification.PrimitiveItemType,
    typeof property
  );

  if (isIntrinsicFunction(property)) {
    return [error.toResolvable(
      getContingentIntrinsicError(property, propertySpecification)
    )]
  }

  return !isPrimitiveTypeValueValid(
    property,
    propertySpecification.PrimitiveType || propertySpecification.PrimitiveItemType
  )
    ? [error]
    : [];
}

const makeInvalidPrimitivePropertyError = (
  correctType: string,
  instanceType: string
) =>
  makeResourceError(
    `Should be of type '${correctType} but got '${instanceType}'`,
    "InvalidPrimitveProperty"
  );

function getPrimitiveMapErrors(
  propertySpecification: IResourceProperties,
  property: any,
  resourceTypeName: string
): TemplateIssue[] {
  if (
    propertySpecification.Type !== "Map" ||
    !propertySpecification.PrimitiveItemType
  ) {
    return [];
  }

  if (typeof property !== "object") {
    return [
      makeInvalidPrimitiveMapError(propertySpecification.PrimitiveItemType)
    ];
  }

  return Object.keys(property).reduce(
    (errors: TemplateIssue[], propertyKey) => {
      const prop = property[propertyKey];
      return [
        ...errors,
        ...makePrimitivePropertyErrors(propertySpecification, prop).map(
          prependPath(propertyKey)
        )
      ];
    },
    []
  );
}

const makeInvalidPrimitiveMapError = (correctType: string) =>
  makeResourceError(
    `Should be of map with string keys and values of type '${correctType} but got...`,
    "InvalidPrimitveMap"
  );

function getPrimitiveListErrors(
  propertySpecification: IResourceProperties,
  property: any,
  resourceTypeName: string
): TemplateIssue[] {
  const listErrors = [];
  if (
    propertySpecification.Type !== "List" ||
    !propertySpecification.PrimitiveItemType
  ) {
    return [];
  }

  const invalidTypeError = makeInvalidPrimitiveListError(
    propertySpecification.PrimitiveItemType
  );

  if (isIntrinsicFunction(property)) {
    const contingentIntrinsicErrorFn = getContingentIntrinsicError(
      property,
      propertySpecification
    );
    listErrors.push(invalidTypeError.toResolvable(contingentIntrinsicErrorFn));
  } else if (!Array.isArray(property)) {
    return [invalidTypeError];
  }

  if (isIntrinsicFunction(property)){ return listErrors;}

  return property.reduce((errors, propertyItem, i) => {
    return [
      ...errors,
      ...makePrimitivePropertyErrors(propertySpecification, propertyItem).map(
        prependPath(`[${i}]`)
      )
    ];
  }, listErrors);
}

const makeInvalidPrimitiveListError = (correctType: string) =>
  makeResourceError(
    `Should be of list of type '${correctType} but got...`,
    "InvalidPrimitveList"
  );

// note - this recursively calls getPropertiesErrors
// to check nested type meets all properties requirements
function getTypedPropertyErrors(
  propertySpecification: IResourceProperties,
  property: any,
  resourceTypeName: string
): TemplateIssue[] {
  if (
    !propertySpecification.Type ||
    propertySpecification.Type === "Map" ||
    propertySpecification.Type === "List"
  ) {
    return [];
  }

  const propertyTypeSpecification = getPropertySpecification(
    `${resourceTypeName}.${propertySpecification.Type}`
  );
  if (typeof property !== "object" || property === null) {
    return [makeInvalidTypedPropertyError(typeof property)];
  }
  return getPropertyErrors(
    property,
    resourceTypeName,
    propertyTypeSpecification
  );
}

const makeInvalidTypedPropertyError = (instanceType: string) =>
  makeResourceError(
    `Should be an object but got a '${instanceType}'`,
    "InvalidTypedProperty"
  );

function getTypedListPropertyErrors(
  propertySpecification: IResourceProperties,
  property: any,
  resourceTypeName: string
): TemplateIssue[] {
  const listErrors = [];
  if (
    !propertySpecification.ItemType ||
    propertySpecification.Type !== "List"
  ) {
    return [];
  }

  const error = makeInvalidTypedListPropertyError(
    propertySpecification.ItemType,
    typeof property
  );

  const propertyTypeSpecification = getPropertySpecification(
    `${resourceTypeName}.${propertySpecification.ItemType}`
  );

  if (isIntrinsicFunction(property)) {
    const contingentIntrinsicErrorFn = getContingentIntrinsicError(
      property,
      propertySpecification
    );
    listErrors.push(error.toResolvable(contingentIntrinsicErrorFn));
  } else if (!Array.isArray(property)) {
    return [error];
  }

  return property.reduce((errors, item, i) => {
    return [
      ...errors,
      ...getPropertiesCollectionErrors(
        item,
        propertyTypeSpecification,
        resourceTypeName
      ).map(prependPath(`[${i}]`))
    ];
  }, listErrors);
}

const makeInvalidTypedListPropertyError = (
  itemType: string,
  instanceType: string
) =>
  makeResourceError(
    `Should be a list of '${itemType}' but found a '${instanceType}'`,
    "InvalidTypedListProperty"
  );

function getTypedMapPropertyErrors(
  propertySpecification: IResourceProperties,
  property: any,
  resourceTypeName: string
): TemplateIssue[] {
  if (!propertySpecification.ItemType || propertySpecification.Type !== "Map") {
    return [];
  }

  const error = makeInvalidTypedMapPropertyError(
    propertySpecification.ItemType,
    typeof property
  );

  const propertyTypeSpecification = getPropertySpecification(
    `${resourceTypeName}.${propertySpecification.ItemType}`
  );
  if (typeof property !== "object") {
    return [error];
  }

  return Object.keys(property).reduce(
    (errors: TemplateIssue[], itemKey: string) => {
      const item = property[itemKey];
      return [
        ...errors,
        ...getPropertiesCollectionErrors(
          item,
          propertyTypeSpecification,
          resourceTypeName
        ).map(prependPath(itemKey))
      ];
    },
    []
  );
}

const makeInvalidTypedMapPropertyError = (
  itemType: string,
  instanceType: string
) =>
  makeResourceError(
    `Should be a map with values of '${itemType}' but found a '${instanceType}'`,
    "InvalidTypedMapProperty"
  );
