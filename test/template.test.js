// @flow

import { getTemplateErrors } from "../src/";
import wordpressTemplate from "./templates/wordpress.json"

test("validates a valid template without errors", () => {
    console.log(getTemplateErrors(wordpressTemplate))
    expect(getTemplateErrors(wordpressTemplate).length).toBe(0);
});
