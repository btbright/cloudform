//@flow

import { curry } from "lodash/fp";
import type { PropertiesCollection, Specification } from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError, ErrorGenerator } from "../errors";
import { getPropertyIntersectionErrors } from "./";

//resources must have all required attributes defined in the specification
export default function getMissingRequiredPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];

  return getPropertyIntersectionErrors(
    getRequiredPropertyNames(specification),
    properties,
    makeMissingRequiredPropertyError
  );
}

function getRequiredPropertyNames(specification: Specification): string[] {
  return Object.keys(specification.Properties).filter(
    propertyKey => specification.Properties[propertyKey].Required
  );
}

const makeMissingRequiredPropertyError = propertyName =>
  makeResourceError(`Missing property: ${propertyName}`, "MissingRequiredProperty");