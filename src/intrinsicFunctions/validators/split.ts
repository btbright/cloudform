import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  getIntrinsicError,
  isIntrinsicFunction,
  makeInvalidFunctionUsage,
  makeWrongFunctionUsageError
} from "../index";

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

export default function getSplitError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const [delimeter, args] = property["Fn::Split"];
  if (typeof delimeter !== "string") {
    return makeInvalidFunctionUsage(`The Fn::Split delimiter must be a string`);
  }

  if (isIntrinsicFunction(args)) {
    const misuseError = makeWrongFunctionUsageError(
      args,
      splitErrorArgsAllowedFunctions,
      "Fn::Split"
    );
    if (misuseError) {
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
