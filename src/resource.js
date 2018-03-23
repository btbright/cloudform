// @flow
import { isArray, curry } from "lodash/fp";
import type {
  PropertiesCollection,
  Specification,
  ResourceProperties
} from "./specifications";
import { getResourceSpecification } from "./specifications";
import type { TemplateIssue } from "./errors";
import { makeResourceError, prependPath } from "./errors";
import {
  getPropertyErrors,
  getPropertiesErrors,
  getResourceErrors
} from "./resourceValidators";

export type Resource = {
  Type: string,
  Properties: PropertiesCollection<mixed>
};

export function getErrors(resource: Resource) {
  const specification = getResourceSpecification(resource.Type);
  if (!specification) {
    return [makeUnknownTypeError(resource.Type)];
  }
  let errors = getResourceErrors(resource, specification);
  if (resource.Properties) {
    errors = errors.concat(
      getPropertiesCollectionErrors(
        resource.Properties,
        specification,
        resource.Type
      )
    );
  }
  
  return errors;
}

function makeUnknownTypeError(typeName: string) {
  return makeResourceError(
    `Unknown resource type: ${typeName}`,
    "UnknownResourceType"
  );
}

//errors concerned only with collection of properties 
export function getPropertiesCollectionErrors(
  properties: PropertiesCollection<mixed>,
  specification: Specification,
  resourceType: string
) {
  let errors = Object.keys(properties).reduce((newErrors, propertyKey) => {
    return [
      ...newErrors,
      ...getPropertyErrors(
        { [propertyKey]: properties[propertyKey] },
        resourceType,
        specification
      )
    ];
  }, []);


  return [...errors, ...getPropertiesErrors(properties, specification)];
}
