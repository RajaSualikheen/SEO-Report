/**
 * Analyze structured data (JSON-LD) for SEO & rich results
 */
export const analyzeStructuredData = async (soup, siteUrl) => {
    const result = {
        ld_json_found: false,
        schema_types: [],
        valid_schemas: [],
        invalid_schemas: [],
        issues: [],
        recommendations: []
    };

    const ldJsonScripts = soup('script[type="application/ld+json"]');
    if (!ldJsonScripts.length) {
        result.issues.push("No JSON-LD structured data found");
        result.recommendations.push("Add JSON-LD for rich snippets (e.g., Article, WebPage)");
        return result;
    }

    result.ld_json_found = true;

    // ✅ Schema property requirements (extendable)
    const schemaRequirements = {
        Article: ["headline", "datePublished", "author"],
        WebPage: ["name", "url"],
        LocalBusiness: ["name", "address", "telephone"],
        Organization: ["name", "url"]
    };

    /**
     * ✅ Safely parse JSON-LD content
     */
    const parseJsonLd = (content) => {
        try {
            const jsonData = JSON.parse(content);
            return Array.isArray(jsonData) ? jsonData : [jsonData];
        } catch (err) {
            result.issues.push(`Invalid JSON-LD syntax: ${err.message}`);
            result.recommendations.push("Fix JSON-LD syntax errors");
            return [];
        }
    };

    /**
     * ✅ Validate schema against required props
     */
    const validateSchema = (schema) => {
        const type = Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]];
        const mainType = type[0];
        const requiredProps = schemaRequirements[mainType] || [];
        const missingProps = requiredProps.filter((prop) => {
            const val = schema[prop];
            return (
                !val ||
                (Array.isArray(val) && val.length === 0) ||
                (typeof val === "string" && val.trim() === "")
            );
        });

        return {
            type: type.join(","),
            content: schema,
            valid: missingProps.length === 0,
            missing: missingProps
        };
    };

    /**
     * ✅ Collect schemas from page
     */
    const schemas = [];
    ldJsonScripts.each((_, el) => {
        const items = parseJsonLd(soup(el).html());
        for (const item of items) {
            if (item && item["@type"]) {
                schemas.push(item);
                result.schema_types.push(
                    ...(Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]])
                );
            } else {
                result.issues.push("Invalid JSON-LD: missing @type");
                result.recommendations.push("Ensure all JSON-LD objects have an @type property");
            }
        }
    });

    /**
     * ✅ Validate all schemas
     */
    const validations = schemas.map(validateSchema);
    validations.forEach((schema) => {
        if (schema.valid) {
            result.valid_schemas.push(schema);
        } else {
            result.invalid_schemas.push({ type: schema.type, missing: schema.missing });
            result.issues.push(
                `Invalid ${schema.type} schema: missing required properties (${schema.missing.join(", ")})`
            );
            result.recommendations.push(
                `Add missing properties (${schema.missing.join(", ")}) to ${schema.type} schema`
            );
        }
    });

    // ✅ Final recommendation if all schemas invalid
    if (!result.valid_schemas.length && result.ld_json_found) {
        result.recommendations.push("Ensure at least one valid schema (e.g., Article, WebPage) for rich snippets");
    }

    return result;
};
