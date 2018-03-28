import { prependPath, resolveIssues, TemplateIssue } from "./errors";
import { getErrors, IResource } from "./resource";

export interface ITemplate {
  Resources: { [key: string]: IResource }
}

export function getTemplateIssues(template: ITemplate): TemplateIssue[] {
  let errors: TemplateIssue[] = [];
  if (template.Resources) {
    errors = [
      ...errors,
      ...getResourcesErrors(template.Resources).map(prependPath("Resources"))
    ];
  }
  return errors.reduce(resolveIssues(template), []);
}

function getResourcesErrors(resources: {
  [key: string]: IResource
}): TemplateIssue[] {
  return Object.keys(resources).reduce((errors: TemplateIssue[], resourceKey: string) => {
    return [
      ...errors,
      ...getErrors(resources[resourceKey]).map(prependPath(resourceKey))
    ];
  }, []);
}
