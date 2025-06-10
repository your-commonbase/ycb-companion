'use client';

import * as d3 from 'd3';
import type { HierarchyPointLink } from 'd3-hierarchy';
import React, { useEffect, useRef, useState } from 'react';

interface TreeNode {
  id: string;
  data: string;
  relationshipType: 'root' | 'parent' | 'comment' | 'neighbor';
  relationshipSource?: string;
  similarity?: number;
  level: number;
  children?: TreeNode[];
}

interface TreeMinimapProps {
  entries: any[];
  onNodeClick: (entryId: string) => void;
}

interface TreeMinimapModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: any[];
  onNodeClick: (entryId: string) => void;
}

const TreeMinimapModal: React.FC<TreeMinimapModalProps> = ({
  isOpen,
  onClose,
  entries,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const buildTreeData = () => {
    if (!entries.length) return null;

    const rootEntry = entries.find(
      (entry) => entry.relationshipType === 'root',
    );
    if (!rootEntry) return null;

    const buildNode = (entry: any, visited = new Set()): TreeNode => {
      if (visited.has(entry.id)) {
        // Prevent infinite loops
        return {
          id: entry.id,
          data: entry.data.slice(0, 50) + (entry.data.length > 50 ? '...' : ''),
          relationshipType: entry.relationshipType,
          relationshipSource: entry.relationshipSource,
          similarity: entry.similarity,
          level: entry.level,
          children: [],
        };
      }

      visited.add(entry.id);
      const children: TreeNode[] = [];

      // Add comment children (these have actual parent-child relationships)
      entries
        .filter(
          (e) =>
            e.relationshipSource === entry.id &&
            e.relationshipType === 'comment',
        )
        .forEach((child) => {
          children.push(buildNode(child, new Set(visited)));
        });

      // For ANY entry, add its neighbors as children
      entries
        .filter(
          (e) =>
            e.relationshipSource === entry.id &&
            e.relationshipType === 'neighbor',
        )
        .forEach((neighbor) => {
          children.push(buildNode(neighbor, new Set(visited)));
        });

      // Add parent entries that reference this entry
      entries
        .filter(
          (e) =>
            e.relationshipSource === entry.id &&
            e.relationshipType === 'parent',
        )
        .forEach((parent) => {
          children.push(buildNode(parent, new Set(visited)));
        });

      return {
        id: entry.id,
        data: entry.data.slice(0, 50) + (entry.data.length > 50 ? '...' : ''),
        relationshipType: entry.relationshipType,
        relationshipSource: entry.relationshipSource,
        similarity: entry.similarity,
        level: entry.level,
        children,
      };
    };

    return buildNode(rootEntry);
  };

  const renderFullTree = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const treeData = buildTreeData();
    if (!treeData) return;

    // Calculate tree dimensions first
    const tempTree = d3.tree<TreeNode>();
    const tempRoot = d3.hierarchy(treeData);
    const tempNodes = tempTree(tempRoot);

    // Find actual bounds of the tree
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    tempNodes.descendants().forEach((d) => {
      minX = Math.min(minX, d.x);
      maxX = Math.max(maxX, d.x);
      minY = Math.min(minY, d.y);
      maxY = Math.max(maxY, d.y);
    });

    // Calculate label dimensions for proper spacing
    const avgCharWidth = 8; // Approximate character width in pixels at 12px font size
    const maxLabelChars = Math.max(
      ...tempNodes.descendants().map((d) => d.data.data.length),
    );
    const estimatedLabelWidth = Math.min(maxLabelChars * avgCharWidth, 200); // Cap at 200px

    // Calculate required dimensions with label-aware spacing
    const padding = 200;
    const nodeRadius = 8;
    const labelBuffer = estimatedLabelWidth + 40; // Extra buffer for label spacing
    const verticalSpacing = 4.0; // Multiplier for vertical spacing between levels
    const horizontalSpacing = Math.max(6.0, estimatedLabelWidth / 30); // Scale horizontal spacing based on label width

    // Apply spacing multipliers to create more room between nodes
    const treeWidth = Math.max(
      (maxY - minY) * horizontalSpacing + labelBuffer + padding * 2,
      1400,
    );
    const treeHeight = Math.max(
      (maxX - minX) * verticalSpacing + padding * 2,
      1000,
    );

    console.log('Tree bounds:', { minX, maxX, minY, maxY });
    console.log('SVG dimensions:', { treeWidth, treeHeight });
    console.log('Node count:', tempNodes.descendants().length);

    // Set SVG dimensions
    svg.attr('width', treeWidth).attr('height', treeHeight);

    // Create the actual tree with proper sizing and label-aware spacing
    const tree = d3
      .tree<TreeNode>()
      .size([treeHeight - padding * 2, treeWidth - labelBuffer - padding * 2])
      .separation((a, b) => {
        // Scale separation based on label width to prevent overlaps
        const baseSeparation = a.parent === b.parent ? 4 : 6;
        const labelScaling = Math.max(1, estimatedLabelWidth / 100);
        return baseSeparation * labelScaling;
      });
    const root = d3.hierarchy(treeData);
    const treeNodes = tree(root);

    const g = svg
      .append('g')
      .attr('transform', `translate(${padding}, ${padding})`);

    // Draw links with more breathing room
    g.selectAll('.link')
      .data(treeNodes.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr(
        'd',
        d3
          .linkHorizontal<HierarchyPointLink<TreeNode>, [number, number]>()
          .x((d) => (d as any).y)
          .y((d) => (d as any).x),
      )
      .attr('fill', 'none')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 1.5);

    // Draw neighbor relationships with similarity percentages
    entries
      .filter((entry) => entry.relationshipType === 'neighbor')
      .forEach((neighbor) => {
        const sourceNode = treeNodes
          .descendants()
          .find((d) => d.data.id === neighbor.relationshipSource);
        const targetNode = treeNodes
          .descendants()
          .find((d) => d.data.id === neighbor.id);

        if (sourceNode && targetNode) {
          g.append('path')
            .attr(
              'd',
              `M${sourceNode.y},${sourceNode.x} L${targetNode.y},${targetNode.x}`,
            )
            .attr('fill', 'none')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '6,6');

          // Add similarity percentage label
          if (neighbor.similarity !== undefined) {
            const midX = (sourceNode.y + targetNode.y) / 2;
            const midY = (sourceNode.x + targetNode.x) / 2;

            g.append('text')
              .attr('x', midX)
              .attr('y', midY - 8)
              .attr('text-anchor', 'middle')
              .attr('fill', '#10b981')
              .attr('font-size', '11px')
              .attr('font-weight', 'bold')
              .text(`${Math.round(neighbor.similarity * 100)}%`);
          }
        }
      });

    // Draw nodes
    const nodes = g
      .selectAll('.node')
      .data(treeNodes.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data.id);
      });

    // Node circles
    nodes
      .append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d) => {
        switch (d.data.relationshipType) {
          case 'root':
            return '#3b82f6';
          case 'parent':
            return '#8b5cf6';
          case 'comment':
            return '#f97316';
          case 'neighbor':
            return '#10b981';
          default:
            return '#6b7280';
        }
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Helper function to trim text with ellipsis
    const trimText = (text: string, maxLength: number) => {
      return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    };

    // Handle labels differently for image vs text nodes
    nodes.each(function (d) {
      const nodeGroup = d3.select(this);
      const isImageNode =
        entries.find((e) => e.id === d.data.id)?.metadata?.type === 'image';
      const imageUrl = imageUrls[d.data.id];

      if (isImageNode && imageUrl) {
        // For image nodes, show thumbnail
        nodeGroup
          .append('image')
          .attr('x', 15)
          .attr('y', -12)
          .attr('width', 24)
          .attr('height', 24)
          .attr('href', imageUrl)
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .style('border-radius', '4px')
          .style('border', '1px solid rgba(255,255,255,0.8)');

        // Optional: Add a subtle background behind image
        nodeGroup
          .insert('rect', 'image')
          .attr('x', 13)
          .attr('y', -14)
          .attr('width', 28)
          .attr('height', 28)
          .attr('fill', 'rgba(255, 255, 255, 0.9)')
          .attr('stroke', 'rgba(200, 200, 200, 0.5)')
          .attr('stroke-width', 1)
          .attr('rx', 6);
      } else {
        // For text nodes, show text label with background
        nodeGroup
          .append('rect')
          .attr('x', 12)
          .attr('y', -6)
          .attr('width', Math.min(d.data.data.length * 8 + 6, 156)) // 6px padding
          .attr('height', 16)
          .attr('fill', 'rgba(255, 255, 255, 0.9)')
          .attr('stroke', 'rgba(255, 255, 255, 0.9)')
          .attr('stroke-width', 1)
          .attr('rx', 2);

        nodeGroup
          .append('text')
          .attr('dx', 15)
          .attr('dy', 4)
          .attr('font-size', '12px')
          .attr('fill', '#374151')
          .attr('font-weight', '500')
          .text(trimText(d.data.data, 18)); // Limit to ~18 characters
      }
    });

    // Background rectangles for ID labels
    nodes
      .append('rect')
      .attr('x', 12)
      .attr('y', -23)
      .attr('width', 70) // Fixed width for IDs
      .attr('height', 14)
      .attr('fill', 'rgba(248, 250, 252, 0.9)')
      .attr('stroke', 'rgba(248, 250, 252, 0.9)')
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Node IDs with background
    nodes
      .append('text')
      .attr('dx', 15)
      .attr('dy', -15)
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')
      .attr('font-weight', '400')
      .text((d) => d.data.id.slice(0, 8));
  };

  // Fetch image URLs for image entries
  useEffect(() => {
    const imageEntries = entries.filter(
      (entry) => entry.metadata?.type === 'image',
    );
    if (imageEntries.length > 0) {
      const fetchImages = async () => {
        const imageIds = imageEntries.map((entry) => entry.id);
        try {
          const response = await fetch('/api/fetchImageByIDs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: imageIds }),
          });
          const data = await response.json();
          if (data.data?.body?.urls) {
            setImageUrls(data.data.body.urls);
          }
        } catch (error) {
          console.error('Error fetching image URLs:', error);
        }
      };
      fetchImages();
    }
  }, [entries]);

  useEffect(() => {
    if (isOpen) {
      console.log('TreeMinimap modal updating with entries:', entries.length);
      renderFullTree();
    }
  }, [isOpen, entries, imageUrls]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-[95vw] flex-col rounded-lg bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">Thread Tree Map</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-2xl font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 px-6 py-4 text-sm text-gray-600">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-blue-500" />
              <span>Root</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-purple-500" />
              <span>Parent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-orange-500" />
              <span>Comment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-green-500" />
              <span>Related</span>
            </div>
            <div className="text-gray-500">
              Solid lines: parent/child | Dotted lines: relationships with %
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="inline-block min-w-full">
            <svg
              ref={svgRef}
              className="block rounded border border-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const TreeMinimap: React.FC<TreeMinimapProps> = ({ entries, onNodeClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  const buildTreeData = () => {
    if (!entries.length) return null;

    // Find root entry
    const rootEntry = entries.find(
      (entry) => entry.relationshipType === 'root',
    );
    if (!rootEntry) return null;

    // Build tree structure - include ALL entries, not just hierarchical ones
    const buildNode = (entry: any, visited = new Set()): TreeNode => {
      if (visited.has(entry.id)) {
        // Prevent infinite loops
        return {
          id: entry.id,
          data: entry.data.slice(0, 30) + (entry.data.length > 30 ? '...' : ''),
          relationshipType: entry.relationshipType,
          relationshipSource: entry.relationshipSource,
          similarity: entry.similarity,
          level: entry.level,
          children: [],
        };
      }

      visited.add(entry.id);
      const children: TreeNode[] = [];

      // Add comment children (these have actual parent-child relationships)
      entries
        .filter(
          (e) =>
            e.relationshipSource === entry.id &&
            e.relationshipType === 'comment',
        )
        .forEach((child) => {
          children.push(buildNode(child, new Set(visited)));
        });

      // For ANY entry, add its neighbors as children
      entries
        .filter(
          (e) =>
            e.relationshipSource === entry.id &&
            e.relationshipType === 'neighbor',
        )
        .forEach((neighbor) => {
          children.push(buildNode(neighbor, new Set(visited)));
        });

      // Add parent entries that reference this entry
      entries
        .filter(
          (e) =>
            e.relationshipSource === entry.id &&
            e.relationshipType === 'parent',
        )
        .forEach((parent) => {
          children.push(buildNode(parent, new Set(visited)));
        });

      return {
        id: entry.id,
        data: entry.data.slice(0, 30) + (entry.data.length > 30 ? '...' : ''),
        relationshipType: entry.relationshipType,
        relationshipSource: entry.relationshipSource,
        similarity: entry.similarity,
        level: entry.level,
        children,
      };
    };

    return buildNode(rootEntry);
  };

  const renderMiniTree = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const treeData = buildTreeData();
    if (!treeData) return;

    const width = 200;
    const height = 120;
    const nodeRadius = 3;
    const padding = 20;

    svg.attr('width', width).attr('height', height);

    // Create tree layout with proper bounds
    const tree = d3
      .tree<TreeNode>()
      .size([height - padding * 2, width - padding * 2]);
    const root = d3.hierarchy(treeData);
    const treeNodes = tree(root);

    const g = svg
      .append('g')
      .attr('transform', `translate(${padding}, ${padding})`);

    // Draw links (parent-child relationships)
    g.selectAll('.link')
      .data(treeNodes.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr(
        'd',
        d3
          .linkHorizontal<HierarchyPointLink<TreeNode>, [number, number]>()
          .x((d) => (d as any).y)
          .y((d) => (d as any).x),
      )
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5);

    // Draw neighbor relationship lines (dotted)
    entries
      .filter((entry) => entry.relationshipType === 'neighbor')
      .forEach((neighbor) => {
        const sourceNode = treeNodes
          .descendants()
          .find((d) => d.data.id === neighbor.relationshipSource);
        const targetNode = treeNodes
          .descendants()
          .find((d) => d.data.id === neighbor.id);

        if (sourceNode && targetNode) {
          g.append('path')
            .attr(
              'd',
              `M${sourceNode.y},${sourceNode.x} L${targetNode.y},${targetNode.x}`,
            )
            .attr('fill', 'none')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2');
        }
      });

    // Draw nodes
    const nodes = g
      .selectAll('.node')
      .data(treeNodes.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data.id);
      });

    // Node circles with image indicators
    nodes.each(function (d) {
      const nodeGroup = d3.select(this);
      const isImageNode =
        entries.find((e) => e.id === d.data.id)?.metadata?.type === 'image';

      if (isImageNode) {
        // For image nodes, use a slightly different visual style
        nodeGroup
          .append('circle')
          .attr('r', nodeRadius)
          .attr('fill', (di: any) => {
            switch (di.data.relationshipType) {
              case 'root':
                return '#3b82f6';
              case 'parent':
                return '#8b5cf6';
              case 'comment':
                return '#f97316';
              case 'neighbor':
                return '#10b981';
              default:
                return '#6b7280';
            }
          })
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '2,1'); // Dashed border for image nodes

        // Add a small camera icon or indicator
        nodeGroup
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 1)
          .attr('font-size', '8px')
          .attr('fill', 'white')
          .text('📷');
      } else {
        // Regular text nodes
        nodeGroup
          .append('circle')
          .attr('r', nodeRadius)
          .attr('fill', (da: any) => {
            switch (da.data.relationshipType) {
              case 'root':
                return '#3b82f6';
              case 'parent':
                return '#8b5cf6';
              case 'comment':
                return '#f97316';
              case 'neighbor':
                return '#10b981';
              default:
                return '#6b7280';
            }
          })
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
      }
    });
  };

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch image URLs for image entries in mini tree
  useEffect(() => {
    const imageEntries = entries.filter(
      (entry) => entry.metadata?.type === 'image',
    );
    if (imageEntries.length > 0) {
      const fetchImages = async () => {
        const imageIds = imageEntries.map((entry) => entry.id);
        try {
          const response = await fetch('/api/fetchImageByIDs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: imageIds }),
          });
          const data = await response.json();
          if (data.data?.body?.urls) {
            setImageUrls(data.data.body.urls);
          }
        } catch (error) {
          console.error('Error fetching image URLs:', error);
        }
      };
      fetchImages();
    }
  }, [entries]);

  useEffect(() => {
    console.log('TreeMinimap updating with entries:', entries.length);
    console.log(
      'Entry types:',
      entries.map((e) => ({ id: e.id.slice(0, 8), type: e.relationshipType })),
    );
    if (!isMobile) {
      renderMiniTree();
    }
  }, [entries, imageUrls, isMobile]);

  if (!entries.length) return null;

  return (
    <>
      {isMobile ? (
        // Mobile: Floating button
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Open Thread Tree Map"
          type="button"
          aria-label="Open Thread Tree Map"
        >
          <svg
            className="size-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <circle cx="12" cy="6" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>
      ) : (
        // Desktop: Fixed minimap
        <div
          className="fixed bottom-6 right-6 z-40 cursor-pointer rounded-lg border border-gray-200 bg-white p-2 shadow-lg transition-shadow hover:shadow-xl"
          onClick={() => setIsModalOpen(true)}
          title="Thread Tree (click to expand)"
          onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
          tabIndex={0}
          role="button"
        >
          <svg ref={svgRef} className="block" />
          <div className="mt-1 text-center text-xs text-gray-500">Tree Map</div>
        </div>
      )}

      <TreeMinimapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entries={entries}
        onNodeClick={(entryId) => {
          onNodeClick(entryId);
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default TreeMinimap;
