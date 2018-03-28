import { makeResourceError, TemplateIssue } from "./errors";
import { ITemplate } from "./index";
import { IResource } from "./resource";
import { getResourceSpecification, ISpecification } from "./specifications";

export function isIntrinsicFunction(valueToTest: any): boolean {
  return getIntrinsicFunctionKey(valueToTest) !== undefined;
}

const arrayReturningFunctionKeys = ["Fn::GetAZs", "Fn::Split"];

export function isArrayReturningFunction(valueToTest: any): boolean {
  const functionKey = getIntrinsicFunctionKey(valueToTest);
  if (!functionKey) {
    return false;
  }
  return arrayReturningFunctionKeys.indexOf(functionKey) !== -1;
}

function getIntrinsicFunctionKey(valueToTest: any): string | undefined {
  if (typeof valueToTest !== "object" || valueToTest === null) {
    return;
  }
  const typedObject: { [key: string]: any } = valueToTest;
  const objectKeys = Object.keys(typedObject);
  if (objectKeys.length === 0) {
    return;
  }
  if (objectKeys[0].indexOf("Fn::") !== -1) {
    return objectKeys[0];
  }
  return objectKeys[0] === "Ref" ? objectKeys[0] : undefined;
}

export function isTemplateStructureError(template: ITemplate): boolean {
  return false;
}

export function getIntrinsicFunctionPrimitivePropertyIssues(
  primitiveType: string,
  property: any,
): (template: ITemplate) => TemplateIssue | undefined {
  return (template: ITemplate) => {
    const intrinsicFunctionKey = getIntrinsicFunctionKey(property);
    if (intrinsicFunctionKey === "Fn::GetAtt") {
      return getGetAttError(template, property, primitiveType);
    }
    return;
  };
}

export function doesResourceExist(
  resources: { [key: string]: IResource },
  resourceName: string
): boolean {
  return !!resources[resourceName];
}

export function doesPropertyExist(
  resources: { [key: string]: IResource },
  resourceName: string,
  propertyName: string
): boolean {
  if (!resources[resourceName]) {
    return false;
  }
  return (
    typeof resources[resourceName].Properties[propertyName] !== "undefined"
  );
}

export function getGetAttError(
  template: ITemplate,
  property: { [key: string]: any },
  primitiveType: string
): TemplateIssue | undefined {
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
  if (resourceSpecification && resourceSpecification.Attributes) {
    const attributeSpecification =
      resourceSpecification.Attributes[propertyName];
    // does exist in attributes spec?
    if (!attributeSpecification) {
      return makeInvalidResourceAttributeError(resourceType, propertyName);
    }

    // is it the right type?
    if (attributeSpecification.PrimitiveType !== primitiveType) {
      return makeInvalidResourceAttributeTypeError(
        resourceType,
        primitiveType,
        attributeSpecification.PrimitiveType
      );
    }
  }

  if (!doesPropertyExist(template.Resources, resourceName, propertyName)) {
    return makeMissingReferencedPropertyError(resourceName, propertyName);
  }

  return;
}

const makeInvalidFunctionUsage = (explanation: string) =>
  makeResourceError(
    `Improper use of intrinsic function: ${explanation}`,
    "ImproperIntrinsicFunctionUsage"
  );

const makeInvalidResourceAttributeTypeError = (
  resourceType: string,
  correctType: string,
  foundType: string
) =>
  makeResourceError(
    `Referenced attribute of resource type '${resourceType}' is not a valid type: expected a '${correctType}' but got a '${foundType}'`,
    "InvalidResourceAttributeType"
  );

const makeInvalidResourceAttributeError = (
  resourceType: string,
  attributeName: string
) =>
  makeResourceError(
    `Referenced attribute of resource type '${resourceType}' is not valid: '${attributeName}'`,
    "InvalidResourceAttribute"
  );

const makeMissingReferencedResourceError = (resourceName: string) =>
  makeResourceError(
    `Referenced resource does not exist: '${resourceName}'`,
    "MissingReferencedResource"
  );

const makeMissingReferencedPropertyError = (
  resourceName: string,
  propertyName: string
) =>
  makeResourceError(
    `Referenced property does not exist on resource '${resourceName}': '${propertyName}'`,
    "MissingReferencedProperty"
  );
