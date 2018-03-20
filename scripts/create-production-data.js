import fs from "fs"

fs.readFile("./data/CloudformationResourceSpecification.json", "utf8", (err, data) => {
    const parsedSpec = JSON.parse(data);
    const ret = {
        p: cleanSpecCollection(parsedSpec.PropertyTypes),
        r: cleanSpecCollection(parsedSpec.ResourceTypes)
    };
    console.log(JSON.stringify(ret, null, 4))
})

function cleanSpecCollection(specCollection){
    return Object.keys(specCollection).reduce((collection, specItemKey) => {
        const specItem = specCollection[specItemKey];
        const ret = {};
        if (specItem.hasOwnProperty("Properties")){
            ret.p = cleanSpecSection(specItem.Properties);
        }
        if (specItem.hasOwnProperty("Attributes")){
            ret.a = cleanSpecSection(specItem.Attributes);
        }
        collection[specItemKey] = ret;
        return collection
    }, {});
}

function cleanSpecSection(specSection){
    return Object.keys(specSection).reduce((ret, sectionItemKey) => {
        const sectionItem = specSection[sectionItemKey];
        ret[sectionItemKey] = Object.keys(sectionItem).reduce((attributes, sectionAttributeKey) => {
            const finalKey = mapAttributeKeyToFinalKey(sectionAttributeKey);
            if (!finalKey) return attributes; //not data we care about
            attributes[finalKey] = sectionItem[sectionAttributeKey];
            return attributes;
        }, {})
        return ret;
    }, {})
}

const finalAttributeKeys = {
    "Required": "req",
    "DuplicatesAllowed": "da",
    "Type": "t",
    "PrimitiveType": "pt",
    "ItemType": "it",
    "PrimitiveItemType": "pit"
}

function mapAttributeKeyToFinalKey(attributeKey){
    return finalAttributeKeys[attributeKey];
}