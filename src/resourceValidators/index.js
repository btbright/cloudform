//@flow
import type {
  PropertiesCollection,
  ResourceProperties,
  Specification,
  ResourceSpecification
} from "../specifications";
import type { TemplateError, ErrorGenerator } from "../errors";
import type { Resource } from "../resource";
import getInvalidPropertiesErrors from "./invalidProperties";
import getUnknownPropertiesErrors from "./unknownProperties";
import getRequiredPropertiesErrors from "./requiredProperties";
import getInvalidStructureErrors from "./invalidResourceStructure";


type PropertyValidator = (property: {[key: string]: mixed},
  resourceTypeName: string,
  specification: Specification) => TemplateError[]

type PropertiesValidator = (properties: PropertiesValidator<mixed>, specification: Specification) => TemplateError[]
type ResourceValidator = (resource: Resource, specification: Specification) => TemplateError[]

const propertiesValidators: PropertiesValidator[] = [
  getRequiredPropertiesErrors
]

const propertyValidators: PropertyValidator[] = [
  getInvalidPropertiesErrors,
  getUnknownPropertiesErrors
];

//resource errors that involve multiple properties at once
export function getPropertiesErrors(properties: PropertiesValidator<mixed>, specification: ResourceSpecification): Array<TemplateError> {
  return propertiesValidators.reduce((errors, validator) => {
    return [
      ...errors,
      ...validator(properties, specification)
    ];
  }, []);
}

//resource errors for a single property of a resource
export function getPropertyErrors(
  property: {[key: string]: mixed},
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  return propertyValidators.reduce((errors, validator) => {
    return [
      ...errors,
      ...validator(property, resourceTypeName, specification)
    ];
  }, []);
}

const resourceValidators: ResourceValidator[] = [
  getInvalidStructureErrors
]

//resource errors concerned with the structure of the resource
//definition, top level attributes or cross-cutting, intra-resource
//concerns
export function getResourceErrors(resource: Resource, specification: Specification): Array<TemplateError>{
  return resourceValidators.reduce((errors, validator) => {
    return [
      ...errors,
      ...validator(resource, specification)
    ];
  }, []);
}

export function getPropertyIntersectionError<T>(
  propertyName: string,
  allowableProperties: string[],
  errorGenerator: ErrorGenerator
) {
  if (allowableProperties.indexOf(propertyName) === -1){
    return errorGenerator(propertyName);
  }
}

//for flow reasons
export function getKeys(
  properties: PropertiesCollection<ResourceProperties>
): string[] {
  return Object.keys(properties);
}
