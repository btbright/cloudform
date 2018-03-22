export type TemplateError = {
  errorString: string
};

export type ErrorGenerator = (propertyName: string) => TemplateError;
export type ErrorGeneratorGenerator = (
  resourceTypeName: string
) => ErrorGenerator;

export const makeResourceError = (errorString: string) => ({ errorString });
