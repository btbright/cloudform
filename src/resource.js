// @flow
import { isArray, curry } from "lodash/fp";
import type {
  PropertiesCollection,
  Specification,
  ResourceProperties
} from "./specifications";
import { getResourceSpecification } from "./specifications";
import type { TemplateError } from "./errors";
import { prependPath } from "./errors";
import { getPropertyErrors, getPropertiesErrors } from "./resourceValidators";

export type Resource = {
  Type: string,
  Properties: PropertiesCollection<mixed>,
  Attributes: ?PropertiesCollection<mixed>
};

export function getErrors(resource: Resource) {
  const specification = getResourceSpecification(resource.Type);
  const errors = getPropertiesCollectionErrors(resource.Properties, specification, resource.Type);

  const pathedErrors = errors.map(prependPath(resource.Type));
  console.log(pathedErrors)
  return pathedErrors;
}

export function getPropertiesCollectionErrors(properties: PropertiesCollection<mixed>, specification: Specification, resourceType: string){
  let errors = Object.keys(properties).reduce(
    (newErrors, propertyKey) => {
      return [
        ...newErrors,
        ...getPropertyErrors(
          { [propertyKey]: properties[propertyKey] },
          resourceType,
          specification
        )
      ];
    },
    []
  );

  return [...errors, ...getPropertiesErrors(properties, specification)];
}