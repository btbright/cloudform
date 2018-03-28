import { makeResourceError, TemplateIssue } from "../errors";
import { IResource } from "../resource";
import { ISpecification } from "../specifications";

export default function getInvalidStructureErrors(resource: IResource, specification: ISpecification): TemplateIssue[] {
  return [...getMissingSectionErrors(resource, specification)];
}

const requiredSections = ["Properties"];

function getMissingSectionErrors(resource: IResource, specification: ISpecification): TemplateIssue[] {
    return requiredSections.reduce((errors: TemplateIssue[], sectionName: string) => {
        if (!resource.hasOwnProperty(sectionName)) {
            errors.push(makeMissingSectionError(sectionName));
        }
        return errors;
    }, []);
}

const makeMissingSectionError = (sectionName: string) =>
  makeResourceError(`Missing resource section: ${sectionName}`, "MissingResourceSection");
