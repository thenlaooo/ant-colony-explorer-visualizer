
import React, { useEffect, useRef } from 'react';
import { Ant, Graph, NodeId } from '@/lib/aco/models';

interface AntVisualizerProps {
  ants: Ant[];
  graph: Graph;
}

const AntVisualizer: React.FC<AntVisualizerProps> = ({ ants, graph }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match parent
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ants
    ants.forEach(ant => {
      const currentNodeObj = graph.nodes.find(node => node.id === ant.currentNode);
      
      if (!currentNodeObj) return;
      
      // Draw ant as a small circle with a unique color based on ant ID
      const antId = parseInt(ant.id.replace('ant-', ''), 10);
      const hue = (antId * 137) % 360; // Golden ratio to distribute colors
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.beginPath();
      ctx.arc(currentNodeObj.x, currentNodeObj.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw recently visited path
      if (ant.visitedNodes.length > 1) {
        const lastVisitedIndex = Math.max(0, ant.visitedNodes.length - 5);
        const recentPath = ant.visitedNodes.slice(lastVisitedIndex);
        
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.6)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < recentPath.length; i++) {
          const nodeObj = graph.nodes.find(node => node.id === recentPath[i]);
          
          if (nodeObj) {
            if (i === 0) {
              ctx.moveTo(nodeObj.x, nodeObj.y);
            } else {
              ctx.lineTo(nodeObj.x, nodeObj.y);
            }
          }
        }
        
        ctx.stroke();
      }
    });
  }, [ants, graph.nodes]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};

export default AntVisualizer;
