import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Box, 
  Activity, 
  Cpu, 
  TrendingUp, 
  Settings, 
  Bell, 
  Menu,
  X,
  Zap,
  FileText,
  Download,
  Upload,
  Trash2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Dashboard from '@/sections/Dashboard';
import GenerativeDesign from '@/sections/GenerativeDesign';
import SensorIntegration from '@/sections/SensorIntegration';
import PredictiveSimulations from '@/sections/PredictiveSimulations';
import AdaptiveDesign from '@/sections/AdaptiveDesign';
import CostAnalytics from '@/sections/CostAnalytics';
import ProjectManagement from '@/sections/ProjectManagement';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  initializeDefaultData, 
  settingsStore, 
  exportAllData, 
  importAllData, 
  clearAllData,
  changeStore,
  type UserSettings 
} from '@/lib/store';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'generative-design', label: 'Generative Design', icon: Box, badge: 'AI' },
  { id: 'sensor-integration', label: 'Sensor Integration', icon: Activity, badge: 'LIVE' },
  { id: 'predictive-simulations', label: 'Predictive Simulations', icon: Cpu },
  { id: 'adaptive-design', label: 'Adaptive Design', icon: Zap },
  { id: 'cost-analytics', label: 'Cost & Productivity', icon: TrendingUp },
  { id: 'projects', label: 'Project Management', icon: FileText },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(settingsStore.get());
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');

  // Initialize data on mount
  useEffect(() => {
    initializeDefaultData();
    updateNotificationCount();
    
    // Set up interval for notification updates
    const interval = setInterval(updateNotificationCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateNotificationCount = () => {
    const pendingChanges = changeStore.getPending().length;
    setNotifications(pendingChanges);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cretech-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleImport = () => {
    if (!importData.trim()) {
      toast.error('Please paste data to import');
      return;
    }
    if (importAllData(importData)) {
      setImportDialogOpen(false);
      setImportData('');
      window.location.reload();
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleSaveSettings = () => {
    settingsStore.update(settings);
    setSettingsOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'generative-design':
        return <GenerativeDesign />;
      case 'sensor-integration':
        return <SensorIntegration />;
      case 'predictive-simulations':
        return <PredictiveSimulations />;
      case 'adaptive-design':
        return <AdaptiveDesign />;
      case 'cost-analytics':
        return <CostAnalytics />;
      case 'projects':
        return <ProjectManagement />;
      default:
        return <Dashboard />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center">
          <img src="public/logo.png" alt="LOGO" className='h-[150%] w-full object-cover rounded-lg'/>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">Intelli-Build</span>
          <span className="text-xs text-muted-foreground">Live Construction Optimization</span>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badge === 'LIVE' ? 'destructive' : 'secondary'}
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="bg-border/50" />

      {/* Bottom Section */}
      <div className="p-4 space-y-3">
        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">System Online</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {settings.companyName}
          </div>
        </div>

        <button 
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block border-r border-border/50 overflow-hidden"
      >
        <div className="w-[260px] h-full">
          <SidebarContent />
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0 bg-background">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="lg:hidden w-8" />
            <h1 className="text-lg font-semibold capitalize hidden sm:block">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setActiveTab('adaptive-design')}
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                  {notifications}
                </span>
              )}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-medium text-black">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium">Administrator</div>
                <div className="text-xs text-muted-foreground">System Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 lg:p-6"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Settings
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="data">Data Management</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input 
                  value={settings.companyName}
                  onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Refresh</Label>
                  <p className="text-xs text-muted-foreground">Automatically refresh sensor data</p>
                </div>
                <Switch 
                  checked={settings.autoRefresh}
                  onCheckedChange={(v) => setSettings({...settings, autoRefresh: v})}
                />
              </div>
              <div className="space-y-2">
                <Label>Refresh Interval (ms)</Label>
                <Input 
                  type="number"
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
                  min={1000}
                  step={1000}
                />
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="space-y-2">
                <Label>Sensor Warning Threshold (%)</Label>
                <Input 
                  type="number"
                  value={settings.alertThresholds.sensorWarning}
                  onChange={(e) => setSettings({
                    ...settings, 
                    alertThresholds: {...settings.alertThresholds, sensorWarning: parseInt(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Warning Threshold (%)</Label>
                <Input 
                  type="number"
                  value={settings.alertThresholds.budgetWarning}
                  onChange={(e) => setSettings({
                    ...settings, 
                    alertThresholds: {...settings.alertThresholds, budgetWarning: parseInt(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delay Warning Threshold (days)</Label>
                <Input 
                  type="number"
                  value={settings.alertThresholds.delayWarning}
                  onChange={(e) => setSettings({
                    ...settings, 
                    alertThresholds: {...settings.alertThresholds, delayWarning: parseInt(e.target.value)}
                  })}
                />
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleExport} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
              <Button variant="destructive" onClick={handleClearData} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Paste your exported JSON data below. This will replace all current data.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full h-48 p-3 rounded-md border border-input bg-background font-mono text-xs"
            placeholder="Paste JSON data here..."
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
