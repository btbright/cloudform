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

const resourceValidators: ResourceValidator[] = [
  getRequiredPropertiesErrors
]

const propertyValidators: PropertyValidator[] = [
  getInvalidPropertiesErrors,
  getUnknownPropertiesErrors
];

type PropertyValidator = (property: {[key: string]: mixed},
  resourceTypeName: string,
  specification: Specification) => TemplateError[]

type PropertiesValidator = (properties: PropertiesValidator<mixed>, specification: Specification) => TemplateError[]

export function getPropertiesErrors(properties: PropertiesValidator<mixed>, specification: ResourceSpecification): Array<TemplateError> {
  return resourceValidators.reduce((errors, validator) => {
    return [
      ...errors,
      ...validator(properties, specification)
    ];
  }, []);
}

// Collects and returns all the property errors for the resource
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
