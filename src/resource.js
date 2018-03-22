// @flow
import { isArray, curry } from "lodash/fp";
import type {
  PropertiesCollection,
  Specification,
  ResourceProperties
} from "./specifications";
import { getResourceSpecification } from "./specifications";
import type { TemplateError } from "./errors";
import { getPropertyErrors, getResourceErrors } from "./resourceValidators";

export type Resource = {
  Type: string,
  Properties: PropertiesCollection<mixed>,
  Attributes: ?PropertiesCollection<mixed>
};

export function getErrors(resource: Resource) {
  const specification = getResourceSpecification(resource.Type);
  let errors = Object.keys(resource.Properties).reduce((newErrors, propertyKey) => {
    const propErrors = getPropertyErrors({[propertyKey]: resource.Properties[propertyKey]}, resource.Type, specification);
    return [...newErrors, ...propErrors]
  }, []);

  errors = [...errors, ...getResourceErrors(resource, specification)];

  console.log(errors);
  return errors;
}
