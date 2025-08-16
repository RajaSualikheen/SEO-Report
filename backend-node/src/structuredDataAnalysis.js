export const analyzeStructuredData = async (soup, siteUrl) => {
    const structuredDataAuditResult = {
        ld_json_found: false,
        schema_types: [],
        valid_schemas: [],
        invalid_schemas: [],
        issues: [],
        recommendations: []
    };

    const ldJsonScripts = soup('script[type="application/ld+json"]');
    if (!ldJsonScripts.length) {
        structuredDataAuditResult.issues.push("No JSON-LD structured data found");
        structuredDataAuditResult.recommendations.push("Add JSON-LD for rich snippets (e.g., Article, WebPage)");
        return structuredDataAuditResult;
    }

    structuredDataAuditResult.ld_json_found = true;
    const schemaRequirements = {
        Article: ['headline', 'datePublished', 'author'],
        WebPage: ['name', 'url'],
        LocalBusiness: ['name', 'address', 'telephone'],
        Organization: ['name', 'url']
    };

    const schemasToValidate = [];
    ldJsonScripts.each((i, el) => {
        const scriptContent = soup(el).html();
        try {
            const jsonData = JSON.parse(scriptContent);
            const items = Array.isArray(jsonData) ? jsonData : [jsonData];
            for (const item of items) {
                if (item && item['@type']) {
                    const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
                    structuredDataAuditResult.schema_types.push(...types);
                    schemasToValidate.push({ type: types.join(','), content: item });
                } else {
                    structuredDataAuditResult.issues.push("Invalid JSON-LD: missing @type");
                }
            }
        } catch (e) {
            structuredDataAuditResult.issues.push(`Invalid JSON-LD syntax: ${e.message}`);
            structuredDataAuditResult.recommendations.push("Fix JSON-LD syntax errors");
        }
    });

    const richResultsTest = async (schema) => {
        const type = schema.type.split(',')[0];
        const requiredProps = schemaRequirements[type] || [];
        const missingProps = requiredProps.filter(prop => {
            const propValue = schema.content[prop];
            return !propValue || (Array.isArray(propValue) && propValue.length === 0) || (typeof propValue === 'string' && propValue.trim() === '');
        });
        return { valid: missingProps.length === 0, missing: missingProps };
    };

    const validationPromises = schemasToValidate.map(schema => richResultsTest(schema));
    const validationResults = await Promise.allSettled(validationPromises);

    validationResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.valid) {
            structuredDataAuditResult.valid_schemas.push(schemasToValidate[i]);
        } else {
            const schemaInfo = schemasToValidate[i];
            const missingProps = result.value.missing;
            structuredDataAuditResult.invalid_schemas.push({ type: schemaInfo.type, missing: missingProps });
            structuredDataAuditResult.issues.push(`Invalid ${schemaInfo.type} schema: missing required properties (${missingProps.join(', ')})`);
            structuredDataAuditResult.recommendations.push(`Add missing properties (${missingProps.join(', ')}) to ${schemaInfo.type} schema`);
        }
    });

    if (!structuredDataAuditResult.valid_schemas.length && structuredDataAuditResult.ld_json_found) {
        structuredDataAuditResult.recommendations.push("Ensure at least one valid schema (e.g., Article, WebPage) for rich snippets");
    }

    return structuredDataAuditResult;
};