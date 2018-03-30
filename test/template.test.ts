import { getTemplateIssues } from "../src/";
import errorWordpressTemplate from "./templates/wordpress-errors.json"
import wordpressTemplate from "./templates/wordpress.json"

test("validates a valid template without errors", () => {
    const errors = getTemplateIssues(wordpressTemplate);
    expect(errors.length).toBe(0);
});

test("validates a valid template with errors", () => {
    const errors = getTemplateIssues(errorWordpressTemplate);
    console.log(errors)
    expect(errors.length).toBe(2);
});
