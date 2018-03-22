//@flow
import { curry } from "lodash";
import type { PropertiesCollection, Specification } from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError, ErrorGenerator } from "../errors";
import { getPropertyIntersectionErrors, getKeys } from "./";

//checks that there no unknown properties on the resource
//-- useful for checking for typos
export default function getUnknownPropertiesErrors(
  properties: PropertiesCollection<mixed>,
  resourceTypeName: string,
  specification: Specification
): Array<TemplateError> {
  if (typeof properties !== "object" || properties === null)
    return [{ errorString: "invalid" }];
  const errorGenerator = makeUnknownPropertyErrorGenerator(resourceTypeName);
  return getPropertyIntersectionErrors(
    getKeys(properties),
    specification.Properties,
    errorGenerator
  );
}

const makeUnknownPropertyErrorGenerator = curry(
  (resourceTypeName: string, propertyName: string) =>
    makeResourceError(
      `Type ${resourceTypeName} contains invalid property: ${propertyName}`
    )
);
