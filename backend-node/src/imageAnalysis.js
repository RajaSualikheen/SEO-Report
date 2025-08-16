export const analyzeImages = (soup, visibleText) => {
    const imageAnalysis = {
        total_images: 0,
        content_images: 0,
        decorative_images: 0,
        images_with_alt: 0,
        images_without_alt: 0,
        empty_alt_tags: 0,
        missing_alt_tags: 0,
        alt_ratio: "0%",
        modern_format_count: 0,
        lazy_loaded_count: 0,
        detailed_issues: [],
        recommendations: []
    };

    const allImages = soup('img');
    imageAnalysis.total_images = allImages.length;

    if (imageAnalysis.total_images === 0) {
        imageAnalysis.detailed_issues.push("No images found on the page");
        return imageAnalysis;
    }

    allImages.each((i, el) => {
        const img = soup(el);
        const altText = img.attr('alt');
        const src = img.attr('src') || img.attr('data-src') || 'unknown';
        const filename = src.split('/').pop() || src;
        const isDecorative = img.attr('role') === 'presentation' || img.attr('aria-hidden') === 'true';
        const isModernFormat = /\.(webp|avif)$/i.test(src);
        const isLazyLoaded = img.attr('loading') === 'lazy' || img.attr('decoding') === 'async';

        if (isModernFormat) imageAnalysis.modern_format_count++;
        if (isLazyLoaded) imageAnalysis.lazy_loaded_count++;

        if (isDecorative) {
            imageAnalysis.decorative_images++;
            if (altText !== '' && altText !== undefined) {
                imageAnalysis.detailed_issues.push(`Unnecessary alt text on decorative image: ${filename}`);
                imageAnalysis.recommendations.push(`Use alt="" for decorative image: ${filename}`);
            }
        } else {
            imageAnalysis.content_images++;
            if (altText === undefined) {
                imageAnalysis.missing_alt_tags++;
                imageAnalysis.detailed_issues.push(`Missing alt attribute on content image: ${filename}`);
                imageAnalysis.recommendations.push(`Add descriptive alt text for content image: ${filename}`);
            } else if (altText.trim() === '') {
                imageAnalysis.empty_alt_tags++;
                imageAnalysis.detailed_issues.push(`Empty alt attribute on content image: ${filename}`);
                imageAnalysis.recommendations.push(`Add descriptive alt text for content image: ${filename}`);
            } else {
                imageAnalysis.images_with_alt++;
                const altLength = altText.length;
                if (altLength < 10 || altLength > 80) {
                    imageAnalysis.detailed_issues.push(`Suboptimal alt text length (${altLength} chars) on content image: ${filename}`);
                    imageAnalysis.recommendations.push(`Optimize alt text length (10–80 chars) for content image: ${filename}`);
                }
                const keywords = visibleText.toLowerCase().match(/\b\w+\b/g) || [];
                const altWords = altText.toLowerCase().match(/\b\w+\b/g) || [];
                const hasRelevantWords = altWords.some(word => keywords.includes(word) && word.length > 3);
                if (!hasRelevantWords) {
                    imageAnalysis.detailed_issues.push(`Alt text may lack relevance to page content: ${filename}`);
                    imageAnalysis.recommendations.push(`Ensure alt text includes relevant keywords for: ${filename}`);
                }
            }
        }
    });

    imageAnalysis.images_without_alt = imageAnalysis.missing_alt_tags + imageAnalysis.empty_alt_tags;
    imageAnalysis.alt_ratio = imageAnalysis.content_images > 0
        ? `${Math.round((imageAnalysis.images_with_alt / imageAnalysis.content_images) * 100)}%`
        : "0%";
    if (imageAnalysis.modern_format_count / imageAnalysis.total_images < 0.5) {
        imageAnalysis.recommendations.push("Consider using modern image formats (WebP, AVIF) for better performance");
    }
    if (imageAnalysis.lazy_loaded_count / imageAnalysis.total_images < 0.7) {
        imageAnalysis.recommendations.push("Consider adding loading='lazy' to more images for faster page loads");
    }

    return imageAnalysis;
};