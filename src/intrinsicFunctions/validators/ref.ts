import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import { IResourceProperties } from "../../specifications";
import {
  doesParameterExist,
  doesResourceExist,
  isIntrinsicFunction,
  isPseudoParameter,
  makeInvalidFunctionUsage,
  makeMissingReferencedResourceError
} from "../index";

export default function getRefError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const referencedResourceName = property.Ref;
  if (isIntrinsicFunction(referencedResourceName)) {
    return makeInvalidFunctionUsage(
      `Functions can not be used in the Ref function. The name must be a "string that is a resource logical ID"`
    );
  }

  if (typeof referencedResourceName !== "string") {
    return makeInvalidFunctionUsage(
      `In a Ref function, the referenced logical resource name must be a string`
    );
  }
  if (
    !isPseudoParameter(referencedResourceName) &&
    !(doesResourceExist(template.Resources, referencedResourceName) ||
    doesParameterExist(template.Parameters, referencedResourceName))
  ) {
    return makeMissingReferencedResourceError(referencedResourceName);
  }
  return;
}
