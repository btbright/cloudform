// @flow
import { isArray, curry } from "lodash";
import type {
  PropertiesCollection,
  Specification,
  ResourceProperties
} from "./specifications";
import { getResourceSpecification } from "./specifications";
import type { TemplateError } from "./errors";
import { getPropertiesErrors } from "./resourceValidators";

type Resource = {
  Type: string,
  Properties: PropertiesCollection<mixed>,
  Attributes: ?PropertiesCollection<mixed>
};

export function getResourceErrors(resource: Resource) {
  const specification = getResourceSpecification(resource.Type);
  const errors = getPropertiesErrors(resource.Properties, resource.Type, specification);
  console.log(errors);
  return errors;
}
