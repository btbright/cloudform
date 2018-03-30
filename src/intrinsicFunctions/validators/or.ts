import { makeResourceError, TemplateIssue } from "../../errors";
import { IMap, ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import { isPrimitiveTypeValueValid } from "../../utilities/primitives";
import {
  getIntrinsicError,
  getIntrinsicFunctionKey,
  isIntrinsicFunction,
  makeInvalidFunctionUsage,
  makeWrongFunctionUsageError
} from "../index";

const supportedFunctions = [
  "Fn::FindInMap",
  "Fn::If",
  "Fn::Or",
  "Fn::Equals",
  "Fn::Not",
  "Fn::And",
  "Ref"
];

export default function getOrError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties,
  template: ITemplate
): TemplateIssue | undefined {
  const conditions = property["Fn::If"];

  for (const condition of conditions){
    const argumentError = getOrArgumentError(condition, template);
    if (argumentError) {
      return argumentError;
    }
  }

  return;
}

function getOrArgumentError(
    property: any,
    template: ITemplate
  ): TemplateIssue | undefined {
    const intrinsicKey = getIntrinsicFunctionKey(property);
    if (!intrinsicKey) {
      return;
    }
    if (supportedFunctions.indexOf(intrinsicKey) === -1) {
      return makeInvalidFunctionUsage(
        `Fn::Or only accepts the following functions: ${supportedFunctions.join(
          ", "
        )}`
      );
    }
  
    const intrinsicError = getIntrinsicError(
      property,
      { PrimitiveType: "boolean" },
      template
    );
    if (intrinsicError) {
      return intrinsicError;
    }
  }
