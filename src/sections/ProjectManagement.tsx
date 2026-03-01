import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  Edit,
  Trash2,
  FolderOpen,
  DollarSign,
  IndianRupee as RupeeSign,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  projectStore, 
  teamStore, 
  costStore,
  settingsStore,
  type Project,
  type TeamMember 
} from '@/lib/store';

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddCostDialogOpen, setIsAddCostDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newCost, setNewCost] = useState({ category: 'materials', description: '', amount: 0 });
  
  const settings = settingsStore.get();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    startDate: '',
    endDate: '',
    budget: 0,
    priority: 'medium' as Project['priority'],
    team: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProjects(projectStore.getAll());
    setTeamMembers(teamStore.getAll());
  };

  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    const symbol = symbols[settings.currency] || '$';
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}k`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    projectStore.create({
      name: formData.name,
      description: formData.description,
      status: formData.status,
      progress: 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      team: formData.team,
      budget: formData.budget,
      spent: 0,
      priority: formData.priority
    });

    setIsCreateDialogOpen(false);
    resetForm();
    loadData();
  };

  const handleUpdateProject = () => {
    if (!selectedProject) return;
    
    projectStore.update(selectedProject.id, {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: formData.budget,
      priority: formData.priority,
      team: formData.team
    });

    setIsEditDialogOpen(false);
    setSelectedProject(null);
    resetForm();
    loadData();
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project? All associated data will be removed.')) {
      projectStore.delete(id);
      loadData();
    }
  };

  const handleAddCost = () => {
    if (!selectedProject || !newCost.description || newCost.amount <= 0) {
      toast.error('Please fill in all cost details');
      return;
    }

    costStore.create({
      projectId: selectedProject.id,
      category: newCost.category as 'labor' | 'materials' | 'equipment' | 'overhead' | 'other',
      description: newCost.description,
      amount: newCost.amount,
      date: new Date().toISOString().split('T')[0],
      createdBy: 'Administrator'
    });

    setIsAddCostDialogOpen(false);
    setNewCost({ category: 'materials', description: '', amount: 0 });
    loadData();
  };

  const handleProgressUpdate = (project: Project, change: number) => {
    const newProgress = Math.min(100, Math.max(0, project.progress + change));
    const status = newProgress === 100 ? 'completed' : 
                   newProgress > 0 && project.status === 'planning' ? 'in-progress' : 
                   project.status;
    
    projectStore.update(project.id, { progress: newProgress, status });
    loadData();
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      priority: project.priority,
      team: project.team
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (project: Project) => {
    setSelectedProject(project);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: 0,
      priority: 'medium',
      team: []
    });
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'bg-blue-500';
      case 'in-progress': return 'bg-amber-500';
      case 'completed': return 'bg-green-500';
      case 'on-hold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const projectCosts = selectedProject ? costStore.getByProject(selectedProject.id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Project Management
          </h2>
          <p className="text-muted-foreground">
            Manage projects, teams, and track progress across all sites
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const data = JSON.stringify(projects, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `projects-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success('Projects exported');
          }}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-amber-500">
                  {projects.filter(p => p.status === 'in-progress').length}
                </p>
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
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-500">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
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
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-blue-500">
                  {formatCurrency(projects.reduce((sum, p) => sum + p.budget, 0))}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <RupeeSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="cursor-pointer" onClick={() => openViewDialog(project)}>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium hover:text-primary transition-colors">{project.name}</h4>
                            <Badge 
                              variant={project.priority === 'high' ? 'destructive' : 'secondary'}
                              className="text-[10px]"
                            >
                              {project.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{project.description}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(project)}>
                              <ArrowUpRight className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(project)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedProject(project);
                              setIsAddCostDialogOpen(true);
                            }}>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Add Cost
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5"
                                onClick={() => handleProgressUpdate(project, -5)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <span className="text-xs font-medium">{project.progress}%</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5"
                                onClick={() => handleProgressUpdate(project, 5)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {project.startDate} → {project.endDate}
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex -space-x-2">
                            {project.team.slice(0, 3).map((memberId, i) => {
                              const member = teamMembers.find(m => m.id === memberId);
                              return (
                                <Avatar key={i} className="w-7 h-7 border-2 border-background">
                                  <AvatarFallback className="text-[10px] bg-primary/20">
                                    {member?.avatar || '?'}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })}
                            {project.team.length > 3 && (
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                                +{project.team.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">Create a new project to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/20 text-lg">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FolderOpen className="w-3 h-3" />
                      {projects.filter(p => p.team.includes(member.id)).length} projects
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : '₹'}
                      {member.hourlyRate}/hr
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input 
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input 
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input 
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget ({settings.currency})</Label>
              <Input 
                type="number"
                placeholder="Enter budget"
                value={formData.budget || ''}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v as Project['status']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v) => setFormData({...formData, priority: v as Project['priority']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-auto">
                {teamMembers.map(member => (
                  <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.team.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, team: [...formData.team, member.id]});
                        } else {
                          setFormData({...formData, team: formData.team.filter(id => id !== member.id)});
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{member.name} ({member.role})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input 
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input 
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget ({settings.currency})</Label>
              <Input 
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v as Project['status']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v) => setFormData({...formData, priority: v as Project['priority']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedProject(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject}>
              <Edit className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedProject.budget)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedProject.spent)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Progress</p>
                <Progress value={selectedProject.progress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">{selectedProject.progress}% complete</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p>{selectedProject.startDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p>{selectedProject.endDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge>{selectedProject.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <Badge variant={selectedProject.priority === 'high' ? 'destructive' : 'secondary'}>
                    {selectedProject.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Team Members</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.team.map(memberId => {
                    const member = teamMembers.find(m => m.id === memberId);
                    return member ? (
                      <div key={memberId} className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px]">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {projectCosts.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recent Costs</p>
                  <div className="space-y-2">
                    {projectCosts.slice(-5).map(cost => (
                      <div key={cost.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm">{cost.description}</p>
                          <p className="text-xs text-muted-foreground">{cost.category} • {cost.date}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(cost.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                onValueChange={(v) => setNewCost({...newCost, category: v})}
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
            <Button variant="outline" onClick={() => {
              setIsAddCostDialogOpen(false);
              setNewCost({ category: 'materials', description: '', amount: 0 });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddCost}>
              <DollarSign className="w-4 h-4 mr-2" />
              Add Cost
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
