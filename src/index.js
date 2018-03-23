// @flow

import { getErrors } from "./resource";
import type { Resource } from "./resource";
import type { TemplateIssue } from "./errors";
import { prependPath, resolveIssues } from "./errors";

export type Template = {
  Resources: ?{ [key: string]: Resource }
};

export function getTemplateIssues(template: Template): Array<TemplateIssue> {
  let errors = [];
  if (template.Resources) {
    errors = [
      ...errors,
      ...getResourcesErrors(template.Resources).map(prependPath("Resources"))
    ];
  }
  return errors.reduce(resolveIssues(template), []);
}

function getResourcesErrors(resources: {
  [key: string]: Resource
}): Array<TemplateIssue> {
  return Object.keys(resources).reduce((errors, resourceKey) => {
    return [
      ...errors,
      ...getErrors(resources[resourceKey]).map(prependPath(resourceKey))
    ];
  }, []);
}
