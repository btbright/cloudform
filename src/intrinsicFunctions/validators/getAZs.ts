import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import {
  IResourceProperties
} from "../../specifications";
import {
  getIntrinsicError,
  getIntrinsicFunctionKey,
  makeInvalidFunctionUsage,
} from "../index";


export default function getGetAZsError(
    property: { [key: string]: any },
    propertiesSpecification: IResourceProperties | undefined,
    template: ITemplate
  ): TemplateIssue | undefined {
    const region = property["Fn::GetAZs"];
  
    const intrinsicKey = getIntrinsicFunctionKey(region);
    if (intrinsicKey) {
      if (intrinsicKey !== "Ref") {
        return makeInvalidFunctionUsage(
          `Only 'Ref' function can be used for Fn::GetAZs region name`
        );
      }
  
      return getIntrinsicError(region, { PrimitiveType: "String" }, template);
    }
  
    if (typeof region !== "string") {
      return makeInvalidFunctionUsage(
        `The Fn::GetAZs region name must be a string`
      );
    }
    return;
  }