import * as _ from "lodash";
import { ITemplate } from "./index";

export type ResolutionFunction = (template: ITemplate) => TemplateIssue | undefined;

export class TemplateIssue {
  public type: string;
  protected isError: boolean | undefined;
  protected errorString: string;
  protected path: string;

  constructor(errorString: string, type: string, path?: string) {
    this.errorString = errorString;
    this.type = type;
    this.path = path || "";
    this.isError = true;
  }

  public toResolvable(resolutionFn: ResolutionFunction) {
    return new ResolvableTemplateIssue(
      this.errorString,
      this.type,
      this.path,
      resolutionFn
    );
  }

  public hasError() {
    return this.isError === true;
  }

  public prependPath(path: string) {
    this.path = `${path}${this.path !== "" && this.path[0] !== "[" ? "." : ""}${
      this.path
    }`;
    return this;
  }

  public setPath(path: string){
    this.path = path;
  }

  public serialize() {
    if (this.isError === false) { return; }
    return {
      errorString: this.errorString,
      path: this.path,
      type: this.type,
    };
  }
}

/*
  resolvable issues are created when a validator doesn't
  have enough information to determine a result so it provides
  a function that can be passed a template that will give the
  final result. they get resolved at the template level
*/
// tslint:disable-next-line:max-classes-per-file
export class ResolvableTemplateIssue extends TemplateIssue {
  private resolutionFn: ResolutionFunction;

  constructor(
    errorString: string,
    type: string,
    path: string,
    resolutionFn: ResolutionFunction
  ) {
    super(errorString, type, path);
    this.isError = undefined;
    this.resolutionFn = resolutionFn;
  }

  public resolve(template: ITemplate) {
    const newError = this.resolutionFn(template);
    if (newError){
      newError.setPath(this.path);
    }
    return newError;
  }
}

export const makeResourceError = (
  errorString: string,
  type: string,
  path?: string
) => new TemplateIssue(errorString, type, path);

export const prependPath = _.curry((path: string, error: TemplateIssue) =>
  error.prependPath(path)
);

export const resolveIssues = (template: ITemplate) => (
  errors: TemplateIssue[],
  issue: TemplateIssue
) => {
  const resolvedIssue =
    issue instanceof ResolvableTemplateIssue ? issue.resolve(template) : issue;
  if (resolvedIssue && resolvedIssue.hasError()) {
    errors.push(resolvedIssue);
  }
  return errors;
};
