import { makeResourceError, TemplateIssue } from "../errors";
import { IPropertiesCollection, ISpecification } from "../specifications";

// resources must have all required attributes defined in the specification
export default function getMissingRequiredPropertiesErrors(
  properties: IPropertiesCollection<any>,
  specification: ISpecification
): TemplateIssue[] {
  const propertyNames = Object.keys(properties);
  return getRequiredPropertyNames(specification).reduce(
    (errors: TemplateIssue[], requiredPropertyName) => {
      return [
        ...errors,
        ...getRequiredPropertyError(propertyNames, requiredPropertyName)
      ];
    },
    []
  );
}

function getRequiredPropertyError(
  propertyNames: string[],
  requiredPropertyName: string
): TemplateIssue[] {
  if (propertyNames.indexOf(requiredPropertyName) === -1) {
    return [makeMissingRequiredPropertyError(requiredPropertyName)];
  }
  return [];
}

function getRequiredPropertyNames(specification: ISpecification): string[] {
  return Object.keys(specification.Properties).filter(
    (propertyKey: string) => specification.Properties[propertyKey].Required
  );
}

const makeMissingRequiredPropertyError = (propertyName: string) =>
  makeResourceError(
    `Missing property: ${propertyName}`,
    "MissingRequiredProperty"
  );
