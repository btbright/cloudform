import { makeResourceError, TemplateIssue } from "../errors";
import { IMap, ITemplate } from "../index";
import { IResource } from "../resource";
import { IResourceProperties } from "../specifications";

import getBase64Error from "./validators/base64";
import getCidrError from "./validators/cidr";
import getFindInMapError from "./validators/findInMap";
import getGetAttError from "./validators/getAtt";
import getGetAZsError from "./validators/getAZs";
import getIfError from "./validators/if";
import getJoinError from "./validators/join";
import getOrError from "./validators/or";
import getRefError from "./validators/ref";
import getSelectError from "./validators/select";
import getSplitError from "./validators/split";
import getSubError from "./validators/sub";

export function isIntrinsicFunction(valueToTest: any): boolean {
  return getIntrinsicFunctionKey(valueToTest) !== undefined;
}

export const arrayReturningFunctionKeys = [
  "Fn::GetAZs",
  "Fn::Split",
  "Fn::Cidr"
];
export const pseudoParameters = [
  "AWS::AccountId",
  "AWS::NotificationARNs",
  "AWS::NoValue",
  "AWS::Partition",
  "AWS::Region",
  "AWS::StackId",
  "AWS::StackName",
  "AWS::URLSuffix"
];

export const isPseudoParameter = (parameterName: string) =>
  pseudoParameters.indexOf(parameterName) !== -1;

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

export function getMappingError(
  mappings: { [key: string]: IMap } | undefined,
  mapName: string,
  primaryKeyName: string,
  secondaryKeyName: string
): TemplateIssue | undefined {
  if (!mappings) {
    return makeMappingError("Mappings does not exist in template");
  }
  if (!mappings[mapName]) {
    return makeMappingError(`Map does not exist: ${mapName}`);
  }
  if (
    typeof primaryKeyName === "string" &&
    !mappings[mapName][primaryKeyName]
  ) {
    return makeMappingError(
      `Map '${mapName}' does not contain key: ${primaryKeyName}`
    );
  }
  if (
    typeof primaryKeyName === "string" &&
    typeof secondaryKeyName === "string" &&
    !mappings[mapName][primaryKeyName][secondaryKeyName]
  ) {
    return makeMappingError(
      `Map '${mapName}' does not contain key: ${primaryKeyName}:${secondaryKeyName}`
    );
  }
  return;
}

const makeMappingError = (explanation: string) =>
  makeResourceError(explanation, "InvalidMappingReference");

export function getConditionsError(
  conditions: { [key: string]: any } | undefined,
  conditionName: string
): TemplateIssue | undefined {
  if (!conditions) {
    return makeConditionError("Conditions does not exist in template");
  }
  if (!conditions[conditionName]) {
    return makeConditionError(`Condition does not exist: ${conditionName}`);
  }
  return;
}

export const makeConditionError = (explanation: string) =>
  makeResourceError(explanation, "InvalidConditionReference");

export function doesResourceExist(
  resources: { [key: string]: IResource },
  resourceName: string
): boolean {
  return !!resources[resourceName];
}

export function doesParameterExist(
  parameters: { [key: string]: any } | undefined,
  parameterName: string
): boolean {
  if (!parameters) {
    return false;
  }
  return !!parameters[parameterName];
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
): TemplateIssue | undefined => {
  const intrinsicKey = getIntrinsicFunctionKey(property);
  if (!intrinsicKey) {
    return;
  }
  if (allowedFunctions.indexOf(intrinsicKey) === -1) {
    return makeInvalidFunctionUsage(
      `${functionName} only accepts the following functions for the list of values: ${allowedFunctions.join(
        ", "
      )}`
    );
  }
  return;
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

type GetIntrinsicError = (
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
) => TemplateIssue | undefined;

const errorFunctions: { [key: string]: GetIntrinsicError } = {
  "Fn::Base64": getBase64Error,
  "Fn::Cidr": getCidrError,
  "Fn::FindInMap": getFindInMapError,
  "Fn::GetAZs": getGetAZsError,
  "Fn::GetAtt": getGetAttError,
  "Fn::If": getIfError,
  "Fn::Join": getJoinError,
  "Fn::Or": getOrError,
  "Fn::Select": getSelectError,
  "Fn::Split": getSplitError,
  "Fn::Sub": getSubError,
  Ref: getRefError
};

export function getIntrinsicError(
  property: any,
  propertySpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const intrinsicFunctionKey = getIntrinsicFunctionKey(property);
  if (!intrinsicFunctionKey) {
    return;
  }
  const errorFunction = errorFunctions[intrinsicFunctionKey];
  if (errorFunction) {
    return errorFunction(property, propertySpecification, template);
  }
  return;
}

export function getContingentIntrinsicError(
  property: any,
  propertySpecification: IResourceProperties
): (template: ITemplate) => TemplateIssue | undefined {
  return template => {
    return getIntrinsicError(property, propertySpecification, template);
  };
}
