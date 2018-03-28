import { prependPath, TemplateIssue } from "../errors";
import { IResource } from "../resource";
import { IPropertiesCollection, ISpecification } from "../specifications";

// resource errors concerned with the structure of the resource
// definition, top level attributes or cross-cutting, intra-resource
// concerns

type ResourceValidator = (
  resource: IResource,
  specification: ISpecification
) => TemplateIssue[];

import getInvalidStructureErrors from "./invalidResourceStructure";
const resourceValidators: ResourceValidator[] = [getInvalidStructureErrors];

export function getResourceErrors(
  resource: IResource,
  specification: ISpecification
): TemplateIssue[] {
  return resourceValidators.reduce((errors: TemplateIssue[], validator: ResourceValidator) => {
    return [...errors, ...validator(resource, specification)];
  }, []);
}

// resource errors that involve multiple properties at once
type PropertiesValidator = (
  properties: IPropertiesCollection<any>,
  specification: ISpecification
) => TemplateIssue[];

import getRequiredPropertiesErrors from "./requiredProperties";
const propertiesValidators: PropertiesValidator[] = [
  getRequiredPropertiesErrors
];

export function getPropertiesErrors(
  properties: IPropertiesCollection<any>,
  specification: ISpecification
): TemplateIssue[] {
  return propertiesValidators
    .reduce((errors: TemplateIssue[], validator: PropertiesValidator) => {
      return [...errors, ...validator(properties, specification)];
    }, [])
    .map(prependPath("Properties"));
}

// resource errors for a single property of a resource
type PropertyValidator = (
  property: { [key: string]: any },
  resourceTypeName: string,
  specification: ISpecification
) => TemplateIssue[];

import getInvalidPropertiesErrors from "./invalidProperties";
import getUnknownPropertiesErrors from "./unknownProperties";

const propertyValidators: PropertyValidator[] = [
  getInvalidPropertiesErrors,
  getUnknownPropertiesErrors
];

export function getPropertyErrors(
  property: { [key: string]: any },
  resourceTypeName: string,
  specification: ISpecification
): TemplateIssue[] {
  return propertyValidators
    .reduce((errors: TemplateIssue[], validator: PropertyValidator) => {
      return [
        ...errors,
        ...validator(property, resourceTypeName, specification)
      ];
    }, [])
    .map(prependPath("Properties"));
}
