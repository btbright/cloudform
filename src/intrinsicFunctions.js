//@flow
import type { Template } from "../index";

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