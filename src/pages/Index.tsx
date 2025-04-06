
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GraphEditor from '@/components/GraphEditor';
import AntVisualizer from '@/components/AntVisualizer';
import ACOControls from '@/components/ACOControls';
import {
  ACOParameters,
  ACOState,
  NodeId,
  defaultParameters,
  initialState
} from '@/lib/aco/models';
import {
  performIteration,
  generateRandomGraph
} from '@/lib/aco/algorithm';
import { toast } from 'sonner';

const Index = () => {
  const [state, setState] = useState<ACOState>({
    ...initialState,
    graph: { nodes: [], edges: [] }
  });
  
  const [parameters, setParameters] = useState<ACOParameters>(defaultParameters);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);
  const [simulationInterval, setSimulationInterval] = useState<number | null>(null);
  
  // Generate initial random graph
  useEffect(() => {
    handleGenerateRandomGraph();
    toast.success("Welcome to Ant Colony Optimization Visualizer!", {
      description: "Click on the canvas to add nodes or use Random Graph to generate a new problem."
    });
  }, []);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval !== null) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);
  
  // Generate a random graph
  const handleGenerateRandomGraph = useCallback(() => {
    const width = 750;
    const height = 550;
    const nodeCount = Math.floor(Math.random() * 5) + 5; // 5-10 nodes
    
    const graph = generateRandomGraph(nodeCount, width, height);
    
    setState({
      ...initialState,
      graph
    });
    
    setSelectedNodeId(null);
    toast.info(`Generated a random graph with ${nodeCount} nodes`);
  }, []);
  
  // Start simulation
  const handleStart = useCallback(() => {
    if (state.graph.nodes.length < 3) {
      toast.error("Need at least 3 nodes to start simulation");
      return;
    }
    
    // Check if simulation is already running
    if (simulationInterval !== null) {
      clearInterval(simulationInterval);
    }
    
    // Check if we need to reset
    if (state.currentIteration >= parameters.iterations) {
      setState({
        ...state,
        ants: [],
        bestTour: [],
        bestTourLength: Infinity,
        currentIteration: 0,
        running: true
      });
    } else {
      setState({
        ...state,
        running: true
      });
    }
    
    // Start the simulation interval
    const interval = window.setInterval(() => {
      setState(prevState => {
        // Stop if we've reached the maximum iterations
        if (prevState.currentIteration >= parameters.iterations) {
          clearInterval(interval);
          setSimulationInterval(null);
          
          toast.success("Simulation complete", {
            description: `Best tour length: ${prevState.bestTourLength.toFixed(2)}`
          });
          
          return {
            ...prevState,
            running: false
          };
        }
        
        // Perform an iteration
        return performIteration(prevState, parameters);
      });
    }, state.speed);
    
    setSimulationInterval(interval);
  }, [state, parameters]);
  
  // Stop simulation
  const handleStop = useCallback(() => {
    if (simulationInterval !== null) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    
    setState({
      ...state,
      running: false
    });
  }, [state, simulationInterval]);
  
  // Perform a single step
  const handleStep = useCallback(() => {
    if (state.graph.nodes.length < 3) {
      toast.error("Need at least 3 nodes to run simulation");
      return;
    }
    
    // Check if we've reached the maximum iterations
    if (state.currentIteration >= parameters.iterations) {
      toast.info("Maximum iterations reached");
      return;
    }
    
    setState(prevState => performIteration(prevState, parameters));
  }, [state, parameters]);
  
  // Reset simulation
  const handleReset = useCallback(() => {
    setState({
      ...state,
      ants: [],
      bestTour: [],
      bestTourLength: Infinity,
      currentIteration: 0,
      running: false
    });
    
    toast.info("Simulation reset");
  }, [state]);
  
  // Update nodes
  const handleNodesChange = useCallback((nodes: typeof state.graph.nodes) => {
    setState({
      ...state,
      graph: {
        ...state.graph,
        nodes
      }
    });
  }, [state]);
  
  // Update edges
  const handleEdgesChange = useCallback((edges: typeof state.graph.edges) => {
    setState({
      ...state,
      graph: {
        ...state.graph,
        edges
      }
    });
  }, [state]);
  
  // Change simulation speed
  const handleSpeedChange = useCallback((speed: number) => {
    setState({
      ...state,
      speed
    });
    
    // Update interval if simulation is running
    if (simulationInterval !== null) {
      clearInterval(simulationInterval);
      
      const interval = window.setInterval(() => {
        setState(prevState => {
          if (prevState.currentIteration >= parameters.iterations) {
            clearInterval(interval);
            setSimulationInterval(null);
            
            return {
              ...prevState,
              running: false
            };
          }
          
          return performIteration(prevState, parameters);
        });
      }, speed);
      
      setSimulationInterval(interval);
    }
  }, [state, simulationInterval, parameters]);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Ant Colony Optimization Visualizer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize how the ant colony optimization algorithm finds near-optimal solutions to complex problems like the Traveling Salesman Problem.
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="bg-card border-b">
                <CardTitle>Graph Visualization</CardTitle>
                <CardDescription>
                  Click to add nodes, drag to move them
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative">
                <GraphEditor
                  nodes={state.graph.nodes}
                  edges={state.graph.edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  bestTour={state.bestTour}
                />
                <AntVisualizer
                  ants={state.ants}
                  graph={state.graph}
                />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader className="bg-card border-b">
                <CardTitle>Algorithm Controls</CardTitle>
                <CardDescription>
                  Configure parameters and simulation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ACOControls
                  parameters={parameters}
                  onParametersChange={setParameters}
                  isRunning={state.running}
                  onStart={handleStart}
                  onStop={handleStop}
                  onStep={handleStep}
                  onReset={handleReset}
                  onGenerateRandom={handleGenerateRandomGraph}
                  iteration={state.currentIteration}
                  maxIterations={parameters.iterations}
                  bestTourLength={state.bestTourLength}
                  simulationSpeed={state.speed}
                  onSpeedChange={handleSpeedChange}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
