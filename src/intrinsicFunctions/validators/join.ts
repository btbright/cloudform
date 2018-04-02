import _ from "lodash";
import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  getIntrinsicError,
  getIntrinsicFunctionKey,
  makeInvalidFunctionUsage
} from "../index";

const indexFunctions = ["Fn::FindInMap", "Ref"];

const valueFunctions = [
  "Fn::Base64",
  "Fn::FindInMap",
  "Fn::GetAtt",
  "Fn::GetAZs",
  "Fn::If",
  "Fn::ImportValue",
  "Fn::Join",
  "Fn::Split",
  "Fn::Select",
  "Fn::Sub",
  "Ref"
];

export default function getJoinError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const [delimiter, listOfObjects] = property["Fn::Join"];

  if (typeof delimiter !== "string") {
    return makeInvalidFunctionUsage(`The Fn::Join delimiter must be a string`);
  }

  const indexIntrinsicKey = getIntrinsicFunctionKey(listOfObjects);
  if (indexIntrinsicKey) {
    if (indexFunctions.indexOf(indexIntrinsicKey) === -1) {
      return makeInvalidFunctionUsage(
        `The Fn::Join index values list only accepts the following functions: ${indexFunctions.join(
          ", "
        )}`
      );
    }

    const indexIntrinsicError = getIntrinsicError(
      listOfObjects,
      { Type: "List", PrimitiveItemType: "String" },
      template
    );
    if (indexIntrinsicError) {
      return indexIntrinsicError;
    }
  } else if (!_.isArray(listOfObjects)) {
    return makeInvalidFunctionUsage(`The Fn::Join values list must be a list`);
  }

  if (indexIntrinsicKey) {
    return;
  }

  // validate items in list for intrinsic errors
  for (const listItem of listOfObjects) {
    const intrinsicKey = getIntrinsicFunctionKey(listItem);
    if (!intrinsicKey) {
      continue;
    }

    // check that function is in list
    if (valueFunctions.indexOf(intrinsicKey) === -1) {
      return makeInvalidFunctionUsage(
        `The Fn::Join values list only accepts the following functions: ${indexFunctions.join(
          ", "
        )}`
      );
    }

    const intrinsicError = getIntrinsicError(
      listItem,
      { PrimitiveType: "String" },
      template
    );
    if (intrinsicError) {
      return intrinsicError;
    }
  }
  return;
}
