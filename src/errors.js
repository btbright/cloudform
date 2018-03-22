import { curry } from "lodash/fp";

export type TemplateError = {
  errorString: string,
  type: string,
  path: string
};

export const makeResourceError = (
  errorString: string,
  type: string,
  path: string
) => ({ errorString, type, path: path || "" });

export const prependPath = curry((path, error) =>
  Object.assign({}, error, { path: `${path}${error.path !== "" && path.indexOf("[") === -1 ? "." : ""}${error.path}` })
);
