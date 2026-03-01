import { useEffect, useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Box,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  IndianRupee as RupeeSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  projectStore, 
  sensorStore, 
  changeStore, 
  costStore,
  settingsStore,
  type Project,
  type Sensor 
} from '@/lib/store';

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'error' | 'info';
  message: string;
  time: string;
  source: string;
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalSavings: 0,
    efficiency: 0,
    activeProjects: 0,
    completedProjects: 0
  });
  const [performanceData] = useState([
    { time: '00:00', efficiency: 78, productivity: 72 },
    { time: '04:00', efficiency: 82, productivity: 75 },
    { time: '08:00', efficiency: 88, productivity: 85 },
    { time: '12:00', efficiency: 92, productivity: 90 },
    { time: '16:00', efficiency: 89, productivity: 88 },
    { time: '20:00', efficiency: 85, productivity: 82 },
    { time: '23:59', efficiency: 87, productivity: 84 },
  ]);

  const settings = settingsStore.get();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, settings.refreshInterval);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const allProjects = projectStore.getAll();
    const allSensors = sensorStore.getAll();
    const pendingChanges = changeStore.getPending();
    costStore.getAll();

    setProjects(allProjects);
    setSensors(allSensors);

    // Calculate stats
    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = allProjects.reduce((sum, p) => sum + p.spent, 0);
    const activeProjects = allProjects.filter(p => p.status === 'in-progress').length;
    const completedProjects = allProjects.filter(p => p.status === 'completed').length;
    
    // Calculate savings (difference between budget and actual with 10% efficiency gain)
    const totalSavings = Math.max(0, totalBudget * 0.128);
    
    // Calculate overall efficiency
    const avgProgress = allProjects.length > 0 
      ? allProjects.reduce((sum, p) => sum + p.progress, 0) / allProjects.length 
      : 0;
    const efficiency = Math.round(avgProgress * 0.95 + 10);

    setStats({
      totalBudget,
      totalSpent,
      totalSavings,
      efficiency,
      activeProjects,
      completedProjects
    });

    // Generate alerts
    const newAlerts: Alert[] = [];
    
    // Budget alerts
    allProjects.forEach(p => {
      const usagePercent = (p.spent / p.budget) * 100;
      if (usagePercent > settings.alertThresholds.budgetWarning) {
        newAlerts.push({
          id: `budget-${p.id}`,
          type: 'warning',
          message: `${p.name} budget at ${usagePercent.toFixed(1)}%`,
          time: 'Just now',
          source: 'Budget Monitor'
        });
      }
    });

    // Sensor alerts
    allSensors.filter(s => s.status === 'warning' || s.status === 'error').forEach(s => {
      newAlerts.push({
        id: `sensor-${s.id}`,
        type: s.status === 'error' ? 'error' : 'warning',
        message: `${s.name}: ${s.value} ${s.unit}`,
        time: new Date(s.lastUpdate).toLocaleTimeString(),
        source: 'Sensor Network'
      });
    });

    // Pending changes alerts
    if (pendingChanges.length > 0) {
      newAlerts.push({
        id: 'changes-pending',
        type: 'info',
        message: `${pendingChanges.length} design changes pending approval`,
        time: 'Just now',
        source: 'Design System'
      });
    }

    setAlerts(newAlerts.slice(0, 5));
  };

  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    const symbol = symbols[settings.currency] || '$';
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}k`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  };

  const statCards = [
    {
      title: 'Overall Efficiency',
      value: `${stats.efficiency}%`,
      change: '+5.2%',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-green-500'
    },
    {
      title: 'Total Savings',
      value: formatCurrency(stats.totalSavings),
      change: '+12.8%',
      trend: 'up' as const,
      icon: RupeeSign,
      color: 'text-amber-500'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects.toString(),
      change: `${stats.completedProjects} completed`,
      trend: 'up' as const,
      icon: Box,
      color: 'text-blue-500'
    },
    {
      title: 'Budget Used',
      value: formatCurrency(stats.totalSpent),
      change: `${((stats.totalSpent / stats.totalBudget) * 100).toFixed(1)}% of total`,
      trend: 'down' as const,
      icon: TrendingUp,
      color: 'text-purple-500'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-muted-foreground">
            Here's what's happening across your construction sites today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Live Monitoring
          </Badge>
          <span className="text-sm text-muted-foreground">
            {currentTime.toLocaleTimeString()}
          </span>
          <Button variant="ghost" size="icon" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-sm text-green-500">{stat.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Real-time Performance Metrics</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Efficiency</Badge>
                <Badge variant="outline" className="text-xs">Productivity</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                    <Area 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#f59e0b" 
                      fillOpacity={1} 
                      fill="url(#colorEfficiency)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorProductivity)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Alerts */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Active Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>All systems normal</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {alert.type === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    {alert.type === 'error' && (
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    {alert.type === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    )}
                    {alert.type === 'info' && (
                      <Activity className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.source} • {alert.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Project Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.slice(0, 4).map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <Badge 
                      variant={project.status === 'completed' ? 'default' : project.status === 'on-hold' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={project.progress} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-10 text-right">{project.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Budget: {formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
                    <span>{((project.spent / project.budget) * 100).toFixed(1)}% used</span>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No projects yet</p>
                  <p className="text-sm">Create a project to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Sensor Status */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Live Sensor Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {sensors.filter(s => s.isActive).slice(0, 4).map((sensor) => (
                  <div 
                    key={sensor.id} 
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground truncate">{sensor.name}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        sensor.status === 'online' ? 'bg-green-500' : 
                        sensor.status === 'warning' ? 'bg-amber-500 animate-pulse' : 
                        'bg-red-500'
                      }`} />
                    </div>
                    <div className="text-lg font-bold">{sensor.value.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">{sensor.unit}</div>
                  </div>
                ))}
              </div>
              {sensors.filter(s => s.isActive).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active sensors</p>
                  <p className="text-sm">Add sensors in the Sensor Integration page</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
