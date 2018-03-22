//@flow
import type {
  PropertiesCollection,
  ResourceProperties,
  Specification
} from "../specifications";
import type { TemplateError, ErrorGenerator } from "../errors";
import getInvalidPropertiesErrors from "./invalidProperties";
import getUnknownPropertiesErrors from "./unknownProperties";
import getRequiredPropertiesErrors from "./requiredProperties";

const propertyValidators = [
  getInvalidPropertiesErrors,
  getUnknownPropertiesErrors,
  getRequiredPropertiesErrors
];

// Collects and returns all the property errors for the resource
export function getPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  return propertyValidators.reduce((errors, validator) => {
    return [
      ...errors,
      ...validator(properties, resourceTypeName, specification)
    ];
  }, []);
}

//utility function that verifies one set of properties
//is a subset of a second. useful in multiple scenarios
export function getPropertyIntersectionErrors<T>(
  requiredProperties: string[],
  properties: PropertiesCollection<T>,
  errorGenerator: ErrorGenerator
) {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  return requiredProperties.reduce(
    getPropertyIntersectionError(properties, errorGenerator),
    []
  );
}

function getPropertyIntersectionError<T>(
  propertiesToValidate: PropertiesCollection<T>,
  errorGenerator: ErrorGenerator
) {
  return (errors: Array<TemplateError>, requiredPropertyName: string) => {
    if (!propertiesToValidate.hasOwnProperty(requiredPropertyName)) {
      errors.push(errorGenerator(requiredPropertyName));
    }
    return errors;
  };
}

//for flow reasons
export function getKeys(
  properties: PropertiesCollection<ResourceProperties>
): string[] {
  return Object.keys(properties);
}
