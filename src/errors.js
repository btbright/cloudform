// @flow
import { curry } from "lodash/fp";
import type { Template } from "./index";

type ResolutionFunction = Template => boolean;

class TemplateIssue {
  errorString: string;
  type: string;
  path: string;
  isError: ?boolean;

  constructor(errorString: string, type: string, path: ?string) {
    this.errorString = errorString;
    this.type = type;
    this.path = path || "";
    this.isError = true;
  }

  toResolvable(resolutionFn: ResolutionFunction) {
    return new ResolvableTemplateIssue(
      this.errorString,
      this.type,
      this.path,
      resolutionFn
    );
  }

  isError() {
    return typeof this.isError !== "undefined";
  }

  prependPath(path) {
    //console.log('path', path)
    this.path = `${path}${this.path !== "" && this.path[0] !== "[" ? "." : ""}${
      this.path
    }`;
    return this;
  }

  serialize() {
    if (this.isError === false) return;
    return {
      errorString: this.errorString,
      type: this.type,
      path: this.path
    };
  }
}

class ResolvableTemplateIssue extends TemplateIssue {
  resolutionFn: ResolutionFunction;

  constructor(
    errorString: string,
    type: string,
    path: ?string,
    resolutionFn: ResolutionFunction
  ) {
    super(errorString, type, path);
    this.isError = undefined;
    this.resolutionFn = resolutionFn;
  }

  resolve(template: Template) {
    this.isError = this.resolutionFn(template);
    return this;
  }
}

export const makeResourceError = (
  errorString: string,
  type: string,
  path: string
) => new TemplateIssue(errorString, type, path);

export const prependPath = curry((path, error) => error.prependPath(path));

export const resolveIssues = template => (errors, issue) => {
  const resolvedIssue = issue instanceof ResolvableTemplateIssue ? issue.resolve(template) : issue
  if (resolvedIssue.isError){
    errors.push(resolvedIssue);
  }
  return errors;
}
