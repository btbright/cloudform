// @flow
import type { Template } from "./index";
import type { TemplateIssue } from "./errors";
import { makeResourceError } from "./errors";
import type { Resource } from "./resource";
import { getResourceSpecification } from "./specifications";
import type { Specification } from "./specifications";

export function isIntrinsicFunction(valueToTest: mixed): boolean {
  return getIntrinsicFunctionKey(valueToTest) !== undefined;
}

const arrayReturningFunctionKeys = ["Fn::GetAZs", "Fn::Split"];

export function isArrayReturningFunction(valueToTest: mixed): boolean {
  const functionKey = getIntrinsicFunctionKey(valueToTest);
  if (!functionKey) return false;
  return arrayReturningFunctionKeys.indexOf(functionKey) !== -1;
}

function getIntrinsicFunctionKey(valueToTest: mixed): ?string {
  if (typeof valueToTest !== "object" || valueToTest === null) return;
  const typedObject: { [key: string]: mixed } = valueToTest;
  const objectKeys = Object.keys(typedObject);
  if (objectKeys.length === 0) return;
  if (objectKeys[0].indexOf("Fn::") !== -1) return objectKeys[0];
  return objectKeys[0] === "Ref" ? objectKeys[0] : undefined;
}

export function isTemplateStructureError(template: Template): boolean {
  return false;
}

export function getIntrinsicFunctionPrimitivePropertyIssues(
  primitiveType: string,
  property: { [key: string]: { [key: string]: mixed } }
): (mixed, mixed) => ?TemplateIssue {
  return template => {
    const intrinsicFunctionKey = getIntrinsicFunctionKey(property);
    if (intrinsicFunctionKey === "Fn::GetAtt") {
      return getGetAttError(template, property, primitiveType);
    }
  };
}

export function doesResourceExist(
  resources: { [key: string]: Resource },
  resourceName: string
): boolean {
  return !!resources[resourceName];
}

export function doesPropertyExist(
  resources: { [key: string]: Resource },
  resourceName: string,
  propertyName: string
): boolean {
  if (!resources[resourceName]) return false;
  return typeof resources[resourceName][propertyName] !== "undefined";
}

export function getRefError(
  template: Template,
  property: { [key: string]: mixed },
  primitiveType: string
): ?TemplateIssue {
  const referencedResourceName = property["Ref"];
  if (isIntrinsicFunction(referencedResourceName)) {
    return makeInvalidFunctionUsage(
      `Functions can not be used in the Ref function. The name must be a "string that is a resource logical ID"`
    );
  }

  if (typeof referencedResourceName !== "string"){
    return makeInvalidFunctionUsage(
      `In a Ref function, the referenced logical resource name must be a string`
    );
  }

  if (!doesResourceExist(template.Resources, referencedResourceName)) {
    return makeMissingReferencedResourceError(referencedResourceName);
  }

  //todo - match return type of referenced type to needed
}

export function getGetAttError(
  template: Template,
  property: { [key: string]: { [key: string]: mixed } },
  primitiveType: string
): ?TemplateIssue {
  const [resourceName, propertyName] = property["Fn::GetAtt"];

  if (isIntrinsicFunction(resourceName)) {
    return makeInvalidFunctionUsage(
      `Functions can not be used for the Fn::GetAtt logical resource name`
    );
  }

  const propertyNameIntrinsicKey = getIntrinsicFunctionKey(propertyName);
  if (propertyNameIntrinsicKey && propertyNameIntrinsicKey !== "Ref") {
    return makeInvalidFunctionUsage(
      `Only 'Ref' function can be used for Fn::GetAtt attribute name`
    );
  }

  if (typeof resourceName !== "string") {
    return makeInvalidFunctionUsage(
      `The Fn::GetAtt logical resource name must be a string`
    );
  }

  if (typeof propertyName !== "string") {
    return makeInvalidFunctionUsage(
      `The Fn::GetAtt attribute name must be a string or a Ref function`
    );
  }

  if (!doesResourceExist(template.Resources, resourceName)) {
    return makeMissingReferencedResourceError(resourceName);
  }
  const resourceType = template.Resources[resourceName].Type;
  const resourceSpecification = getResourceSpecification(resourceType);

  if (!resourceSpecification.Attributes) {
    return makeInvalidResourceAttributeError(resourceType, propertyName);
  }

  const attributeSpecification = resourceSpecification.Attributes[propertyName];

  //does exist in attributes spec?
  if (!attributeSpecification) {
    return makeInvalidResourceAttributeError(resourceType, propertyName);
  }

  //is it the right type?
  if (attributeSpecification.PrimitiveType !== primitiveType) {
    return makeInvalidResourceAttributeTypeError(
      resourceType,
      primitiveType,
      attributeSpecification.PrimitiveType
    );
  }

  if (!doesPropertyExist(template.Resources, resourceName, propertyName)) {
    return makeMissingReferencedPropertyError(resourceName, propertyName);
  }
}

const makeInvalidFunctionUsage = (explanation): TemplateIssue =>
  makeResourceError(
    `Improper use of intrinsic function: ${explanation}`,
    "ImproperIntrinsicFunctionUsage"
  );

const makeInvalidResourceAttributeTypeError = (
  resourceType: string,
  correctType: string,
  foundType: string
): TemplateIssue =>
  makeResourceError(
    `Referenced attribute of resource type '${resourceType}' is not a valid type: expected a '${correctType}' but got a '${foundType}'`,
    "InvalidResourceAttributeType"
  );

const makeInvalidResourceAttributeError = (
  resourceType: string,
  attributeName: string
): TemplateIssue =>
  makeResourceError(
    `Referenced attribute of resource type '${resourceType}' is not valid: '${attributeName}'`,
    "InvalidResourceAttribute"
  );

const makeMissingReferencedResourceError = (
  resourceName: string
): TemplateIssue =>
  makeResourceError(
    `Referenced resource does not exist: '${resourceName}'`,
    "MissingReferencedResource"
  );

const makeMissingReferencedPropertyError = (
  resourceName: string,
  propertyName: string
): TemplateIssue =>
  makeResourceError(
    `Referenced property does not exist on resource '${resourceName}': '${propertyName}'`,
    "MissingReferencedProperty"
  );
