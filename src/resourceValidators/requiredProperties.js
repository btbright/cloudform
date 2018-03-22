//@flow

import { curry } from "lodash";
import type { PropertiesCollection, Specification } from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError, ErrorGenerator } from "../errors";
import { getPropertyIntersectionErrors } from "./";

//resources must have all required attributes defined in the specification
export default function getMissingRequiredPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  const errorGenerator = makeMissingPropertyErrorGenerator(resourceTypeName);
  return getPropertyIntersectionErrors(
    getRequiredPropertyNames(specification),
    properties,
    errorGenerator
  );
}

const makeMissingPropertyErrorGenerator = curry(
  (resourceTypeName: string, propertyName: string) =>
    makeResourceError(
      `Type ${resourceTypeName} contains invalid property: ${propertyName}`
    )
);

function getRequiredPropertyNames(specification: Specification): string[] {
  return Object.keys(specification.Properties).filter(
    propertyKey => specification.Properties[propertyKey].Required
  );
}
