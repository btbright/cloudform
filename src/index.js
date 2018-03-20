// @flow
import { getResourceTypeDefinition } from "./typeDefinitions";

import type { ResourceType } from "./typeDefinitions";

type TemplateError = {
  errorString: string
};

type Resource = {
    Type: string,
    Properties: { [key: string]: mixed },
    Attributes: { [key: string]: mixed }
}

type Validator = (Resource, ResourceType) => Array<TemplateError>;

export function getResourceErrors(resource: any) {
  const typeDefinition = getResourceTypeDefinition(resource.Type);
  const validators: Array<Validator> = [getMissingRequiredPropertiesErrors];
  return validators.reduce((errors, validator) => {
    return [...errors, ...validator(resource, typeDefinition)];
  }, []);
}

function getMissingRequiredPropertiesErrors(
  resource: Resource,
  typeDefinition: ResourceType
): Array<TemplateError> {
  return getRequiredPropertyNames(typeDefinition).reduce(
    (errors, propertyKey: string) => {
      if (!resource.Properties.hasOwnProperty(propertyKey)) {
        errors.push({ errorString: `Type ${resource.Type} missing required property: ${propertyKey}` });
      }
      return errors;
    },
    []
  );
}

function getRequiredPropertyNames(typeDefinition: ResourceType): string[] {
    return Object.keys(typeDefinition.Properties).filter(propertyKey => typeDefinition.Properties[propertyKey].Required);
}
