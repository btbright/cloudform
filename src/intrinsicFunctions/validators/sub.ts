import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  getIntrinsicError,
  isIntrinsicFunction,
  makeInvalidFunctionUsage,
  makeMissingReferencedResourceError,
  makeWrongFunctionUsageError
} from "../index";

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

export default function getSubError(
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

    const misuseError = makeWrongFunctionUsageError(
      replacementValue,
      subErrorArgsAllowedFunctions,
      "Fn::Sub"
    );
    if (misuseError) {
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
