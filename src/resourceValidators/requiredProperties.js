//@flow

import { curry } from "lodash/fp";
import type { PropertiesCollection, Specification } from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError, ErrorGenerator } from "../errors";
import { getPropertyIntersectionError } from "./";
import type { Resource } from "../resource";

//resources must have all required attributes defined in the specification
export default function getMissingRequiredPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  specification: Specification
): TemplateError[] {
  const propertyNames = Object.keys(properties);
  return getRequiredPropertyNames(specification).reduce(
    (errors, requiredPropertyName) => {
      return [
        ...errors,
        ...getRequiredPropertyError(propertyNames, requiredPropertyName)
      ];
    },
    []
  );
}

function getRequiredPropertyError(
  propertyNames: string[],
  requiredPropertyName: string
): TemplateError[] {
  if (propertyNames.indexOf(requiredPropertyName) === -1) {
    return [makeMissingRequiredPropertyError(requiredPropertyName)];
  }
  return [];
}

function getRequiredPropertyNames(specification: Specification): string[] {
  return Object.keys(specification.Properties).filter(
    propertyKey => specification.Properties[propertyKey].Required
  );
}

const makeMissingRequiredPropertyError = propertyName =>
  makeResourceError(
    `Missing property: ${propertyName}`,
    "MissingRequiredProperty"
  );
