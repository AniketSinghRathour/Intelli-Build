import { useState, useEffect } from 'react';
import { 
  Activity, 
  Thermometer, 
  Wind, 
  Waves,
  Weight,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  sensorStore, 
  settingsStore,
  type Sensor 
} from '@/lib/store';

const getSensorIcon = (type: Sensor['type']) => {
  switch (type) {
    case 'strain': return <Weight className="w-4 h-4" />;
    case 'temperature': return <Thermometer className="w-4 h-4" />;
    case 'vibration': return <Waves className="w-4 h-4" />;
    case 'load': return <Weight className="w-4 h-4" />;
    case 'environmental': return <Wind className="w-4 h-4" />;
    case 'pressure': return <Activity className="w-4 h-4" />;
    case 'humidity': return <Wind className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getStatusColor = (status: Sensor['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'warning': return 'bg-amber-500';
    case 'error': return 'bg-red-500';
    case 'offline': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getTrendIcon = (current: number, previous: number) => {
  const diff = current - previous;
  if (diff > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (diff < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
};

export default function SensorIntegration() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  const settings = settingsStore.get();

  // New sensor form
  const [newSensor, setNewSensor] = useState({
    name: '',
    type: 'temperature' as Sensor['type'],
    location: '',
    unit: '°C',
    minThreshold: 0,
    maxThreshold: 100,
    value: 0
  });

  useEffect(() => {
    loadSensors();
    return () => {
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(simulateSensorUpdates, settings.refreshInterval);
      setSimulationInterval(interval);
    } else {
      if (simulationInterval) clearInterval(simulationInterval);
    }
    return () => {
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, [autoRefresh, sensors]);

  const loadSensors = () => {
    setSensors(sensorStore.getAll());
  };

  const simulateSensorUpdates = () => {
    const allSensors = sensorStore.getAll();
    allSensors.filter(s => s.isActive).forEach(sensor => {
      // Simulate realistic value changes
      const variance = sensor.value * 0.02;
      const change = (Math.random() - 0.5) * variance;
      const newValue = Math.max(0, sensor.value + change);
      sensorStore.updateValue(sensor.id, Number(newValue.toFixed(2)));
    });
    setSensors(sensorStore.getAll());
  };

  const handleAddSensor = () => {
    if (!newSensor.name || !newSensor.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    sensorStore.create({
      name: newSensor.name,
      type: newSensor.type,
      location: newSensor.location,
      status: 'online',
      value: newSensor.value,
      unit: newSensor.unit,
      minThreshold: newSensor.minThreshold,
      maxThreshold: newSensor.maxThreshold,
      isActive: true
    });

    setIsAddDialogOpen(false);
    setNewSensor({
      name: '',
      type: 'temperature',
      location: '',
      unit: '°C',
      minThreshold: 0,
      maxThreshold: 100,
      value: 0
    });
    loadSensors();
  };

  const handleDeleteSensor = (id: string) => {
    if (confirm('Are you sure you want to remove this sensor?')) {
      sensorStore.delete(id);
      if (selectedSensor?.id === id) setSelectedSensor(null);
      loadSensors();
    }
  };

  const handleToggleSensor = (id: string) => {
    const sensor = sensors.find(s => s.id === id);
    if (sensor) {
      sensorStore.update(id, { isActive: !sensor.isActive });
      loadSensors();
    }
  };

  const handleExport = () => {
    const data = sensorStore.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Sensor data exported successfully');
  };

  const filteredSensors = sensors.filter(sensor => {
    const matchesStatus = filterStatus === 'all' || sensor.status === filterStatus;
    const matchesType = filterType === 'all' || sensor.type === filterType;
    return matchesStatus && matchesType;
  });

  const onlineCount = sensors.filter(s => s.status === 'online' && s.isActive).length;
  const warningCount = sensors.filter(s => s.status === 'warning' && s.isActive).length;
  const errorCount = sensors.filter(s => s.status === 'error' && s.isActive).length;
  sensors.filter(s => s.status === 'offline' || !s.isActive).length;

  // Calculate average values for summary
  const _avgValues = sensors
    .filter(s => s.isActive)
    .reduce((acc, s) => {
      acc[s.type] = acc[s.type] || { sum: 0, count: 0 };
      acc[s.type].sum += s.value;
      acc[s.type].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);
  void _avgValues;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Real-time Sensor Integration
          </h2>
          <p className="text-muted-foreground">
            Monitor and analyze live sensor data from construction sites
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-500">{onlineCount}</p>
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
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-amber-500">{warningCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-500">{errorCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sensors</p>
                <p className="text-2xl font-bold">{sensors.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <Settings className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="strain">Strain</SelectItem>
            <SelectItem value="temperature">Temperature</SelectItem>
            <SelectItem value="vibration">Vibration</SelectItem>
            <SelectItem value="load">Load</SelectItem>
            <SelectItem value="environmental">Environmental</SelectItem>
            <SelectItem value="pressure">Pressure</SelectItem>
            <SelectItem value="humidity">Humidity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Active Sensors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-auto">
            {filteredSensors.map((sensor) => (
              <motion.div
                key={sensor.id}
                layoutId={sensor.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSensor?.id === sensor.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${!sensor.isActive ? 'opacity-50' : ''}`}
              >
                <div onClick={() => setSelectedSensor(sensor)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-muted`}>
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{sensor.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {sensor.location}
                        </p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.status)} ${sensor.status === 'warning' ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{sensor.value.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">{sensor.unit}</span>
                    </div>
                    {getTrendIcon(sensor.value, sensor.history[sensor.history.length - 2]?.value || sensor.value)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={sensor.isActive}
                      onCheckedChange={() => handleToggleSensor(sensor.id)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {sensor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleDeleteSensor(sensor.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
            {filteredSensors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sensors found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sensor Detail & Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedSensor ? selectedSensor.name : 'Select a Sensor'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSensor ? (
              <div className="space-y-6">
                {/* Current Reading */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-bold">
                      {selectedSensor.value.toFixed(1)} <span className="text-sm">{selectedSensor.unit}</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Min Threshold</p>
                    <p className="text-2xl font-bold">
                      {selectedSensor.minThreshold} <span className="text-sm">{selectedSensor.unit}</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Max Threshold</p>
                    <p className="text-2xl font-bold">
                      {selectedSensor.maxThreshold} <span className="text-sm">{selectedSensor.unit}</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedSensor.status)}>
                      {selectedSensor.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedSensor.history}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
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
                      <ReferenceLine 
                        y={selectedSensor.maxThreshold} 
                        stroke="#ef4444" 
                        strokeDasharray="3 3"
                        label="Max"
                      />
                      <ReferenceLine 
                        y={selectedSensor.minThreshold} 
                        stroke="#3b82f6" 
                        strokeDasharray="3 3"
                        label="Min"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f59e0b" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Threshold Settings */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-sm">Alert Thresholds</Label>
                    <p className="text-xs text-muted-foreground">
                      Alert when value is outside {selectedSensor.minThreshold} - {selectedSensor.maxThreshold} {selectedSensor.unit}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p>Select a sensor to view detailed data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Sensor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Sensor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sensor Name *</Label>
              <Input 
                placeholder="e.g., Temperature Monitor A1"
                value={newSensor.name}
                onChange={(e) => setNewSensor({...newSensor, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newSensor.type} 
                  onValueChange={(v) => {
                    const units: Record<string, string> = {
                      strain: 'με',
                      temperature: '°C',
                      vibration: 'mm/s',
                      load: 'kg',
                      environmental: 'dB',
                      pressure: 'Pa',
                      humidity: '%'
                    };
                    setNewSensor({...newSensor, type: v as Sensor['type'], unit: units[v] || ''});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strain">Strain</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="vibration">Vibration</SelectItem>
                    <SelectItem value="load">Load</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="pressure">Pressure</SelectItem>
                    <SelectItem value="humidity">Humidity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input 
                  value={newSensor.unit}
                  onChange={(e) => setNewSensor({...newSensor, unit: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input 
                placeholder="e.g., Tower A - Floor 15"
                value={newSensor.location}
                onChange={(e) => setNewSensor({...newSensor, location: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Threshold</Label>
                <Input 
                  type="number"
                  value={newSensor.minThreshold}
                  onChange={(e) => setNewSensor({...newSensor, minThreshold: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Threshold</Label>
                <Input 
                  type="number"
                  value={newSensor.maxThreshold}
                  onChange={(e) => setNewSensor({...newSensor, maxThreshold: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Initial Value</Label>
              <Input 
                type="number"
                value={newSensor.value}
                onChange={(e) => setNewSensor({...newSensor, value: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSensor}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sensor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
