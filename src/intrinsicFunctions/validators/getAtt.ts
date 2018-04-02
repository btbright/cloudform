import _ from "lodash";
import { TemplateIssue } from "../../errors";
import { ITemplate } from "../../index";
import {
  getResourceSpecification,
  IResourceProperties
} from "../../specifications";
import {
  doesResourceExist,
  getIntrinsicError,
  getIntrinsicFunctionKey,
  isIntrinsicFunction,
  makeInvalidFunctionUsage,
  makeInvalidResourceAttributeError,
  makeInvalidResourceAttributeTypeError,
  makeMissingReferencedResourceError,
} from "../index";

export default function getGetAttError(
  property: { [key: string]: any },
  propertiesSpecification: IResourceProperties | undefined,
  template: ITemplate
): TemplateIssue | undefined {
  const [resourceName, propertyName] = property["Fn::GetAtt"];

  if (isIntrinsicFunction(resourceName)) {
    return makeInvalidFunctionUsage(
      `Functions can not be used for the Fn::GetAtt logical resource name`
    );
  }

  if (typeof resourceName !== "string") {
    return makeInvalidFunctionUsage(
      `The Fn::GetAtt logical resource name must be a string`
    );
  }

  const propertyNameIntrinsicKey = getIntrinsicFunctionKey(propertyName);
  if (propertyNameIntrinsicKey) {
    if (propertyNameIntrinsicKey !== "Ref") {
      return makeInvalidFunctionUsage(
        `Only 'Ref' function can be used for Fn::GetAtt attribute name`
      );
    }

    return getIntrinsicError(propertyName, undefined, template);
  }

  if (!propertyNameIntrinsicKey && typeof propertyName !== "string") {
    return makeInvalidFunctionUsage(
      `The Fn::GetAtt attribute name must be a string or a Ref function`
    );
  }

  if (!doesResourceExist(template.Resources, resourceName)) {
    return makeMissingReferencedResourceError(resourceName);
  }
  const resourceType = template.Resources[resourceName].Type;
  const resourceSpecification = getResourceSpecification(resourceType);
  if (resourceSpecification && resourceSpecification.Attributes) {
    const attributeSpecification =
      resourceSpecification.Attributes[propertyName];
    // does exist in attributes spec?
    if (!attributeSpecification) {
      return makeInvalidResourceAttributeError(resourceType, propertyName);
    }

    // is it the right type?
    if (
      propertiesSpecification &&
      !_.isMatch(propertiesSpecification, attributeSpecification)
    ) {
      return makeInvalidResourceAttributeTypeError(
        resourceType,
        propertiesSpecification.PrimitiveType || propertiesSpecification.PrimitiveItemType || "unknown",
        attributeSpecification.PrimitiveType
      );
    }
  }

  return;
}
