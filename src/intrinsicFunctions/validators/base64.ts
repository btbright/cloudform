import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  arrayReturningFunctionKeys,
  getIntrinsicError,
  getIntrinsicFunctionKey,
  makeInvalidFunctionUsage
} from "../index";

export default function getBase64Error(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const baseString = property["Fn::Base64"];

  const intrinsicKey = getIntrinsicFunctionKey(baseString);
  if (intrinsicKey) {
    if (arrayReturningFunctionKeys.indexOf(intrinsicKey) !== -1) {
      return makeInvalidFunctionUsage(
        `The Fn::Base64 value must be a string - ${intrinsicKey} returns a list`
      );
    }

    return getIntrinsicError(baseString, { PrimitiveType: "String" }, template);
  }

  if (typeof baseString !== "string") {
    return makeInvalidFunctionUsage(`The Fn::Base64 delimiter must be a string`);
  }
  return;
}
