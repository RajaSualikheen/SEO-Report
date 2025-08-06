import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Zap } from 'lucide-react';

export const PageSpeedCard = ({ pagespeedData, isExpanded }) => {
    const pageSpeedChartData = pagespeedData?.mobile ? {
        labels: ['FCP', 'LCP', 'CLS', 'TBT', 'SI'],
        datasets: [
            {
                label: 'Mobile',
                data: [
                    pagespeedData.mobile.first_contentful_paint,
                    pagespeedData.mobile.largest_contentful_paint,
                    pagespeedData.mobile.cumulative_layout_shift,
                    pagespeedData.mobile.total_blocking_time,
                    pagespeedData.mobile.speed_index
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
            {
                label: 'Desktop',
                data: [
                    pagespeedData.desktop.first_contentful_paint,
                    pagespeedData.desktop.largest_contentful_paint,
                    pagespeedData.desktop.cumulative_layout_shift,
                    pagespeedData.desktop.total_blocking_time,
                    pagespeedData.desktop.speed_index
                ],
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1,
            },
        ],
    } : null;

    const pageSpeedChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#0F172A' } },
            title: { display: true, text: 'Page Speed Metrics', color: '#0F172A' },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Time (ms) / Score', color: '#0F172A' },
                ticks: { color: '#0F172A' },
            },
            x: {
                ticks: { color: '#0F172A' },
            },
        },
    };

    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                    <div className="flex-1 mb-2 md:mb-0">
                        <p className="text-xs font-medium text-slate-700">Mobile Score</p>
                        <p className={`text-xl font-extrabold ${pagespeedData?.mobile?.performance_score >= 90 ? 'text-green-500' : pagespeedData?.mobile?.performance_score >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                            {pagespeedData?.mobile?.performance_score || 'N/A'}
                        </p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <p className="text-xs font-medium text-slate-700">Desktop Score</p>
                        <p className={`text-xl font-extrabold ${pagespeedData?.desktop?.performance_score >= 90 ? 'text-green-500' : pagespeedData?.desktop?.performance_score >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                            {pagespeedData?.desktop?.performance_score || 'N/A'}
                        </p>
                    </div>
                </div>
                {pageSpeedChartData && (
                    <div className="mt-4 h-64">
                        <Bar data={pageSpeedChartData} options={pageSpeedChartOptions} />
                    </div>
                )}
            </div>
        )
    );
};