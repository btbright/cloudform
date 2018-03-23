//@flow
import { curry } from "lodash/fp";
import type { PropertiesCollection, Specification } from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError } from "../errors";

//checks that there no unknown properties on the resource
//-- useful for checking for typos
export default function getUnknownPropertiesErrors(
  property: {[key: string]: mixed},
  resourceTypeName: string,
  specification: Specification
): TemplateError[] {
  const propertyName = Object.keys(property)[0];
  const specificationPropertyNames = Object.keys(specification.Properties);
  if (specificationPropertyNames.indexOf(propertyName) === -1){
    return [makeInvalidPropertyError(propertyName)];
  }
  return [];
}

const makeInvalidPropertyError = propertyName =>
  makeResourceError(`Invalid property`, "UnknownProperty", propertyName);
