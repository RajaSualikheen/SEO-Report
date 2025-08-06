import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
    let statusIcon, statusText, badgeColorClass;
    switch (status) {
        case 'good':
            statusIcon = <CheckCircle className="w-8 h-8 text-green-500" />;
            statusText = 'Good';
            badgeColorClass = 'bg-green-500';
            break;
        case 'warning':
            statusIcon = <AlertTriangle className="w-8 h-8 text-orange-500" />;
            statusText = 'Needs Fix';
            badgeColorClass = 'bg-orange-500';
            break;
        case 'bad':
            statusIcon = <AlertTriangle className="w-8 h-8 text-red-500" />;
            statusText = 'Critical Issue';
            badgeColorClass = 'bg-red-500';
            break;
        default:
            statusIcon = null;
            statusText = 'N/A';
            badgeColorClass = 'bg-slate-500';
    }

    return (
        <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full text-white ${badgeColorClass}`}>
            {statusText}
        </span>
    );
};