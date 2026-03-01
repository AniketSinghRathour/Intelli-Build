import { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  TrendingUp,
  Activity,
  Target,
  Filter,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  changeStore, 
  projectStore,
  sensorStore,
  type DesignChange,
  type Project 
} from '@/lib/store';

// Generate realistic changes based on sensor data
const generateAutoChanges = (projectId: string): Omit<DesignChange, 'id' | 'timestamp'>[] => {
  const sensors = sensorStore.getAll().filter(s => s.status === 'warning');
  const changes: Omit<DesignChange, 'id' | 'timestamp'>[] = [];

  sensors.forEach(sensor => {
    if (sensor.type === 'strain' && sensor.value > sensor.maxThreshold) {
      changes.push({
        projectId,
        type: 'sensor',
        description: `Increase reinforcement due to high strain reading (${sensor.value} ${sensor.unit})`,
        impact: 'high',
        parameters: {
          before: { reinforcement: 85, safetyFactor: 1.5 },
          after: { reinforcement: 92, safetyFactor: 1.8 }
        },
        approved: null
      });
    }
    if (sensor.type === 'temperature' && sensor.value > 30) {
      changes.push({
        projectId,
        type: 'sensor',
        description: `Adjust concrete mix for high temperature (${sensor.value}°C)`,
        impact: 'medium',
        parameters: {
          before: { waterContent: 180, curingTime: 72 },
          after: { waterContent: 165, curingTime: 96 }
        },
        approved: null
      });
    }
    if (sensor.type === 'vibration' && sensor.value > sensor.maxThreshold) {
      changes.push({
        projectId,
        type: 'sensor',
        description: `Add vibration dampening due to excessive vibration (${sensor.value} ${sensor.unit})`,
        impact: 'medium',
        parameters: {
          before: { damping: 0.5, isolation: 70 },
          after: { damping: 0.8, isolation: 85 }
        },
        approved: null
      });
    }
  });

  return changes;
};

const efficiencyData = [
  { time: '08:00', before: 78, after: 82 },
  { time: '10:00', before: 80, after: 85 },
  { time: '12:00', before: 82, after: 88 },
  { time: '14:00', before: 81, after: 90 },
  { time: '16:00', before: 83, after: 92 },
  { time: '18:00', before: 85, after: 94 },
];

const getTypeIcon = (type: DesignChange['type']) => {
  switch (type) {
    case 'sensor': return <Activity className="w-4 h-4" />;
    case 'weather': return <RefreshCw className="w-4 h-4" />;
    case 'ai': return <Zap className="w-4 h-4" />;
    case 'manual': return <Target className="w-4 h-4" />;
  }
};

const getTypeColor = (type: DesignChange['type']) => {
  switch (type) {
    case 'sensor': return 'bg-blue-500';
    case 'weather': return 'bg-cyan-500';
    case 'ai': return 'bg-amber-500';
    case 'manual': return 'bg-purple-500';
  }
};

const getImpactColor = (impact: DesignChange['impact']) => {
  switch (impact) {
    case 'low': return 'text-green-500';
    case 'medium': return 'text-amber-500';
    case 'high': return 'text-red-500';
  }
};

export default function AdaptiveDesign() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [autoRecalibrate, setAutoRecalibrate] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<DesignChange[]>([]);
  const [approvedChanges, setApprovedChanges] = useState<DesignChange[]>([]);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [efficiencyGain, setEfficiencyGain] = useState(12.5);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (autoRecalibrate) {
        checkForAutoChanges();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRecalibrate, selectedProject]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProject) {
      const allChanges = changeStore.getByProject(selectedProject);
      setPendingChanges(allChanges.filter(c => c.approved === null));
      setApprovedChanges(allChanges.filter(c => c.approved === true));
      
      // Calculate efficiency gain based on approved changes
      const gain = Math.min(25, approvedChanges.length * 2.5);
      setEfficiencyGain(gain);
    }
  }, [selectedProject, approvedChanges.length]);

  const loadData = () => {
    setProjects(projectStore.getAll());
  };

  const checkForAutoChanges = () => {
    if (!selectedProject) return;
    
    const autoChanges = generateAutoChanges(selectedProject);
    autoChanges.forEach(change => {
      // Check if similar change already exists
      const exists = pendingChanges.some(c => 
        c.description === change.description && c.approved === null
      );
      if (!exists) {
        changeStore.create(change);
      }
    });
    
    // Reload changes
    const allChanges = changeStore.getByProject(selectedProject);
    setPendingChanges(allChanges.filter(c => c.approved === null));
  };

  const handleApprove = (changeId: string) => {
    const change = changeStore.approve(changeId, 'Administrator');
    if (change) {
      const allChanges = changeStore.getByProject(selectedProject);
      setPendingChanges(allChanges.filter(c => c.approved === null));
      setApprovedChanges(allChanges.filter(c => c.approved === true));
      
      // Apply the change to project parameters (in a real app, this would modify actual design params)
      toast.success('Change approved and applied to design');
    }
  };

  const handleReject = (changeId: string) => {
    changeStore.reject(changeId);
    const allChanges = changeStore.getByProject(selectedProject);
    setPendingChanges(allChanges.filter(c => c.approved === null));
    toast.info('Change rejected');
  };

  const handleRecalibrate = () => {
    setIsRecalibrating(true);
    
    // Generate new changes based on current conditions
    setTimeout(() => {
      checkForAutoChanges();
      setIsRecalibrating(false);
      toast.success('Design recalibrated successfully');
    }, 2000);
  };

  const handleManualChange = () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }
    
    changeStore.create({
      projectId: selectedProject,
      type: 'manual',
      description: 'Manual design adjustment requested by project manager',
      impact: 'medium',
      parameters: {
        before: { columnSpacing: 8, beamDepth: 0.4 },
        after: { columnSpacing: 7.5, beamDepth: 0.45 }
      },
      approved: null
    });
    
    const allChanges = changeStore.getByProject(selectedProject);
    setPendingChanges(allChanges.filter(c => c.approved === null));
  };

  const filteredPending = pendingChanges.filter(c => 
    filterType === 'all' || c.type === filterType
  );

  const filteredApproved = approvedChanges.filter(c => 
    filterType === 'all' || c.type === filterType
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Adaptive Design Recalibration
          </h2>
          <p className="text-muted-foreground">
            Real-time design adjustments based on sensor data and site conditions
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <Target className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRecalibrate}
            disabled={isRecalibrating}
          >
            {isRecalibrating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Recalibrate
          </Button>
          <Button size="sm" onClick={handleManualChange}>
            <Save className="w-4 h-4 mr-2" />
            Add Change
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Changes</p>
                <p className="text-2xl font-bold">{pendingChanges.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-500">{approvedChanges.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Gain</p>
                <p className="text-2xl font-bold text-primary">+{efficiencyGain.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Mode</p>
                <p className="text-2xl font-bold">{autoRecalibrate ? 'ON' : 'OFF'}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Switch 
                  checked={autoRecalibrate} 
                  onCheckedChange={setAutoRecalibrate}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="pending">
              Pending
              {pendingChanges.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {pendingChanges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sensor">Sensor</SelectItem>
              <SelectItem value="weather">Weather</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="pending" className="space-y-4">
          {filteredPending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending changes to review</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredPending.map((change) => (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className={`p-3 rounded-lg ${getTypeColor(change.type)} bg-opacity-20`}>
                          {getTypeIcon(change.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{change.description}</h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(change.timestamp).toLocaleString()} • 
                                <span className={`ml-1 ${getImpactColor(change.impact)}`}>
                                  {change.impact.toUpperCase()} IMPACT
                                </span>
                              </p>
                            </div>
                            <Badge variant="outline">{change.type.toUpperCase()}</Badge>
                          </div>

                          {/* Parameter Changes */}
                          <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-lg bg-muted/50">
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Before</p>
                              {Object.entries(change.parameters.before).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground capitalize">{key}:</span>
                                  <span>{value}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">After</p>
                              {Object.entries(change.parameters.after).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground capitalize">{key}:</span>
                                  <span className="text-green-500 font-medium">{value}</span>
                                  <ArrowRight className="w-3 h-3 text-green-500" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex lg:flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleApprove(change.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReject(change.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approved Changes History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredApproved.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No approved changes yet</p>
                  </div>
                ) : (
                  filteredApproved.map((change) => (
                    <div 
                      key={change.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getTypeColor(change.type)} bg-opacity-20`}>
                          {getTypeIcon(change.type)}
                        </div>
                        <div>
                          <p className="font-medium">{change.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Approved by {change.approvedBy} on {change.approvedAt ? new Date(change.approvedAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Efficiency Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={efficiencyData}>
                      <defs>
                        <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 16, 20, 0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="before" 
                        stroke="#6b7280" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Before Recalibration"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="after" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorAfter)" 
                        strokeWidth={2}
                        name="After Recalibration"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Source Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'sensor', label: 'Sensor Data', count: approvedChanges.filter(c => c.type === 'sensor').length, color: 'bg-blue-500' },
                    { type: 'weather', label: 'Weather Updates', count: approvedChanges.filter(c => c.type === 'weather').length, color: 'bg-cyan-500' },
                    { type: 'ai', label: 'AI Optimization', count: approvedChanges.filter(c => c.type === 'ai').length, color: 'bg-amber-500' },
                    { type: 'manual', label: 'Manual Input', count: approvedChanges.filter(c => c.type === 'manual').length, color: 'bg-purple-500' },
                  ].map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${Math.max(5, (item.count / Math.max(1, approvedChanges.length)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-sm">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable auto-approval for low-impact sensor-based changes to improve response time by 40%.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
