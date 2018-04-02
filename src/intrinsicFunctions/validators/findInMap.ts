import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  getIntrinsicError,
  getIntrinsicFunctionKey,
  getMappingError,
  makeInvalidFunctionUsage,
} from "../index";

export default function getFindInMapError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const [mapName, primaryKeyName, secondaryKeyName] = property["Fn::FindInMap"];

  const mappingError = getMappingError(
    template.Mappings,
    mapName,
    primaryKeyName,
    secondaryKeyName
  );
  if (mappingError) {
    return mappingError;
  }

  const mapNameError = getMappingArgumentError(mapName, template);
  if (mapNameError) {
    return mapNameError;
  }

  const primaryKeyNameError = getMappingArgumentError(primaryKeyName, template);
  if (primaryKeyNameError) {
    return primaryKeyNameError;
  }

  const secondaryKeyNameError = getMappingArgumentError(
    secondaryKeyName,
    template
  );
  if (secondaryKeyNameError) {
    return secondaryKeyNameError;
  }
  return;
}

const allowedFunctionKeys = ["Ref", "Fn::FindInMap"];

function getMappingArgumentError(
  property: any,
  template: ITemplate
): TemplateIssue | undefined {
  const intrinsicKey = getIntrinsicFunctionKey(property);
  if (!intrinsicKey) {
    if (typeof property !== "string") {
      return makeInvalidFunctionUsage(`The Fn::FindInMap keys must be strings`);
    }
    return;
  }
  if (allowedFunctionKeys.indexOf(intrinsicKey) === -1) {
    return makeInvalidFunctionUsage(
      `Fn::FindInMap only accepts the following functions: ${allowedFunctionKeys.join(
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
