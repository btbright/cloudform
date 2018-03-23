//@flow
import type { Specification } from "../specifications";
import type { TemplateIssue } from "../errors";
import type { Resource } from "../resource";
import { prependPath } from "../errors";

//resource errors concerned with the structure of the resource
//definition, top level attributes or cross-cutting, intra-resource
//concerns

type ResourceValidator = (
  resource: Resource,
  specification: Specification
) => TemplateIssue[];

import getInvalidStructureErrors from "./invalidResourceStructure";
const resourceValidators: ResourceValidator[] = [getInvalidStructureErrors];

export function getResourceErrors(
  resource: Resource,
  specification: Specification
): Array<TemplateIssue> {
  return resourceValidators.reduce((errors, validator) => {
    return [...errors, ...validator(resource, specification)];
  }, []);
}

//resource errors that involve multiple properties at once
type PropertiesValidator = (
  properties: PropertiesValidator<mixed>,
  specification: Specification
) => TemplateIssue[];

import getRequiredPropertiesErrors from "./requiredProperties";
const propertiesValidators: PropertiesValidator[] = [
  getRequiredPropertiesErrors
];

export function getPropertiesErrors(
  properties: PropertiesValidator<mixed>,
  specification: ResourceSpecification
): Array<TemplateIssue> {
  return propertiesValidators.reduce((errors, validator) => {
    return [...errors, ...validator(properties, specification)];
  }, []).map(prependPath("Properties"));
}

//resource errors for a single property of a resource
type PropertyValidator = (
  property: { [key: string]: mixed },
  resourceTypeName: string,
  specification: Specification
) => TemplateIssue[];

import getInvalidPropertiesErrors from "./invalidProperties";
import getUnknownPropertiesErrors from "./unknownProperties";

const propertyValidators: PropertyValidator[] = [
  getInvalidPropertiesErrors,
  getUnknownPropertiesErrors
];

export function getPropertyErrors(
  property: { [key: string]: mixed },
  resourceTypeName: string,
  specification: Specification
): Array<TemplateIssue> {
  return propertyValidators.reduce((errors, validator) => {
    return [...errors, ...validator(property, resourceTypeName, specification)];
  }, []).map(prependPath("Properties"));
}
