//@flow
import { curry } from "lodash/fp";
import type { PropertiesCollection, Specification } from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError } from "../errors";
import { getPropertyIntersectionErrors, getKeys } from "./";

//checks that there no unknown properties on the resource
//-- useful for checking for typos
export default function getUnknownPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  return getPropertyIntersectionErrors(
    getKeys(properties),
    specification.Properties,
    makeInvalidPropertyError
  );
}

const makeInvalidPropertyError = propertyName =>
  makeResourceError(`Invalid property: ${propertyName}`, "UnknownProperty");
