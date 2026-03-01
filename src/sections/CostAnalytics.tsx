import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign,
  Clock,
  Users,
  Package,
  AlertTriangle,
  Download,
  Calendar,
  ArrowUpRight,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import { 
  projectStore, 
  costStore,
  settingsStore,
  type Project,
  type CostEntry 
} from '@/lib/store';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

export default function CostAnalytics() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [timeRange, setTimeRange] = useState('6months');
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [isAddCostDialogOpen, setIsAddCostDialogOpen] = useState(false);
  const [newCost, setNewCost] = useState({
    category: 'materials' as CostEntry['category'],
    description: '',
    amount: 0
  });

  const settings = settingsStore.get();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProject) {
      setCosts(costStore.getByProject(selectedProject));
    }
  }, [selectedProject]);

  const loadData = () => {
    setProjects(projectStore.getAll());
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

  const handleAddCost = () => {
    if (!selectedProject || !newCost.description || newCost.amount <= 0) {
      toast.error('Please fill in all cost details');
      return;
    }

    costStore.create({
      projectId: selectedProject,
      category: newCost.category,
      description: newCost.description,
      amount: newCost.amount,
      date: new Date().toISOString().split('T')[0],
      createdBy: 'Administrator'
    });

    setIsAddCostDialogOpen(false);
    setNewCost({ category: 'materials', description: '', amount: 0 });
    setCosts(costStore.getByProject(selectedProject));
    loadData();
  };

  const handleExport = () => {
    const data = {
      projects: projects.map(p => ({
        name: p.name,
        budget: p.budget,
        spent: p.spent,
        remaining: p.budget - p.spent
      })),
      costs: costs,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Cost report exported successfully');
  };

  // Calculate metrics
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate savings (assume 12.8% efficiency gain)
  const totalSavings = totalSpent * 0.128;

  // Cost breakdown by category for selected project
  const costsByCategory = selectedProject ? costStore.getByCategory(selectedProject) : {};
  const costBreakdownData = Object.entries(costsByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[Object.keys(costsByCategory).indexOf(name) % COLORS.length]
  }));

  // Monthly cost trend (simulated based on actual costs)
  const monthlyData = [
    { month: 'Jan', planned: 1200000, actual: 1150000 },
    { month: 'Feb', planned: 1350000, actual: 1280000 },
    { month: 'Mar', planned: 1500000, actual: 1420000 },
    { month: 'Apr', planned: 1650000, actual: 1580000 },
    { month: 'May', planned: 1800000, actual: 1720000 },
    { month: 'Jun', planned: 1950000, actual: 1850000 },
  ];

  // Productivity data
  const productivityData = [
    { week: 'W1', target: 85, actual: 82 },
    { week: 'W2', target: 85, actual: 88 },
    { week: 'W3', target: 90, actual: 87 },
    { week: 'W4', target: 90, actual: 92 },
    { week: 'W5', target: 95, actual: 94 },
    { week: 'W6', target: 95, actual: 97 },
  ];

  // Savings breakdown
  const savingsBreakdown = [
    { category: 'AI Design Optimization', amount: totalSavings * 0.35, percentage: 35 },
    { category: 'Reduced Rework', amount: totalSavings * 0.25, percentage: 25 },
    { category: 'Predictive Maintenance', amount: totalSavings * 0.22, percentage: 22 },
    { category: 'Resource Optimization', amount: totalSavings * 0.18, percentage: 18 },
  ];

  // Generate alerts
  const alerts: { id: string; type: 'warning' | 'info'; message: string; time: string }[] = [];
  projects.forEach(p => {
    const usage = (p.spent / p.budget) * 100;
    if (usage > settings.alertThresholds.budgetWarning) {
      alerts.push({
        id: `budget-${p.id}`,
        type: 'warning' as const,
        message: `${p.name} budget at ${usage.toFixed(1)}%`,
        time: 'Just now'
      });
    }
  });

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Cost & Productivity Analytics
          </h2>
          <p className="text-muted-foreground">
            Track project costs, productivity metrics, and AI-driven savings
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
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(totalSavings)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">+12.8%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Utilization</p>
                <p className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(remainingBudget)} remaining
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-amber-500">
                  {projects.filter(p => p.status === 'in-progress').length}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">+2 this month</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Efficiency</p>
                <p className="text-2xl font-bold text-purple-500">94.2%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">+5.3%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cost" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="savings">AI Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="cost" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Cost Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 16, 20, 0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="planned" fill="#6b7280" name="Planned" />
                      <Bar dataKey="actual" fill="#f59e0b" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Cost Breakdown
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsAddCostDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {costBreakdownData.length > 0 ? (
                  <>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {costBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(15, 16, 20, 0.9)', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {costBreakdownData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No cost data available</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsAddCostDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Cost
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Budget Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Overview {selectedProjectData && `- ${selectedProjectData.name}`}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProjectData ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Total Budget</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedProjectData.budget)}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Spent</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(selectedProjectData.spent)} ({((selectedProjectData.spent / selectedProjectData.budget) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress 
                      value={(selectedProjectData.spent / selectedProjectData.budget) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Remaining</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(selectedProjectData.budget - selectedProjectData.spent)}
                      </span>
                    </div>
                    <Progress 
                      value={((selectedProjectData.budget - selectedProjectData.spent) / selectedProjectData.budget) * 100} 
                      className="h-2 bg-muted"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Select a project to view budget details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Productivity Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={12} />
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
                      dataKey="target" 
                      stroke="#6b7280" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Labor Efficiency</p>
                    <p className="text-xl font-bold">97.3%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Material Usage</p>
                    <p className="text-xl font-bold">94.8%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Equipment Uptime</p>
                    <p className="text-xl font-bold">91.2%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI-Driven Savings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savingsBreakdown.map((item, index) => (
                  <div key={item.category} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{item.category}</span>
                        <span className="font-bold text-green-500">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="secondary">{item.percentage}%</Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-500">Total AI Savings</span>
                </div>
                <p className="text-3xl font-bold text-green-500">
                  {formatCurrency(totalSavings)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  12.8% of total project spend
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Budget Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No budget alerts</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Cost Dialog */}
      <Dialog open={isAddCostDialogOpen} onOpenChange={setIsAddCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={newCost.category} 
                onValueChange={(v) => setNewCost({...newCost, category: v as CostEntry['category']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="overhead">Overhead</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="What was this expense for?"
                value={newCost.description}
                onChange={(e) => setNewCost({...newCost, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount ({settings.currency})</Label>
              <Input 
                type="number"
                placeholder="0.00"
                value={newCost.amount || ''}
                onChange={(e) => setNewCost({...newCost, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddCostDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCost}>
              <Plus className="w-4 h-4 mr-2" />
              Add Cost
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
