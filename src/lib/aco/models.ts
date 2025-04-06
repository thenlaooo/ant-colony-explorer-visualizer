
// Basic structures for ACO algorithm

export type NodeId = string;

export interface Node {
  id: NodeId;
  x: number;
  y: number;
  label?: string;
}

export interface Edge {
  source: NodeId;
  target: NodeId;
  distance: number;
  pheromone: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface Ant {
  id: string;
  currentNode: NodeId;
  visitedNodes: NodeId[];
  tourLength: number;
}

export interface ACOParameters {
  antCount: number;
  alpha: number;      // Pheromone importance
  beta: number;       // Distance importance
  rho: number;        // Evaporation rate
  q: number;          // Pheromone deposit factor
  iterations: number; // Maximum iterations
}

export interface ACOState {
  graph: Graph;
  ants: Ant[];
  bestTour: NodeId[];
  bestTourLength: number;
  currentIteration: number;
  running: boolean;
  speed: number;      // Milliseconds per step
}

// Default ACO parameters
export const defaultParameters: ACOParameters = {
  antCount: 10,
  alpha: 1,
  beta: 2,
  rho: 0.1,
  q: 100,
  iterations: 100
};

// Initial state for the ACO simulation
export const initialState: ACOState = {
  graph: { nodes: [], edges: [] },
  ants: [],
  bestTour: [],
  bestTourLength: Infinity,
  currentIteration: 0,
  running: false,
  speed: 500
};

// Helper to create an edge between two nodes
export function createEdge(source: Node, target: Node, initialPheromone: number = 1.0): Edge {
  const distance = Math.sqrt(
    Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2)
  );
  
  return {
    source: source.id,
    target: target.id,
    distance,
    pheromone: initialPheromone
  };
}

// Generate a fully connected graph from nodes
export function generateCompleteGraph(nodes: Node[]): Graph {
  const edges: Edge[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      edges.push(createEdge(nodes[i], nodes[j]));
      edges.push(createEdge(nodes[j], nodes[i])); // For directed graph
    }
  }
  
  return { nodes, edges };
}
