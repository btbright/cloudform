import { makeResourceError, TemplateIssue } from "../errors";
import { ISpecification } from "../specifications";

// checks that there no unknown properties on the resource
// -- useful for checking for typos
export default function getUnknownPropertiesErrors(
  property: { [key: string]: any },
  resourceTypeName: string,
  specification: ISpecification
): TemplateIssue[] {
  const propertyName = Object.keys(property)[0];
  const specificationPropertyNames = Object.keys(specification.Properties);
  if (specificationPropertyNames.indexOf(propertyName) === -1) {
    return [makeInvalidPropertyError(propertyName)];
  }
  return [];
}

const makeInvalidPropertyError = (propertyName: string) =>
  makeResourceError(`Invalid property`, "UnknownProperty", propertyName);