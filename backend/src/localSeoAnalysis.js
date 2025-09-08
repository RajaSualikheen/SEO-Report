import logger from "./logger.js";

/**
 * Safely parse JSON-LD block
 */
const safeJsonParse = (content) => {
    try {
        return JSON.parse(content);
    } catch (e) {
        logger.warn(`Invalid JSON-LD during Local SEO audit: ${e.message}`);
        return null;
    }
};

/**
 * Detect address in visible text
 */
const detectAddress = (text) => {
    const patterns = [
        /\d{1,5}\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Place|Pl|Court|Ct|Circle|Cir)/i,
        /\d{5}(-\d{4})?/ // ZIP code
    ];
    return patterns.some((p) => p.test(text));
};

/**
 * Detect phone number in visible text
 */
const detectPhone = (text) => {
    const phonePattern = /(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;
    return phonePattern.test(text);
};

/**
 * Local SEO Audit
 */
export const auditLocalSeo = (soup, visibleText) => {
    const result = {
        local_business_schema_found: false,
        organization_schema_found: false,
        schema_types_found: [],
        physical_address_found: false,
        phone_number_found: false,
        geo_coordinates_found: false,
        maps_embed_found: false,
        status: "❌ Missing",
        issues: []
    };

    // === 1. Scan JSON-LD Schema ===
    soup('script[type="application/ld+json"]').each((_, el) => {
        const content = soup(el).html();
        if (!content) return;

        const parsed = safeJsonParse(content);
        if (!parsed) return;

        const schemas = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of schemas) {
            if (!item?.["@type"]) continue;

            const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
            for (const t of types) {
                result.schema_types_found.push(t);
                if (t.includes("LocalBusiness")) result.local_business_schema_found = true;
                if (t.includes("Organization") && !t.includes("LocalBusiness")) result.organization_schema_found = true;
            }

            if (result.local_business_schema_found || result.organization_schema_found) {
                if (item.address?.streetAddress) {
                    result.physical_address_found = true;
                    if (!detectAddress(visibleText)) {
                        result.issues.push("⚠️ Schema has address, but page text does not clearly show it.");
                    }
                }
                if (item.telephone) {
                    result.phone_number_found = true;
                    if (!detectPhone(visibleText)) {
                        result.issues.push("⚠️ Schema has phone, but page text does not clearly show it.");
                    }
                }
                if (item.geo) {
                    result.geo_coordinates_found = true;
                }
            }
        }
    });

    // === 2. Fallback: Detect address & phone in visible text ===
    if (!result.physical_address_found && detectAddress(visibleText)) {
        result.physical_address_found = true;
    }
    if (!result.phone_number_found && detectPhone(visibleText)) {
        result.phone_number_found = true;
    }

    // === 3. Check for Google Maps embed ===
    if (soup('iframe[src*="google.com/maps"], a[href*="google.com/maps"]').length) {
        result.maps_embed_found = true;
        result.issues.push("ℹ️ Google Maps embed/link found (Good for local visibility).");
    } else {
        result.issues.push("⚠️ Consider embedding a Google Map for better local context.");
    }

    // === 4. Final status ===
    if (result.local_business_schema_found && result.physical_address_found && result.phone_number_found) {
        result.status = "✅ Present";
    } else if (
        result.local_business_schema_found ||
        result.organization_schema_found ||
        result.physical_address_found ||
        result.phone_number_found
    ) {
        result.status = "⚠️ Partial";
        if (!result.local_business_schema_found && !result.organization_schema_found) {
            result.issues.push("⚠️ Missing LocalBusiness or Organization schema markup.");
        }
        if (!result.physical_address_found) {
            result.issues.push("⚠️ No physical address found in schema or page text.");
        }
        if (!result.phone_number_found) {
            result.issues.push("⚠️ No phone number found in schema or page text.");
        }
    } else {
        result.status = "❌ Missing";
        result.issues.push("❌ No key local SEO elements detected (schema, address, phone).");
    }

    return result;
};
