import React from 'react';
import {
    FileText, AlignLeft, Layers, BarChart2, BookOpen, Lightbulb, Zap, Link2,
    CodeIcon, MapPin, Rss, Smartphone, Shield, FileSearch, RepeatIcon, Globe, Info
} from 'lucide-react';

export const CardTitleIcon = ({ title }) => {
    const getCardTitleIcon = (cardTitle) => {
        switch (cardTitle) {
            case 'Title Optimization': return <FileText className="w-5 h-5 text-indigo-500" />;
            case 'Meta Description': return <AlignLeft className="w-5 h-5 text-indigo-500" />;
            case 'Content Structure': return <Layers className="w-5 h-5 text-indigo-500" />;
            case 'Keyword Analysis': return <BarChart2 className="w-5 h-5 text-indigo-500" />;
            case 'Content Quality Analysis': return <BookOpen className="w-5 h-5 text-indigo-500" />;
            case 'Image Accessibility': return <Lightbulb className="w-5 h-5 text-green-500" />;
            case 'Page Speed & Core Web Vitals': return <Zap className="w-5 h-5 text-blue-500" />;
            case 'Link Profile': return <Link2 className="w-5 h-5 text-green-500" />;
            case 'Structured Data Schema': return <CodeIcon className="w-5 h-5 text-green-500" />;
            case 'Local SEO': return <MapPin className="w-5 h-5 text-green-500" />;
            case 'Mobile Experience': return <Smartphone className="w-5 h-5 text-yellow-500" />;
            case 'Social Media Integration': return <Rss className="w-5 h-5 text-yellow-500" />;
            case 'HTTPS Usage': return <Shield className="w-5 h-5 text-red-500" />;
            case 'Robots.txt Analysis': return <FileSearch className="w-5 h-5 text-purple-500" />;
            case 'Meta Robots Tag': return <Layers className="w-5 h-5 text-purple-500" />;
            case 'HTTP Status & Redirects': return <RepeatIcon className="w-5 h-5 text-purple-500" />;
            case 'Sitemap Validation': return <Globe className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    return (
        <span className="p-2 rounded-full">
            {getCardTitleIcon(title)}
        </span>
    );
};