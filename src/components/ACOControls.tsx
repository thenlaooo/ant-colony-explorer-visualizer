
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, SkipForward, RotateCw, RefreshCw } from 'lucide-react';
import { ACOParameters, defaultParameters } from '@/lib/aco/models';

interface ACOControlsProps {
  parameters: ACOParameters;
  onParametersChange: (params: ACOParameters) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onStep: () => void;
  onReset: () => void;
  onGenerateRandom: () => void;
  iteration: number;
  maxIterations: number;
  bestTourLength: number;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const ACOControls: React.FC<ACOControlsProps> = ({
  parameters,
  onParametersChange,
  isRunning,
  onStart,
  onStop,
  onStep,
  onReset,
  onGenerateRandom,
  iteration,
  maxIterations,
  bestTourLength,
  simulationSpeed,
  onSpeedChange
}) => {
  // Handle parameter change
  const handleParamChange = (param: keyof ACOParameters, value: number) => {
    onParametersChange({
      ...parameters,
      [param]: value
    });
  };
  
  // Handle slider change
  const handleSliderChange = (param: keyof ACOParameters, values: number[]) => {
    handleParamChange(param, values[0]);
  };
  
  // Invert simulation speed for slider (lower values = faster)
  const displaySpeed = 1000 - simulationSpeed;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="antCount" className="slider-label">Муравьи</Label>
                <span className="text-sm font-medium">{parameters.antCount}</span>
              </div>
              <Slider
                id="antCount"
                min={1}
                max={50}
                step={1}
                value={[parameters.antCount]}
                onValueChange={(values) => handleSliderChange('antCount', values)}
                disabled={isRunning}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="alpha" className="slider-label">Альфа (α)</Label>
                <span className="text-sm font-medium">{parameters.alpha.toFixed(1)}</span>
              </div>
              <Slider
                id="alpha"
                min={0}
                max={5}
                step={0.1}
                value={[parameters.alpha]}
                onValueChange={(values) => handleSliderChange('alpha', values)}
                disabled={isRunning}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="beta" className="slider-label">Бета (β)</Label>
                <span className="text-sm font-medium">{parameters.beta.toFixed(1)}</span>
              </div>
              <Slider
                id="beta"
                min={0}
                max={5}
                step={0.1}
                value={[parameters.beta]}
                onValueChange={(values) => handleSliderChange('beta', values)}
                disabled={isRunning}
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rho" className="slider-label">Испарение (ρ)</Label>
                <span className="text-sm font-medium">{parameters.rho.toFixed(2)}</span>
              </div>
              <Slider
                id="rho"
                min={0.01}
                max={0.5}
                step={0.01}
                value={[parameters.rho]}
                onValueChange={(values) => handleSliderChange('rho', values)}
                disabled={isRunning}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="q" className="slider-label">Фактор феромона (Q)</Label>
                <span className="text-sm font-medium">{parameters.q}</span>
              </div>
              <Slider
                id="q"
                min={10}
                max={1000}
                step={10}
                value={[parameters.q]}
                onValueChange={(values) => handleSliderChange('q', values)}
                disabled={isRunning}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="iterations" className="slider-label">Макс. итераций</Label>
                <span className="text-sm font-medium">{parameters.iterations}</span>
              </div>
              <Slider
                id="iterations"
                min={10}
                max={1000}
                step={10}
                value={[parameters.iterations]}
                onValueChange={(values) => handleSliderChange('iterations', values)}
                disabled={isRunning}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="speed" className="slider-label">Скорость симуляции</Label>
                <span className="text-sm font-medium">
                  {displaySpeed < 200 ? 'Быстро' : displaySpeed > 800 ? 'Медленно' : 'Средне'}
                </span>
              </div>
              <Slider
                id="speed"
                min={0}
                max={1000}
                step={10}
                value={[displaySpeed]}
                onValueChange={(values) => onSpeedChange(1000 - values[0])}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardContent className="pt-6 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Итерация</Label>
                <p className="text-lg font-semibold">{iteration} / {maxIterations}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Длина лучшего маршрута</Label>
                <p className="text-lg font-semibold">
                  {bestTourLength === Infinity 
                    ? '—' 
                    : bestTourLength.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {isRunning ? (
          <Button variant="secondary" onClick={onStop}>
            <Pause className="h-4 w-4 mr-2" />
            Пауза
          </Button>
        ) : (
          <Button variant="default" onClick={onStart}>
            <Play className="h-4 w-4 mr-2" />
            Старт
          </Button>
        )}
        
        <Button variant="outline" onClick={onStep} disabled={isRunning}>
          <SkipForward className="h-4 w-4 mr-2" />
          Шаг
        </Button>
        
        <Button variant="outline" onClick={onReset} disabled={isRunning}>
          <RotateCw className="h-4 w-4 mr-2" />
          Сброс
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onGenerateRandom} 
          disabled={isRunning}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Случайный граф
        </Button>
      </div>
    </div>
  );
};

export default ACOControls;
