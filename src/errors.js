export type TemplateError = {
  errorString: string,
  type: string,
  path: string
};

export const makeResourceError = (
  errorString: string,
  type: string,
  path: string
) => ({ errorString, type, path });
