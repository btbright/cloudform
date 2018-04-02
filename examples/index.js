const fs = require("fs");
const cloudform = require("../dist");

fs.readFile("./example1.json", "utf8", (err, data) => {
    console.log(cloudform.getTemplateIssues(JSON.parse(data)));
})