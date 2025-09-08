/* eslint-disable no-irregular-whitespace */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
// FIX: Import the useTheme hook
import { useTheme } from '../contexts/ThemeContext';

const CrawlGraph = ({ nodes, links, orphanPages }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [tooltipContent, setTooltipContent] = useState(null);
    const [graphInitialized, setGraphInitialized] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // FIX: Get the dark mode state from the global context
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // FIX: Add isDarkMode to the dependency array to trigger a re-render on theme change
    useEffect(() => {
        const nodeIds = new Set(nodes?.map(node => node.id) || []);
        const validLinks = links?.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target)) || [];

        if (!dimensions.width || !nodes?.length || !validLinks.length) return;
        
        // This logic is slightly adjusted to allow re-initialization on theme change
        // setGraphInitialized(true); 

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const { width, height } = dimensions;
        const g = svg.append('g');

        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(validLinks).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide(30));

        // FIX: Define theme-aware colors
        const linkColor = isDarkMode ? '#4A5568' : '#999'; // gray-600 dark
        const nodeStrokeColor = isDarkMode ? '#1a202c' : '#fff'; // gray-900 dark background
        const labelColor = isDarkMode ? '#A0AEC0' : '#000'; // gray-400 dark

        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(validLinks)
            .enter().append('line')
            .attr('stroke', linkColor) // Use dynamic color
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1);

        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', d => d.depth === -1 ? 15 : 10)
            .attr('fill', d => d.depth === -1 ? 'red' : '#3b82f6')
            .attr('stroke', nodeStrokeColor) // Use dynamic color
            .attr('stroke-width', 2)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        const labels = g.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .text(d => d.depth === -1 ? 'Orphan' : `Depth: ${d.depth}`)
            .attr('font-size', '10px')
            .attr('fill', labelColor) // Use dynamic color
            .attr('pointer-events', 'none')
            .attr('dx', 12)
            .attr('dy', '.35em');

        node.on('mouseover', (event, d) => {
            setTooltipContent(
                <div className="absolute bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200" style={{ left: event.pageX + 10, top: event.pageY + 10 }}>
                    <p className="font-bold">{d.label}</p>
                    <p>URL: {d.id}</p>
                    <p>Depth: {d.depth === -1 ? 'Orphan' : d.depth}</p>
                </div>
            );
        }).on('mouseout', () => {
            setTooltipContent(null);
        });

        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            node.attr('cx', d => d.x).attr('cy', d => d.y);
            labels.attr('x', d => d.x).attr('y', d => d.y);
        });

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
    }, [nodes, links, dimensions, isDarkMode]); // <-- Added isDarkMode

    return (
        <div ref={containerRef} className="relative w-full h-full border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden">
            {nodes?.length > 0 ? (
                <svg ref={svgRef} className="w-full h-full"></svg>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">No crawl data to display.</p>
                </div>
            )}
            {tooltipContent}
            {nodes?.length > 0 && (
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-2">Legend</h4>
                    <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-[#3b82f6] rounded-full"></span>
                        <span>Crawled Page</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                        <span>Orphan Page</span>
                    </div>
                </div>
            )}
            {orphanPages?.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-red-50 dark:bg-red-900/30 p-4 rounded-lg shadow-md border border-red-200 dark:border-red-900 max-w-sm max-h-48 overflow-y-auto">
                    <h4 className="font-bold text-red-700 dark:text-red-300">Orphan Pages ({orphanPages.length})</h4>
                    <ul className="mt-2 text-xs space-y-1">
                        {orphanPages.map((url, i) => (
                            <li key={i} className="text-red-600 dark:text-red-400 truncate">{url}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CrawlGraph;