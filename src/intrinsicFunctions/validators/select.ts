import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import { isPrimitiveTypeValueValid } from "../../utilities/primitives";
import {
  getIntrinsicError,
  getIntrinsicFunctionKey,
  isIntrinsicFunction,
  makeInvalidFunctionUsage,
  makeWrongFunctionUsageError
} from "../index";

const indexFunctions = ["Fn::FindInMap", "Ref"];

const valueFunctions = [
  "Fn::FindInMap",
  "Fn::GetAtt",
  "Fn::GetAZs",
  "Fn::If",
  "Fn::Split",
  "Ref"
];

export default function getSelectError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const [index, listOfObjects] = property["Fn::Select"];

  const indexIntrinsicKey = getIntrinsicFunctionKey(index);
  if (indexIntrinsicKey) {
    if (indexFunctions.indexOf(indexIntrinsicKey) === -1) {
      return makeInvalidFunctionUsage(
        `The Fn::Select index value only accepts the following functions: ${indexFunctions.join(
          ", "
        )}`
      );
    }

    const indexIntrinsicError = getIntrinsicError(
      index,
      { PrimitiveType: "Integer" },
      template
    );
    if (indexIntrinsicError) {
      return indexIntrinsicError;
    }
  } else if (!isPrimitiveTypeValueValid(index, "integer")) {
    return makeInvalidFunctionUsage(
      `The Fn::Select index value must be an integer`
    );
  }

  if (isIntrinsicFunction(listOfObjects)) {
    const misuseError = makeWrongFunctionUsageError(
      listOfObjects,
      valueFunctions,
      "Fn::Select"
    );
    if (misuseError) {
      return misuseError;
    }

    // the values list argument has to be a string
    return getIntrinsicError(
      listOfObjects,
      { Type: "List", PrimitiveItemType: "String" },
      template
    );
  } else if (!Array.isArray(listOfObjects)) {
    return makeInvalidFunctionUsage(
      `The Fn::Select list of values must be a list`
    );
  }
  return;
}
