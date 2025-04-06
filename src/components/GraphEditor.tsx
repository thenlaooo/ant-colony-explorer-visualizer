
import React, { useRef, useState, useEffect } from 'react';
import { Node, Edge, NodeId } from '@/lib/aco/models';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

interface GraphEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  selectedNodeId: NodeId | null;
  onSelectNode: (id: NodeId | null) => void;
  bestTour: NodeId[];
}

const GraphEditor: React.FC<GraphEditorProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  selectedNodeId,
  onSelectNode,
  bestTour
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Update SVG size on window resize
  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setSvgSize({ width, height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);
  
  // Handle node selection
  const handleNodeClick = (nodeId: NodeId, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectNode(nodeId === selectedNodeId ? null : nodeId);
  };
  
  // Handle node dragging
  const handleNodeMouseDown = (node: Node, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectNode(node.id);
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - svgRect.left;
        const y = moveEvent.clientY - svgRect.top;
        
        // Update node position
        const updatedNodes = nodes.map(n => 
          n.id === node.id ? { ...n, x, y } : n
        );
        
        onNodesChange(updatedNodes);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle adding a new node
  const handleAddNode = () => {
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // Calculate center position
    const x = svgRect.width / 2;
    const y = svgRect.height / 2;
    
    // Create a new node
    const newNode: Node = {
      id: `node-${Date.now()}`,
      x,
      y,
      label: `${nodes.length + 1}`
    };
    
    // Add edges to all existing nodes
    const newEdges = [...edges];
    
    nodes.forEach(existingNode => {
      const distance = Math.sqrt(
        Math.pow(existingNode.x - x, 2) + Math.pow(existingNode.y - y, 2)
      );
      
      // Add bidirectional edges
      newEdges.push({
        source: newNode.id,
        target: existingNode.id,
        distance,
        pheromone: 1.0
      });
      
      newEdges.push({
        source: existingNode.id,
        target: newNode.id,
        distance,
        pheromone: 1.0
      });
    });
    
    // Update nodes and edges
    onNodesChange([...nodes, newNode]);
    onEdgesChange(newEdges);
    onSelectNode(newNode.id);
  };
  
  // Handle SVG click to add a new node
  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) return;
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;
    
    // Create a new node
    const newNode: Node = {
      id: `node-${Date.now()}`,
      x,
      y,
      label: `${nodes.length + 1}`
    };
    
    // Add edges to all existing nodes
    const newEdges = [...edges];
    
    nodes.forEach(existingNode => {
      const distance = Math.sqrt(
        Math.pow(existingNode.x - x, 2) + Math.pow(existingNode.y - y, 2)
      );
      
      // Add bidirectional edges
      newEdges.push({
        source: newNode.id,
        target: existingNode.id,
        distance,
        pheromone: 1.0
      });
      
      newEdges.push({
        source: existingNode.id,
        target: newNode.id,
        distance,
        pheromone: 1.0
      });
    });
    
    // Update nodes and edges
    onNodesChange([...nodes, newNode]);
    onEdgesChange(newEdges);
  };
  
  // Delete selected node
  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    
    // Filter out the selected node
    const updatedNodes = nodes.filter(node => node.id !== selectedNodeId);
    
    // Filter out edges connected to the selected node
    const updatedEdges = edges.filter(
      edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId
    );
    
    onNodesChange(updatedNodes);
    onEdgesChange(updatedEdges);
    onSelectNode(null);
  };
  
  // Check if an edge is part of the best tour
  const isEdgeInBestTour = (source: NodeId, target: NodeId) => {
    for (let i = 0; i < bestTour.length - 1; i++) {
      if (bestTour[i] === source && bestTour[i + 1] === target) {
        return true;
      }
    }
    
    // Check the last edge (back to start)
    if (bestTour.length > 1 && 
        bestTour[bestTour.length - 1] === source && 
        bestTour[0] === target) {
      return true;
    }
    
    return false;
  };
  
  // Calculate edge color based on pheromone level
  const getEdgeColor = (edge: Edge) => {
    if (bestTour.length > 0 && isEdgeInBestTour(edge.source, edge.target)) {
      return 'stroke-bestPath';
    }
    
    // Max pheromone value for normalization
    const maxPheromone = Math.max(...edges.map(e => e.pheromone));
    
    if (maxPheromone <= 1.0) {
      return 'stroke-edge';
    }
    
    const normalizedPheromone = edge.pheromone / maxPheromone;
    
    if (normalizedPheromone < 0.25) {
      return 'stroke-edge';
    } else if (normalizedPheromone < 0.5) {
      return 'stroke-yellow-400 opacity-30';
    } else if (normalizedPheromone < 0.75) {
      return 'stroke-amber-500 opacity-50';
    } else {
      return 'stroke-orange-600 opacity-70';
    }
  };
  
  // Get edge stroke width based on pheromone level
  const getEdgeStrokeWidth = (edge: Edge) => {
    if (bestTour.length > 0 && isEdgeInBestTour(edge.source, edge.target)) {
      return 3;
    }
    
    const maxPheromone = Math.max(...edges.map(e => e.pheromone));
    
    if (maxPheromone <= 1.0) {
      return 1;
    }
    
    const normalizedPheromone = edge.pheromone / maxPheromone;
    
    return 1 + Math.floor(normalizedPheromone * 2);
  };
  
  return (
    <div className="relative border rounded-lg overflow-hidden bg-card">
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddNode}
          className="bg-secondary/80 backdrop-blur-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить узел
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteNode}
          disabled={!selectedNodeId}
          className="bg-secondary/80 backdrop-blur-sm"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Удалить
        </Button>
      </div>
      
      <svg
        ref={svgRef}
        className="w-full h-[600px]"
        onClick={handleSvgClick}
      >
        {/* Render edges */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;
          
          return (
            <line
              key={`${edge.source}-${edge.target}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              className={cn(
                'edge',
                getEdgeColor(edge)
              )}
              strokeWidth={getEdgeStrokeWidth(edge)}
            />
          );
        })}
        
        {/* Render nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onClick={(e) => handleNodeClick(node.id, e)}
            onMouseDown={(e) => handleNodeMouseDown(node, e)}
            className="cursor-move"
          >
            <circle
              r={12}
              className={cn(
                'node',
                node.id === selectedNodeId && 'node-selected'
              )}
            />
            {node.label && (
              <text
                className="text-xs fill-white font-bold select-none pointer-events-none"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {node.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default GraphEditor;
