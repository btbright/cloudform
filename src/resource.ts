// @flow
import { makeResourceError, TemplateIssue } from "./errors";
import {
  getPropertiesErrors,
  getPropertyErrors,
  getResourceErrors
} from "./resourceValidators/index";
import {
  getResourceSpecification,
  IPropertiesCollection,
  ISpecification
} from "./specifications";

export interface IResource {
  Type: string;
  Properties: IPropertiesCollection<any>;
}

export function getErrors(resource: IResource): TemplateIssue[] {
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

// errors concerned only with collection of properties
export function getPropertiesCollectionErrors(
  properties: IPropertiesCollection<any>,
  specification: ISpecification,
  resourceType: string
): TemplateIssue[] {
  const errors = Object.keys(properties).reduce(
    (newErrors: TemplateIssue[], propertyKey) => {
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
