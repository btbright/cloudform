import _ from "lodash";
import { makeResourceError, TemplateIssue } from "../errors";
import { ITemplate } from "../index";
import { IResource } from "../resource";
import {
  getResourceSpecification,
  IResourceProperties
} from "../specifications";
import getBase64Error from "./validators/base64";
import getGetAttError from "./validators/getAtt";
import getGetAZsError from "./validators/getAZs";
import getRefError from "./validators/ref";
import getSplitError from "./validators/split";
import getSubError from "./validators/sub";

export function isIntrinsicFunction(valueToTest: any): boolean {
  return getIntrinsicFunctionKey(valueToTest) !== undefined;
}

export const arrayReturningFunctionKeys = ["Fn::GetAZs", "Fn::Split"];

export function isArrayReturningFunction(valueToTest: any): boolean {
  const functionKey = getIntrinsicFunctionKey(valueToTest);
  if (!functionKey) {
    return false;
  }
  return arrayReturningFunctionKeys.indexOf(functionKey) !== -1;
}

export function getIntrinsicFunctionKey(valueToTest: any): string | undefined {
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

export const makeInvalidFunctionUsage = (explanation: string) =>
  makeResourceError(
    `Improper use of intrinsic function: ${explanation}`,
    "ImproperIntrinsicFunctionUsage"
  );

export const makeWrongFunctionUsageError = (
  property: any,
  allowedFunctions: string[],
  functionName: string
) => {
  const intrinsicKey = getIntrinsicFunctionKey(property);
  if (!intrinsicKey) {
    return;
  }
  if (allowedFunctions.indexOf(intrinsicKey) === -1) {
    return makeInvalidFunctionUsage(
      `Fn::Split only accepts the following functions for the list of values: ${allowedFunctions.join(
        ", "
      )}`
    );
  }
};

export const makeInvalidResourceAttributeTypeError = (
  resourceType: string,
  correctType: string,
  foundType: string
) =>
  makeResourceError(
    `Referenced attribute of resource type '${resourceType}' is not a valid type: expected a '${correctType}' but got a '${foundType}'`,
    "InvalidResourceAttributeType"
  );

export const makeInvalidResourceAttributeError = (
  resourceType: string,
  attributeName: string
) =>
  makeResourceError(
    `Referenced attribute of resource type '${resourceType}' is not valid: '${attributeName}'`,
    "InvalidResourceAttribute"
  );

export const makeMissingReferencedResourceError = (resourceName: string) =>
  makeResourceError(
    `Referenced resource does not exist: '${resourceName}'`,
    "MissingReferencedResource"
  );

export const makeMissingReferencedPropertyError = (
  resourceName: string,
  propertyName: string
) =>
  makeResourceError(
    `Referenced property does not exist on resource '${resourceName}': '${propertyName}'`,
    "MissingReferencedProperty"
  );

const errorFunctions = {
  "Fn::Base64": getBase64Error,
  "Fn::GetAZs": getGetAZsError,
  "Fn::GetAtt": getGetAttError,
  "Fn::Split": getSplitError,
  "Fn::Sub": getSubError,
  Ref: getRefError
};

export function getIntrinsicError(
  property: any,
  propertySpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const intrinsicFunctionKey = getIntrinsicFunctionKey(property);
  const errorFunction = errorFunctions[intrinsicFunctionKey];
  if (errorFunction) {
    return errorFunction(property, propertySpecification, template);
  }
  return;
}
