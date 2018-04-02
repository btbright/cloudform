import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  getIntrinsicError,
  getIntrinsicFunctionKey,
  makeInvalidFunctionUsage
} from "../index";

export default function getCidrError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const [ipBlock, count, sizeMask] = property["Fn::Cidr"];

  const ipBlockError = getCidrArgumentError(ipBlock, template);
  if (ipBlockError) {
    return ipBlockError;
  }

  const countError = getCidrArgumentError(count, template);
  if (countError) {
    return countError;
  }

  const sizeMaskError = getCidrArgumentError(sizeMask, template);
  if (sizeMaskError) {
    return sizeMaskError;
  }

  return;
}

const allowedFunctionKeys = ["Ref", "Fn::Select"];

function getCidrArgumentError(
  property: any,
  template: ITemplate
): TemplateIssue | undefined {
  const intrinsicKey = getIntrinsicFunctionKey(property);
  if (!intrinsicKey) {
    if (typeof property !== "string") {
      return makeInvalidFunctionUsage(`The Fn::Cidr arguments must be strings`);
    }
    return;
  }
  if (allowedFunctionKeys.indexOf(intrinsicKey) === -1) {
    return makeInvalidFunctionUsage(
      `Fn::Cidr only accepts the following functions: ${allowedFunctionKeys.join(
        ", "
      )}`
    );
  }
  const intrinsicError = getIntrinsicError(
    property,
    { PrimitiveType: "String" },
    template
  );
  if (intrinsicError) {
    return intrinsicError;
  }

  return;
}
