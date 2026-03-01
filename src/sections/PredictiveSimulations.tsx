import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Play, 
  Pause, 
  Settings,
  Download,
  CheckCircle2,
  Wind,
  CloudRain,
  Thermometer,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  simulationStore, 
  projectStore,
  settingsStore,
  type SimulationResult,
  type Project 
} from '@/lib/store';

interface SimulationScenario {
  id: string;
  name: string;
  type: 'weather' | 'structural' | 'schedule' | 'cost';
  description: string;
  parameters: Record<string, number>;
}

const defaultScenarios: SimulationScenario[] = [
  {
    id: 'weather-1',
    name: 'Heavy Rain Impact',
    type: 'weather',
    description: 'Simulate 3-day continuous rainfall on project timeline',
    parameters: { duration: 3, intensity: 80 }
  },
  {
    id: 'structural-1',
    name: 'Foundation Load Test',
    type: 'structural',
    description: 'Simulate maximum load capacity under various conditions',
    parameters: { load: 15000, safety: 1.5 }
  },
  {
    id: 'schedule-1',
    name: 'Resource Conflict',
    type: 'schedule',
    description: 'Simulate impact of delayed material delivery',
    parameters: { delay: 7, criticalPath: 1 }
  },
  {
    id: 'cost-1',
    name: 'Material Price Spike',
    type: 'cost',
    description: 'Simulate impact of 20% material cost increase',
    parameters: { increase: 20, duration: 30 }
  },
];

interface WeatherData {
  day: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  workability: number;
}

const generateWeatherForecast = (): WeatherData[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => {
    const temp = 20 + Math.random() * 10;
    const humidity = 50 + Math.random() * 40;
    const wind = 5 + Math.random() * 20;
    const precip = Math.random() > 0.6 ? Math.random() * 50 : 0;
    const workability = Math.max(0, Math.min(100, 100 - precip - (wind > 15 ? 10 : 0) - (humidity > 80 ? 10 : 0)));
    
    return {
      day,
      temperature: Math.round(temp),
      humidity: Math.round(humidity),
      windSpeed: Math.round(wind),
      precipitation: Math.round(precip),
      workability: Math.round(workability)
    };
  });
};

// Simulation engine
const runSimulation = (scenario: SimulationScenario): SimulationResult['recommendations'] => {
  const recommendations: string[] = [];
  
  switch (scenario.type) {
    case 'weather':
      if (scenario.parameters.intensity > 70) {
        recommendations.push('Deploy temporary weather protection structures');
        recommendations.push('Reschedule concrete pouring operations');
        recommendations.push('Activate backup indoor activities');
        recommendations.push('Prepare drainage systems');
      } else {
        recommendations.push('Monitor weather conditions closely');
        recommendations.push('Continue with caution');
      }
      break;
      
    case 'structural':
      if (scenario.parameters.load > 12000) {
        recommendations.push('Conduct detailed structural analysis');
        recommendations.push('Consider additional reinforcement');
        recommendations.push('Increase safety factor to 2.0');
      } else {
        recommendations.push('Structure is within safe limits');
        recommendations.push('Continue with planned activities');
        recommendations.push('Monitor strain sensors regularly');
      }
      break;
      
    case 'schedule':
      if (scenario.parameters.delay > 5) {
        recommendations.push('Expedite material delivery');
        recommendations.push('Reallocate resources from non-critical tasks');
        recommendations.push('Negotiate with alternative suppliers');
        recommendations.push('Consider overtime work authorization');
      } else {
        recommendations.push('Minor delay manageable');
        recommendations.push('Adjust task sequencing');
      }
      break;
      
    case 'cost':
      if (scenario.parameters.increase > 15) {
        recommendations.push('Negotiate bulk purchase discounts');
        recommendations.push('Explore alternative material suppliers');
        recommendations.push('Review project scope for cost reduction');
        recommendations.push('Consider value engineering options');
      } else {
        recommendations.push('Cost increase within acceptable range');
        recommendations.push('Monitor market trends');
      }
      break;
  }
  
  return recommendations;
};

const calculateRisk = (scenario: SimulationScenario): number => {
  switch (scenario.type) {
    case 'weather':
      return Math.min(100, scenario.parameters.intensity * 0.8 + scenario.parameters.duration * 5);
    case 'structural':
      return Math.min(100, (scenario.parameters.load / 20000) * 100);
    case 'schedule':
      return Math.min(100, scenario.parameters.delay * 8 + (scenario.parameters.criticalPath ? 20 : 0));
    case 'cost':
      return Math.min(100, scenario.parameters.increase * 3);
    default:
      return 50;
  }
};

const calculateDelay = (scenario: SimulationScenario): number => {
  switch (scenario.type) {
    case 'weather':
      return Math.round(scenario.parameters.duration * (scenario.parameters.intensity / 100) * 2);
    case 'structural':
      return scenario.parameters.load > 15000 ? 3 : 0;
    case 'schedule':
      return Math.round(scenario.parameters.delay * (scenario.parameters.criticalPath ? 1.5 : 0.5));
    case 'cost':
      return scenario.parameters.increase > 20 ? 5 : 0;
    default:
      return 0;
  }
};

const calculateCostImpact = (scenario: SimulationScenario, projectBudget?: number): number => {
  const baseImpact = projectBudget ? projectBudget * 0.1 : 100000;
  
  switch (scenario.type) {
    case 'weather':
      return Math.round(baseImpact * (scenario.parameters.intensity / 100) * scenario.parameters.duration);
    case 'structural':
      return Math.round(baseImpact * 0.5);
    case 'schedule':
      return Math.round(baseImpact * (scenario.parameters.delay / 10));
    case 'cost':
      return Math.round(baseImpact * (scenario.parameters.increase / 100));
    default:
      return baseImpact;
  }
};

export default function PredictiveSimulations() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(defaultScenarios);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>(defaultScenarios[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>(generateWeatherForecast());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    type: 'weather' as SimulationScenario['type'],
    description: ''
  });

  const settings = settingsStore.get();

  useEffect(() => {
    loadData();
    // Refresh weather data every hour
    const interval = setInterval(() => {
      setWeatherData(generateWeatherForecast());
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProject) {
      setSavedSimulations(simulationStore.getByProject(selectedProject));
    }
  }, [selectedProject]);

  const loadData = () => {
    setProjects(projectStore.getAll());
  };

  const runSimulationProcess = () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationComplete(false);

    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    setTimeout(() => {
      const project = projects.find(p => p.id === selectedProject);
      const risk = calculateRisk(activeScenario);
      const delay = calculateDelay(activeScenario);
      const costImpact = calculateCostImpact(activeScenario, project?.budget);
      const recommendations = runSimulation(activeScenario);

      simulationStore.create({
        projectId: selectedProject,
        scenarioType: activeScenario.type,
        name: activeScenario.name,
        parameters: activeScenario.parameters,
        risk,
        delay,
        costImpact,
        recommendations
      });

      setSavedSimulations(simulationStore.getByProject(selectedProject));
      setIsSimulating(false);
      setSimulationComplete(true);
      toast.success('Simulation completed and saved');
    }, 2500);
  };

  const handleCreateScenario = () => {
    if (!newScenario.name || !newScenario.description) {
      toast.error('Please fill in all fields');
      return;
    }

    const scenario: SimulationScenario = {
      id: `scenario-${Date.now()}`,
      name: newScenario.name,
      type: newScenario.type,
      description: newScenario.description,
      parameters: { value: 50 }
    };

    setScenarios([...scenarios, scenario]);
    setIsCreateDialogOpen(false);
    setNewScenario({ name: '', type: 'weather', description: '' });
    toast.success('Scenario created');
  };

  const handleDeleteSimulation = (id: string) => {
    simulationStore.delete(id);
    setSavedSimulations(simulationStore.getByProject(selectedProject));
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-500';
    if (risk < 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getRiskBg = (risk: number) => {
    if (risk < 30) return 'bg-green-500';
    if (risk < 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            Predictive Simulations
          </h2>
          <p className="text-muted-foreground">
            Run AI-powered simulations to predict and mitigate project risks
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <BarChart3 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => {
            const data = JSON.stringify(savedSimulations, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simulations-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success('Simulations exported');
          }}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario List */}
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Simulation Scenarios</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenarios.map((scenario) => (
                  <motion.div
                    key={scenario.id}
                    onClick={() => setActiveScenario(scenario)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      activeScenario.id === scenario.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {scenario.type}
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-1">{scenario.name}</h4>
                    <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Scenario Configuration */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  Configuration: {activeScenario.name}
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={runSimulationProcess}
                  disabled={isSimulating || !selectedProject}
                >
                  {isSimulating ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Parameters */}
                <div className="space-y-4">
                  {Object.entries(activeScenario.parameters).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm capitalize">{key}</Label>
                        <Badge variant="secondary">{value}</Badge>
                      </div>
                      <Slider 
                        defaultValue={[value]} 
                        max={key === 'duration' || key === 'delay' ? 14 : 100}
                        step={1}
                        onValueChange={([v]) => {
                          setActiveScenario({
                            ...activeScenario,
                            parameters: { ...activeScenario.parameters, [key]: v }
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                {/* Simulation Progress */}
                {isSimulating && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Running Simulation...</span>
                      <span className="text-sm">{simulationProgress}%</span>
                    </div>
                    <Progress value={simulationProgress} className="h-2" />
                  </div>
                )}

                {/* Results Preview */}
                {simulationComplete && savedSimulations.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {(() => {
                      const latest = savedSimulations[savedSimulations.length - 1];
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <p className="text-sm text-muted-foreground">Risk Level</p>
                              <p className={`text-2xl font-bold ${getRiskColor(latest.risk)}`}>
                                {latest.risk}%
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <p className="text-sm text-muted-foreground">Delay Impact</p>
                              <p className="text-2xl font-bold text-amber-500">
                                {latest.delay} days
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <p className="text-sm text-muted-foreground">Cost Impact</p>
                              <p className="text-2xl font-bold text-red-500">
                                {settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : '₹'}
                                {(latest.costImpact / 1000).toFixed(0)}k
                              </p>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-muted/30">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              AI Recommendations
                            </h4>
                            <ul className="space-y-2">
                              {latest.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs flex-shrink-0">
                                    {index + 1}
                                  </span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CloudRain className="w-5 h-5" />
                7-Day Weather Forecast & Workability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weatherData}>
                    <defs>
                      <linearGradient id="colorWorkability" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 16, 20, 0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="workability" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorWorkability)" 
                      strokeWidth={2}
                      name="Workability %"
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="precipitation" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorPrecip)" 
                      strokeWidth={2}
                      name="Precipitation %"
                    />
                    <ReferenceLine yAxisId="left" y={80} stroke="#f59e0b" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Weather Cards */}
              <div className="grid grid-cols-7 gap-2 mt-6">
                {weatherData.map((day) => (
                  <div key={day.day} className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="font-medium text-sm">{day.day}</p>
                    <div className="my-2">
                      {day.precipitation > 30 ? (
                        <CloudRain className="w-6 h-6 mx-auto text-blue-500" />
                      ) : day.windSpeed > 15 ? (
                        <Wind className="w-6 h-6 mx-auto text-cyan-500" />
                      ) : (
                        <Thermometer className="w-6 h-6 mx-auto text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{day.temperature}°C</p>
                    <Badge 
                      variant={day.workability > 80 ? 'default' : day.workability > 60 ? 'secondary' : 'destructive'}
                      className="mt-2 text-[10px]"
                    >
                      {day.workability}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Analysis History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Weather', risk: 75, mitigated: 45 },
                      { name: 'Structural', risk: 25, mitigated: 15 },
                      { name: 'Schedule', risk: 60, mitigated: 35 },
                      { name: 'Cost', risk: 40, mitigated: 25 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 16, 20, 0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="risk" fill="#ef4444" name="Initial Risk" />
                      <Bar dataKey="mitigated" fill="#10b981" name="After Mitigation" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Simulation Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Weather Predictions</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-green-500">94%</p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium">Delay Forecasts</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-500">87%</p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Cost Estimates</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-500">91%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saved Simulations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Simulations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedSimulations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No simulations saved yet</p>
                    <p className="text-sm">Run a simulation to see results here</p>
                  </div>
                ) : (
                  savedSimulations.map((sim) => (
                    <div 
                      key={sim.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getRiskBg(sim.risk)} bg-opacity-20`}>
                          <AlertTriangle className={`w-5 h-5 ${getRiskColor(sim.risk)}`} />
                        </div>
                        <div>
                          <p className="font-medium">{sim.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sim.scenarioType} • {new Date(sim.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Risk</p>
                          <p className={`font-medium ${getRiskColor(sim.risk)}`}>{sim.risk}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Delay</p>
                          <p className="font-medium">{sim.delay}d</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteSimulation(sim.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Scenario Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Scenario Name</Label>
              <Input 
                placeholder="e.g., Equipment Failure"
                value={newScenario.name}
                onChange={(e) => setNewScenario({...newScenario, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newScenario.type} 
                onValueChange={(v) => setNewScenario({...newScenario, type: v as SimulationScenario['type']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Describe the scenario..."
                value={newScenario.description}
                onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScenario}>
              <Save className="w-4 h-4 mr-2" />
              Create Scenario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
