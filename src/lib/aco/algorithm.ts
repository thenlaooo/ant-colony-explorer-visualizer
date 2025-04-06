
import { ACOParameters, ACOState, Ant, Edge, Graph, Node, NodeId } from './models';

// Initialize ants at random starting positions
export function initializeAnts(graph: Graph, count: number): Ant[] {
  const ants: Ant[] = [];
  
  for (let i = 0; i < count; i++) {
    // Random starting node
    const randomIndex = Math.floor(Math.random() * graph.nodes.length);
    const startNodeId = graph.nodes[randomIndex].id;
    
    ants.push({
      id: `ant-${i}`,
      currentNode: startNodeId,
      visitedNodes: [startNodeId],
      tourLength: 0
    });
  }
  
  return ants;
}

// Get available edges from the current node
function getAvailableEdges(graph: Graph, ant: Ant): Edge[] {
  return graph.edges.filter(edge => 
    edge.source === ant.currentNode && 
    !ant.visitedNodes.includes(edge.target)
  );
}

// Select next node using ACO probability formula
function selectNextNode(
  availableEdges: Edge[],
  params: ACOParameters
): NodeId | null {
  if (availableEdges.length === 0) return null;
  
  // Calculate total probability
  let total = 0;
  const probabilities = availableEdges.map(edge => {
    // ACO formula: (pheromone^α) * (1/distance^β)
    const probability = 
      Math.pow(edge.pheromone, params.alpha) * 
      Math.pow(1 / edge.distance, params.beta);
    total += probability;
    return { edge, probability };
  });
  
  // Roulette wheel selection
  const random = Math.random() * total;
  let accumulator = 0;
  
  for (const { edge, probability } of probabilities) {
    accumulator += probability;
    if (accumulator >= random) {
      return edge.target;
    }
  }
  
  // Fallback to the first available edge
  return availableEdges[0].target;
}

// Calculate the length of a tour
export function calculateTourLength(graph: Graph, tour: NodeId[]): number {
  let length = 0;
  
  for (let i = 0; i < tour.length - 1; i++) {
    const edge = graph.edges.find(
      e => e.source === tour[i] && e.target === tour[i + 1]
    );
    
    if (edge) {
      length += edge.distance;
    }
  }
  
  // Add the distance back to the starting node (for TSP)
  if (tour.length > 1) {
    const lastEdge = graph.edges.find(
      e => e.source === tour[tour.length - 1] && e.target === tour[0]
    );
    
    if (lastEdge) {
      length += lastEdge.distance;
    }
  }
  
  return length;
}

// Move ants to their next nodes
export function moveAnts(state: ACOState, params: ACOParameters): Ant[] {
  return state.ants.map(ant => {
    // If all nodes have been visited, return to the starting node
    if (ant.visitedNodes.length === state.graph.nodes.length) {
      const startNode = ant.visitedNodes[0];
      const returnEdge = state.graph.edges.find(
        e => e.source === ant.currentNode && e.target === startNode
      );
      
      if (returnEdge) {
        return {
          ...ant,
          currentNode: startNode,
          visitedNodes: [...ant.visitedNodes, startNode],
          tourLength: ant.tourLength + returnEdge.distance
        };
      }
      
      return ant;
    }
    
    // Find available edges
    const availableEdges = getAvailableEdges(state.graph, ant);
    
    // If no available edges, stay at current node
    if (availableEdges.length === 0) {
      return ant;
    }
    
    // Select next node
    const nextNode = selectNextNode(availableEdges, params);
    
    if (!nextNode) {
      return ant;
    }
    
    // Find the selected edge
    const selectedEdge = availableEdges.find(e => e.target === nextNode);
    
    if (!selectedEdge) {
      return ant;
    }
    
    // Move to the next node
    return {
      ...ant,
      currentNode: nextNode,
      visitedNodes: [...ant.visitedNodes, nextNode],
      tourLength: ant.tourLength + selectedEdge.distance
    };
  });
}

// Update pheromones on all edges
export function updatePheromones(state: ACOState, params: ACOParameters): Edge[] {
  const { graph, ants } = state;
  
  // Create a copy of the edges to update
  const updatedEdges = graph.edges.map(edge => ({
    ...edge,
    // Evaporate existing pheromone
    pheromone: edge.pheromone * (1 - params.rho)
  }));
  
  // Add new pheromones from ants
  ants.forEach(ant => {
    // Only consider complete tours
    if (ant.visitedNodes.length <= state.graph.nodes.length) {
      return;
    }
    
    // Calculate pheromone deposit (Q / tour length)
    const deposit = params.q / ant.tourLength;
    
    // Update edges used in this tour
    for (let i = 0; i < ant.visitedNodes.length - 1; i++) {
      const source = ant.visitedNodes[i];
      const target = ant.visitedNodes[i + 1];
      
      // Find and update the edge
      const edgeIndex = updatedEdges.findIndex(
        e => e.source === source && e.target === target
      );
      
      if (edgeIndex !== -1) {
        updatedEdges[edgeIndex] = {
          ...updatedEdges[edgeIndex],
          pheromone: updatedEdges[edgeIndex].pheromone + deposit
        };
      }
    }
  });
  
  return updatedEdges;
}

// Generate a randomly placed graph
export function generateRandomGraph(
  nodeCount: number,
  width: number,
  height: number
): Graph {
  // Create nodes with random positions
  const nodes: Node[] = Array.from({ length: nodeCount }).map((_, i) => ({
    id: `node-${i}`,
    x: Math.random() * (width - 50) + 25,
    y: Math.random() * (height - 50) + 25,
    label: `${i + 1}`
  }));
  
  // Create edges (fully connected graph)
  const edges: Edge[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        const source = nodes[i];
        const target = nodes[j];
        
        const distance = Math.sqrt(
          Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2)
        );
        
        edges.push({
          source: source.id,
          target: target.id,
          distance,
          pheromone: 1.0 // Initial pheromone level
        });
      }
    }
  }
  
  return { nodes, edges };
}

// Perform a single iteration of the ACO algorithm
export function performIteration(
  state: ACOState,
  params: ACOParameters
): ACOState {
  // Initialize new ants if starting a new iteration
  let ants = state.ants;
  
  if (ants.length === 0 || ants[0].visitedNodes.length > state.graph.nodes.length) {
    ants = initializeAnts(state.graph, params.antCount);
  }
  
  // Move ants to their next nodes
  ants = moveAnts({ ...state, ants }, params);
  
  // Update pheromones if all ants have completed their tours
  let edges = state.graph.edges;
  let bestTour = state.bestTour;
  let bestTourLength = state.bestTourLength;
  let currentIteration = state.currentIteration;
  
  const allToursCompleted = ants.every(
    ant => ant.visitedNodes.length > state.graph.nodes.length
  );
  
  if (allToursCompleted) {
    // Update pheromones
    edges = updatePheromones({ ...state, ants }, params);
    
    // Find the best tour
    ants.forEach(ant => {
      if (ant.tourLength < bestTourLength) {
        bestTour = [...ant.visitedNodes];
        bestTourLength = ant.tourLength;
      }
    });
    
    // Increment iteration counter
    currentIteration++;
    
    // Reset ants for next iteration
    ants = initializeAnts({ ...state.graph, edges }, params.antCount);
  }
  
  return {
    ...state,
    graph: { ...state.graph, edges },
    ants,
    bestTour,
    bestTourLength,
    currentIteration
  };
}
