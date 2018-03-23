//@flow
import { curry } from "lodash/fp";
import type { PropertiesCollection, Specification } from "../specifications";
import { makeResourceError } from "../errors";
import type { TemplateError } from "../errors";
import type { Resource } from "../resource"

export default function getInvalidStructureErrors(resource: Resource, specification: Specification): TemplateError[] {
  return [...getMissingSectionErrors(resource, specification)]
}

const requiredSections = ["Properties"];

function getMissingSectionErrors(resource: Resource, specification: Specification): Template[] {
    return requiredSections.reduce((errors, sectionName) => {
        if (!resource.hasOwnProperty(sectionName)){
            errors.push(makeMissingSectionError(sectionName));
        }
        return errors
    }, [])
}

const makeMissingSectionError = sectionName =>
  makeResourceError(`Missing resource section: ${sectionName}`, "MissingResourceSection");
