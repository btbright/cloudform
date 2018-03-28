import { getTemplateIssues } from "../src/";
import wordpressTemplate from "./templates/wordpress.json"

test("validates a valid template without errors", () => {
    expect(getTemplateIssues(wordpressTemplate).length).toBe(0);
});
