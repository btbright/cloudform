// @flow

import { getResourceErrors } from "./resource";
import type { Resource } from "./resource";
import type { TemplateError } from "./errors";

type Template = {
  Resources: ?{[key: string]: Resource}
};

export function getTemplateErrors(template: Template): Array<TemplateError> {
  let errors = [];
  if (template.Resources){
    errors = [...errors, ...getResourcesErrors(template.Resources)]
  }
  return errors;
}

function getResourcesErrors(resources: {[key: string]: Resource}): Array<TemplateError>{
  return Object.keys(resources).reduce((errors, resourceKey)=> {
    return [...errors, ...getResourceErrors(resources[resourceKey])]
  }, []);
}