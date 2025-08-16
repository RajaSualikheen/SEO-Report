import logger from './logger.js';

export const auditLocalSeo = (soup, visibleText) => {
    const localSeoResult = {
        local_business_schema_found: false,
        organization_schema_found: false,
        schema_types_found: [],
        physical_address_found: false,
        phone_number_found: false,
        geo_coordinates_found: false,
        Maps_embed_found: false,
        status: "❌ Missing",
        issues: []
    };

    const ldJsonScripts = soup('script[type="application/ld+json"]');
    ldJsonScripts.each((i, el) => {
        const scriptContent = soup(el).html();
        if (scriptContent) {
            try {
                const json_data = JSON.parse(scriptContent);
                const schemasToCheck = Array.isArray(json_data) ? json_data : [json_data];

                for (const item of schemasToCheck) {
                    if (item && item['@type']) {
                        const schemaType = item['@type'];
                        const types = Array.isArray(schemaType) ? schemaType : [schemaType];
                        for (const s_t of types) {
                            localSeoResult.schema_types_found.push(s_t);
                            if (s_t.includes('LocalBusiness')) {
                                localSeoResult.local_business_schema_found = true;
                            }
                            if (s_t.includes('Organization') && !s_t.includes('LocalBusiness')) {
                                localSeoResult.organization_schema_found = true;
                            }
                        }
                        
                        if (localSeoResult.local_business_schema_found || localSeoResult.organization_schema_found) {
                            if (item.address && item.address.streetAddress) {
                                localSeoResult.physical_address_found = true;
                                if (!visibleText.match(/\d{5}(-\d{4})?|\w+\s+\w+\s+(St|Ave|Rd)/i)) {
                                    localSeoResult.issues.push("⚠️ LocalBusiness schema has address, but text on page is less clear.");
                                }
                            }
                            if (item.telephone) {
                                localSeoResult.phone_number_found = true;
                                if (!visibleText.match(/(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/)) {
                                    localSeoResult.issues.push("⚠️ LocalBusiness schema has phone, but text on page is less clear.");
                                }
                            }
                            if (item.geo) {
                                localSeoResult.geo_coordinates_found = true;
                            }
                        }
                    }
                }
            } catch (e) {
                logger.warn(`Invalid JSON-LD during Local SEO audit: ${e}`);
            }
        }
    });

    const addressPatterns = [
        /\d{1,5}\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Place|Pl|Court|Ct|Circle|Cir)/i,
        /\d{5}(-\d{4})?/
    ];
    if (!localSeoResult.physical_address_found) {
        for (const pattern of addressPatterns) {
            if (visibleText.match(pattern)) {
                localSeoResult.physical_address_found = true;
                break;
            }
        }
    }

    const phonePattern = /(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;
    if (!localSeoResult.phone_number_found && visibleText.match(phonePattern)) {
        localSeoResult.phone_number_found = true;
    }

    if (soup('iframe[src*="googleusercontent.com/maps"], a[href*="googleusercontent.com/maps"]').length) {
        localSeoResult.Maps_embed_found = true;
    }

    if (localSeoResult.local_business_schema_found && localSeoResult.physical_address_found && localSeoResult.phone_number_found) {
        localSeoResult.status = "✅ Present";
    } else if (localSeoResult.physical_address_found || localSeoResult.phone_number_found || localSeoResult.local_business_schema_found || localSeoResult.organization_schema_found) {
        localSeoResult.status = "⚠️ Partial";
        if (!localSeoResult.local_business_schema_found && !localSeoResult.organization_schema_found) {
            localSeoResult.issues.push("⚠️ Consider adding LocalBusiness or Organization Schema.org markup.");
        }
        if (!localSeoResult.physical_address_found) {
            localSeoResult.issues.push("⚠️ Physical address not clearly found on the page text or in schema.");
        }
        if (!localSeoResult.phone_number_found) {
            localSeoResult.issues.push("⚠️ Phone number not clearly found on the page text or in schema.");
        }
    } else {
        localSeoResult.status = "❌ Missing";
        localSeoResult.issues.push("❌ No key local SEO elements (schema, address, phone) detected.");
    }
    
    if (localSeoResult.Maps_embed_found) {
        localSeoResult.issues.push("ℹ️ Google Maps embed/link found (Good for local visibility).");
    } else {
        localSeoResult.issues.push("⚠️ Consider embedding a Google Map for better local context.");
    }

    return localSeoResult;
};