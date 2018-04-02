import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  getConditionsError,
  getIntrinsicError,
  getIntrinsicFunctionKey,
  makeInvalidFunctionUsage
} from "../index";

const supportedFunctions = [
  "Fn::Base64",
  "Fn::FindInMap",
  "Fn::GetAtt",
  "Fn::GetAZs",
  "Fn::If",
  "Fn::Join",
  "Fn::Select",
  "Ref"
];

export default function getIfError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const [conditionName, valueIfTrue, valueIfFalse] = property["Fn::If"];

  const conditionError = getConditionsError(template.Conditions, conditionName);
  if (conditionError) {
    return conditionError;
  }

  const valueIfTrueError = getIfArgumentError(valueIfTrue, template);
  if (valueIfTrueError) {
    return valueIfTrueError;
  }

  const valueIfFalseError = getIfArgumentError(valueIfFalse, template);
  if (valueIfFalseError) {
    return valueIfFalseError;
  }

  return;
}

function getIfArgumentError(
  property: any,
  template: ITemplate
): TemplateIssue | undefined {
  const intrinsicKey = getIntrinsicFunctionKey(property);
  if (!intrinsicKey) {
    return;
  }
  if (supportedFunctions.indexOf(intrinsicKey) === -1) {
    return makeInvalidFunctionUsage(
      `Fn::If only accepts the following functions: ${supportedFunctions.join(
        ", "
      )}`
    );
  }

  const intrinsicError = getIntrinsicError(property, undefined, template);
  if (intrinsicError) {
    return intrinsicError;
  }
  return;
}
