import _ from "lodash";
import { makeResourceError, TemplateIssue } from "./errors";
import { ITemplate } from "./index";
import { IResource } from "./resource";
import {
  getResourceSpecification,
  IResourceProperties
} from "./specifications";

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

export function getGetAZsError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const region = property["Fn::GetAZs"];
  
  const intrinsicKey = getIntrinsicFunctionKey(region);
  if (intrinsicKey){
    if (intrinsicKey !== "Ref"){
      return makeInvalidFunctionUsage(`Only 'Ref' function can be used for Fn::GetAZs region name`);
    }
    
    return getIntrinsicError(region, { PrimitiveType: "String" }, template);
  }

  if (typeof region !== "string") {
    return makeInvalidFunctionUsage(`The Fn::GetAZs region name must be a string`);
  }
}

export function getBase64Error(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const baseString = property["Fn::Sub"];
  
  const intrinsicKey = getIntrinsicFunctionKey(baseString);
  if (intrinsicKey){
    if (arrayReturningFunctionKeys.indexOf(intrinsicKey) !== -1){
      return makeInvalidFunctionUsage(`The Fn::Base64 value must be a string - ${intrinsicKey} returns a list`);
    }
    
    return getIntrinsicError(baseString, { PrimitiveType: "String" }, template);
  }

  if (typeof baseString !== "string") {
    return makeInvalidFunctionUsage(`The Fn::Sub delimiter must be a string`);
  }
}

const subErrorArgsAllowedFunctions = [
  "Fn::Base64",
  "Fn::FindInMap",
  "Fn::GetAtt",
  "Fn::GetAZs",
  "Fn::If",
  "Fn::Join",
  "Fn::Select",
  "Ref"
];

export function getSubError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const [baseString, replacements] = property["Fn::Sub"];
  if (typeof baseString !== "string") {
    return makeInvalidFunctionUsage(`The Fn::Sub delimiter must be a string`);
  }

  if (!replacements) {
    return;
  }

  const replacementKeys = Object.keys(replacements);
  for (const replacementKey of replacementKeys) {
    const replacementValue = replacements[replacementKey];

    const misuseError = makeWrongFunctionUsageError(replacementValue, splitErrorArgsAllowedFunctions, "Fn::Sub");
    if (misuseError){
      return misuseError;
    }

    const replacementError = getIntrinsicError(
      replacementValue,
      { PrimitiveType: "String" },
      template
    );
    if (replacementError) {
      return replacementError;
    }
  }
}

const splitErrorArgsAllowedFunctions = [
  "Fn::Base64",
  "Fn::FindInMap",
  "Fn::GetAtt",
  "Fn::GetAZs",
  "Fn::If",
  "Fn::Join",
  "Fn::Select",
  "Ref"
];

export function getSplitError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const [delimeter, args] = property["Fn::Split"];
  if (typeof delimeter !== "string") {
    return makeInvalidFunctionUsage(`The Fn::Split delimiter must be a string`);
  }

  if (isIntrinsicFunction(args)) {
    const misuseError = makeWrongFunctionUsageError(args, splitErrorArgsAllowedFunctions, "Fn::Split");
    if (misuseError){
      return misuseError;
    }

    // the values list argument has to be a string
    return getIntrinsicError(args, { PrimitiveType: "String" }, template);
  }

  if (typeof args !== "string") {
    return makeInvalidFunctionUsage(
      `The Fn::Split list of values must be a delimited string`
    );
  }
}

export function getRefError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const referencedResourceName = property.Ref;
  if (isIntrinsicFunction(referencedResourceName)) {
    return makeInvalidFunctionUsage(
      `Functions can not be used in the Ref function. The name must be a "string that is a resource logical ID"`
    );
  }

  if (typeof referencedResourceName !== "string") {
    return makeInvalidFunctionUsage(
      `In a Ref function, the referenced logical resource name must be a string`
    );
  }

  if (!doesResourceExist(template.Resources, referencedResourceName)) {
    return makeMissingReferencedResourceError(referencedResourceName);
  }
  return;
}

export function getGetAttError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const [resourceName, propertyName] = property["Fn::GetAtt"];

  if (isIntrinsicFunction(resourceName)) {
    return makeInvalidFunctionUsage(
      `Functions can not be used for the Fn::GetAtt logical resource name`
    );
  }

  if (typeof resourceName !== "string") {
    return makeInvalidFunctionUsage(
      `The Fn::GetAtt logical resource name must be a string`
    );
  }

  const propertyNameIntrinsicKey = getIntrinsicFunctionKey(propertyName);
  if (propertyNameIntrinsicKey) {
    if (propertyNameIntrinsicKey !== "Ref") {
      return makeInvalidFunctionUsage(
        `Only 'Ref' function can be used for Fn::GetAtt attribute name`
      );
    }

    return getIntrinsicError(propertyName, undefined, template);
  }

  if (!propertyNameIntrinsicKey && typeof propertyName !== "string") {
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
    if (
      propertiesSpecification &&
      !_.isMatch(propertiesSpecification, attributeSpecification)
    ) {
      return makeInvalidResourceAttributeTypeError(
        resourceType,
        propertiesSpecification.PrimitiveType,
        attributeSpecification.PrimitiveType
      );
    }
  }

  return;
}

const makeInvalidFunctionUsage = (explanation: string) =>
  makeResourceError(
    `Improper use of intrinsic function: ${explanation}`,
    "ImproperIntrinsicFunctionUsage"
  );

const makeWrongFunctionUsageError = (
  property: any,
  allowedFunctions: string[],
  functionName: string,
) => {
  const intrinsicKey = getIntrinsicFunctionKey(property);
  if (!intrinsicKey) {return;}
  if (allowedFunctions.indexOf(intrinsicKey) === -1) {
    return makeInvalidFunctionUsage(
      `Fn::Split only accepts the following functions for the list of values: ${allowedFunctions.join(
        ", "
      )}`
    );
  }
};

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

const errorFunctions = {
  "Fn::Base64": getBase64Error,
  "Fn::GetAZs": getGetAZsError,
  "Fn::GetAtt": getGetAttError,
  "Fn::Split": getSplitError,
  "Fn::Sub": getSubError,
  "Ref": getRefError,
}

export function getIntrinsicError(
  property: any,
  propertySpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const intrinsicFunctionKey = getIntrinsicFunctionKey(property);
  const errorFunction = errorFunctions[intrinsicFunctionKey];
  if (errorFunction){
    return errorFunction(property, propertySpecification, template);
  }
  return;
}
