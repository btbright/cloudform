import { getTemplateIssues } from "../src/";
import wordpressTemplate from "./templates/wordpress.json"

test("validates a valid template without errors", () => {
    const errors = getTemplateIssues(wordpressTemplate);
    expect(errors.length).toBe(0);
});
