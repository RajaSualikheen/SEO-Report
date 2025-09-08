import React from 'react';
import axios from 'axios';

// LaTeX template (same as provided earlier)
const latexTemplate = `
% Setting up document class and basic packages
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{colortbl}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{tocloft}
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\usepackage{titling}
\\usepackage{datetime}
\\geometry{left=2cm,right=2cm,top=2.5cm,bottom=2.5cm}
\\definecolor{primary}{RGB}{79,70,229}
\\definecolor{accent}{RGB}{59,130,246}
\\definecolor{good}{RGB}{34,197,94}
\\definecolor{warn}{RGB}{249,115,22}
\\definecolor{bad}{RGB}{239,68,68}
\\definecolor{lightgray}{RGB}{245,245,245}
\\definecolor{gray}{RGB}{100,100,100}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot[C]{\\small Page \\thepage\\ of \\pageref{LastPage}}
\\fancyfoot[R]{\\small \\thetitle}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\cftsecleader}{\\cftdotfill{\\cftdotsep}}
\\setlength{\\cftbeforesecskip}{0.5em}
\\setlength{\\cftaftertoctitle}{\\vspace{0.5cm}}
\\newcommand{\\sectiontitle}[1]{\\section*{\\color{primary}\\textbf{#1}}\\addcontentsline{toc}{section}{#1}}
\\newcommand{\\statusgood}[1]{\\textcolor{good}{\\textbf{✅ #1}}}
\\newcommand{\\statuswarn}[1]{\\textcolor{warn}{\\textbf{⚠️ #1}}}
\\newcommand{\\statusbad}[1]{\\textcolor{bad}{\\textbf{❌ #1}}}
\\usepackage{noto}
\\begin{document}
\\begin{titlepage}
    \\centering
    \\vspace*{2cm}
    \\ifdefined\\agencyLogoPreview
        \\includegraphics[width=0.3\\textwidth]{\\agencyLogoPreview}
    \\else
        \\includegraphics[width=0.3\\textwidth]{example-image}
    \\fi
    \\vspace{1cm}
    \\ifdefined\\agencyName
        {\\Large \\textbf{\\agencyName}} \\\\
    \\else
        {\\Large \\textbf{Your SEO Agency}} \\\\
    \\fi
    \\vspace{0.5cm}
    {\\Huge \\color{primary} Premium SEO Audit Report} \\\\
    \\vspace{0.5cm}
    {\\large \\color{gray} Report for: \\reportUrl} \\\\
    \\vspace{0.5cm}
    {\\normalsize \\color{gray} Generated on: \\today} \\\\
    \\vspace{2cm}
    {\\normalsize \\color{gray} Powered by \\href{https://x.ai}{xAI}} \\\\
\\end{titlepage}
\\tableofcontents
\\thispagestyle{empty}
\\newpage
\\sectiontitle{Overall Score}
\\begin{tabular}{|l|c|}
    \\hline
    \\rowcolor{lightgray} \\textbf{Metric} & \\textbf{Value} \\\\
    \\hline
    Total Score & \\overallScore \\\\
    \\hline
\\end{tabular}
\\vspace{0.5cm}
\\textbf{Category Performance Overview} \\\\
\\begin{tabular}{|l|c|c|}
    \\hline
    \\rowcolor{lightgray} \\textbf{Category} & \\textbf{Score} & \\textbf{Status} \\\\
    \\hline
    {{categoryRows}}
\\end{tabular}
\\sectiontitle{On-Page Content}
\\subsection*{Title Tag}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{Content:} \\titleContent
    \\item \\textbf{Char Count:} \\titleCharCount
    \\item \\textbf{Status:} \\titlestatus
    \\item \\textbf{Recommendation:} \\titleRecommendation
\\end{itemize}
\\subsection*{Meta Description}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{Content:} \\metaDescriptionContent
    \\item \\textbf{Char Count:} \\metaDescriptionCharCount
    \\item \\textbf{Status:} \\metaDescriptionStatus
    \\item \\textbf{Recommendation:} \\metaDescriptionRecommendation
\\end{itemize}
\\subsection*{Heading Structure}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{H1 Count:} \\h1Count
    \\item \\textbf{H1 Text:} \\h1Text
    \\ifdefined\\headingIssues
        \\item \\statuswarn{Issues: \\headingIssues}
    \\fi
\\end{itemize}
\\ifdefined\\targetKeyword
\\sectiontitle{Keyword Analysis}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{Target Keyword:} \\targetKeyword
    \\item \\textbf{Keyword Density:} \\keywordDensity\\%
    \\item \\textbf{Presence in Title:} \\inTitle
    \\item \\textbf{Presence in H1:} \\inH1
    \\item \\textbf{Presence in URL:} \\inUrl
    \\item \\textbf{Presence in Content:} \\inContent
\\end{itemize}
\\fi
\\sectiontitle{Technical Audit}
\\subsection*{Canonical Tag}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{Status:} \\canonicalStatus
    \\ifdefined\\canonicalUrl
        \\item \\textbf{URL:} \\canonicalUrl
    \\fi
\\end{itemize}
\\subsection*{Image Alt Tags}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{Total Images:} \\totalImages
    \\item \\textbf{Missing Alt Tags:} \\missingAltCount
    \\item \\textbf{Empty Alt Tags:} \\emptyAltCount
\\end{itemize}
\\subsection*{Structured Data}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{JSON-LD Found:} \\ldJsonFound
    \\ifdefined\\schemaTypes
        \\item \\textbf{Schema Types:} \\schemaTypes
    \\fi
\\end{itemize}
\\ifdefined\\ogTitle
\\sectiontitle{Social Media Integration}
\\textbf{Social Preview} \\\\
\\begin{tabular}{|p{0.95\\textwidth}|}
    \\hline
    \\rowcolor{lightgray} \\includegraphics[width=0.95\\textwidth]{\\ogImage} \\\\
    \\hline
    \\textbf{Title:} \\ogTitle \\\\
    \\textbf{Description:} \\ogDescription \\\\
    \\hline
\\end{tabular}
\\ifdefined\\socialIssues
    \\vspace{0.5cm}
    \\statuswarn{Issues:}
    \\begin{itemize}[leftmargin=1cm]
        {{socialIssues}}
    \\end{itemize}
\\fi
\\fi
\\ifdefined\\hasViewportMeta
\\sectiontitle{Mobile-Friendliness}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{Viewport Meta:} \\hasViewportMeta
    \\item \\textbf{Fixed-Width Elements:} \\fixedWidthElements
    \\ifdefined\\mobileIssues
        \\item \\statuswarn{Issues: \\mobileIssues}
    \\fi
\\end{itemize}
\\fi
\\ifdefined\\crawlAudit
\\sectiontitle{Crawl Depth \\& Internal Linking}
\\begin{itemize}[leftmargin=1cm]
    \\item \\textbf{Total Pages Crawled:} \\totalPagesCrawled
    \\item \\textbf{Orphan Pages:} \\orphanPages
    \\item \\textbf{Max Crawl Depth:} \\maxCrawlDepth
\\end{itemize}
\\fi
\\end{document}
`;

const PDFReport = ({ reportData, agencyName, agencyLogoPreview }) => {
  const backendData = reportData.backendData;

  // Map reportData to LaTeX variables
  const latexData = {
    agencyName: agencyName || 'Your SEO Agency',
    agencyLogoPreview: agencyLogoPreview || 'example-image',
    reportUrl: reportData.url || 'N/A',
    overallScore: reportData.overallScore || 'N/A',
    categoryRows: Object.entries(reportData.groupedSections || {})
      .map(([categoryName, sections]) => {
        const scoreData = { score: sections.filter(s => s.status === 'good').length, max: sections.length };
        const percentage = (scoreData.score / scoreData.max) * 100 || 0;
        const status = percentage >= 80 ? '\\statusgood{Good}' : percentage >= 60 ? '\\statuswarn{Needs Improvement}' : '\\statusbad{Critical}';
        return `\\textbf{${categoryName}} & ${scoreData.score}/${scoreData.max} & ${status} \\\\`;
      })
      .join('\n'),
    titleContent: backendData.metadata_length_audit?.title?.text || 'Missing',
    titleCharCount: backendData.metadata_length_audit?.title?.char_count || 'N/A',
    titlestatus:
      backendData.metadata_length_audit?.title?.status?.toLowerCase() === 'good'
        ? '\\statusgood{Good}'
        : backendData.metadata_length_audit?.title?.status?.toLowerCase() === 'warning'
        ? '\\statuswarn{Needs Fix}'
        : '\\statusbad{Critical}',
    titleRecommendation: backendData.metadata_length_audit?.title?.recommendation || 'N/A',
    metaDescriptionContent: backendData.metadata_length_audit?.meta_description?.text || 'Missing',
    metaDescriptionCharCount: backendData.metadata_length_audit?.meta_description?.char_count || 'N/A',
    metaDescriptionStatus:
      backendData.metadata_length_audit?.meta_description?.status?.toLowerCase() === 'good'
        ? '\\statusgood{Good}'
        : backendData.metadata_length_audit?.meta_description?.status?.toLowerCase() === 'warning'
        ? '\\statuswarn{Needs Fix}'
        : '\\statusbad{Critical}',
    metaDescriptionRecommendation: backendData.metadata_length_audit?.meta_description?.recommendation || 'N/A',
    h1Count: backendData.h1_tags?.length || 'N/A',
    h1Text: backendData.h1_tags?.join(', ') || 'N/A',
    headingIssues: backendData.heading_issues?.join('; ') || null,
    targetKeyword: backendData.content_analysis?.keyword_report?.target_keyword || null,
    keywordDensity: backendData.content_analysis?.keyword_report?.density?.density || 'N/A',
    inTitle: backendData.content_analysis?.keyword_report?.presence?.inTitle ? 'Yes' : 'No',
    inH1: backendData.content_analysis?.keyword_report?.presence?.inH1 ? 'Yes' : 'No',
    inUrl: backendData.content_analysis?.keyword_report?.presence?.inUrl ? 'Yes' : 'No',
    inContent: backendData.content_analysis?.keyword_report?.presence?.inContent ? 'Yes' : 'No',
    canonicalStatus: backendData.canonical_tag?.status || 'N/A',
    canonicalUrl: backendData.canonical_tag?.url || null,
    totalImages: backendData.alt_image_tags?.totalImages || 'N/A',
    missingAltCount: backendData.alt_image_tags?.missingAltCount || 'N/A',
    emptyAltCount: backendData.alt_image_tags?.emptyAltCount || 'N/A',
    ldJsonFound: backendData.structured_data_audit?.ld_json_found ? 'Yes' : 'No',
    schemaTypes: backendData.structured_data_audit?.schema_types?.join(', ') || null,
    ogImage: backendData.og_twitter_audit?.og_image_url || backendData.og_twitter_audit?.twitter_image_url || 'example-image',
    ogTitle: backendData.og_twitter_audit?.og_title_content || backendData.og_twitter_audit?.twitter_title_content || 'No Title Provided',
    ogDescription: backendData.og_twitter_audit?.og_description || backendData.og_twitter_audit?.twitter_description || 'No description provided.',
    socialIssues: backendData.og_twitter_audit?.issues?.map(issue => `\\item ${issue}`).join('\n') || null,
    hasViewportMeta: backendData.mobile_responsiveness_audit?.has_viewport_meta ? 'Yes' : 'No',
    fixedWidthElements: backendData.mobile_responsiveness_audit?.fixed_width_elements?.length || '0',
    mobileIssues: backendData.mobile_responsiveness_audit?.issues?.join('; ') || null,
    crawlAudit: backendData.crawl_audit ? 'true' : null,
    totalPagesCrawled: backendData.crawl_audit?.nodes?.length || 'N/A',
    orphanPages: backendData.crawl_audit?.orphan_pages?.length || '0',
    maxCrawlDepth: backendData.crawl_audit?.max_depth || 'N/A',
  };

  // Generate LaTeX content by replacing placeholders
  let latexContent = latexTemplate;
  Object.keys(latexData).forEach(key => {
    if (latexData[key] !== null) {
      latexContent = latexContent.replace(`{{${key}}}`, latexData[key]);
      latexContent = latexContent.replace(`\\${key}`, latexData[key]);
    } else {
      latexContent = latexContent.replace(`\\ifdefined\\${key}\n`, '');
      latexContent = latexContent.replace(`\\fi`, '');
    }
  });

  // Function to trigger PDF download
  const handleDownload = async () => {
    try {
      const response = await axios.post(
        '/generate-pdf',
        { latex: latexContent },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'seo_report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Download SEO Report
      </button>
    </div>
  );
};

export default PDFReport;
