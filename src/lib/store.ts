// Central data store with localStorage persistence
import { toast } from 'sonner';

// Generic storage helper
const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      toast.error('Failed to save data');
    }
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  }
};

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  startDate: string;
  endDate: string;
  team: string[];
  budget: number;
  spent: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  projects: string[];
  hourlyRate: number;
}

export interface DesignParameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}

export interface GeneratedDesign {
  id: string;
  projectId: string;
  name: string;
  parameters: DesignParameter[];
  efficiency: number;
  costEstimate: number;
  sustainability: number;
  thumbnail: string;
  status: 'generating' | 'completed' | 'selected' | 'rejected';
  createdAt: string;
}

export interface Sensor {
  id: string;
  name: string;
  type: 'strain' | 'temperature' | 'vibration' | 'load' | 'environmental' | 'pressure' | 'humidity';
  location: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  value: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  lastUpdate: string;
  history: { time: string; value: number }[];
  isActive: boolean;
}

export interface DesignChange {
  id: string;
  projectId: string;
  timestamp: string;
  type: 'sensor' | 'weather' | 'manual' | 'ai';
  description: string;
  impact: 'low' | 'medium' | 'high';
  parameters: {
    before: Record<string, number>;
    after: Record<string, number>;
  };
  approved: boolean | null;
  approvedBy?: string;
  approvedAt?: string;
}

export interface CostEntry {
  id: string;
  projectId: string;
  category: 'labor' | 'materials' | 'equipment' | 'overhead' | 'other';
  description: string;
  amount: number;
  date: string;
  createdBy: string;
}

export interface SimulationResult {
  id: string;
  projectId: string;
  scenarioType: 'weather' | 'structural' | 'schedule' | 'cost';
  name: string;
  parameters: Record<string, number>;
  risk: number;
  delay: number;
  costImpact: number;
  recommendations: string[];
  createdAt: string;
}

export interface UserSettings {
  companyName: string;
  currency: string;
  autoRefresh: boolean;
  refreshInterval: number;
  emailNotifications: boolean;
  alertThresholds: {
    sensorWarning: number;
    budgetWarning: number;
    delayWarning: number;
  };
}

// Store keys
const KEYS = {
  PROJECTS: 'cretech_projects',
  TEAM: 'cretech_team',
  DESIGNS: 'cretech_designs',
  SENSORS: 'cretech_sensors',
  CHANGES: 'cretech_changes',
  COSTS: 'cretech_costs',
  SIMULATIONS: 'cretech_simulations',
  SETTINGS: 'cretech_settings'
};

// Project Store
export const projectStore = {
  getAll: (): Project[] => storage.get(KEYS.PROJECTS, []),
  getById: (id: string): Project | undefined => {
    const projects = projectStore.getAll();
    return projects.find(p => p.id === id);
  },
  create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const projects = projectStore.getAll();
    const newProject: Project = {
      ...project,
      id: `proj_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storage.set(KEYS.PROJECTS, [...projects, newProject]);
    toast.success('Project created successfully');
    return newProject;
  },
  update: (id: string, updates: Partial<Project>): Project | null => {
    const projects = projectStore.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    projects[index] = { 
      ...projects[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    storage.set(KEYS.PROJECTS, projects);
    toast.success('Project updated successfully');
    return projects[index];
  },
  delete: (id: string): boolean => {
    const projects = projectStore.getAll();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length === projects.length) return false;
    storage.set(KEYS.PROJECTS, filtered);
    toast.success('Project deleted successfully');
    return true;
  },
  addProgress: (id: string, amount: number): Project | null => {
    const project = projectStore.getById(id);
    if (!project) return null;
    const newProgress = Math.min(100, Math.max(0, project.progress + amount));
    const status = newProgress === 100 ? 'completed' : project.status === 'planning' ? 'in-progress' : project.status;
    return projectStore.update(id, { progress: newProgress, status });
  },
  addExpense: (id: string, amount: number): Project | null => {
    const project = projectStore.getById(id);
    if (!project) return null;
    return projectStore.update(id, { spent: project.spent + amount });
  }
};

// Team Store
export const teamStore = {
  getAll: (): TeamMember[] => storage.get(KEYS.TEAM, []),
  getById: (id: string): TeamMember | undefined => {
    return teamStore.getAll().find(m => m.id === id);
  },
  create: (member: Omit<TeamMember, 'id'>): TeamMember => {
    const members = teamStore.getAll();
    const newMember: TeamMember = {
      ...member,
      id: `member_${Date.now()}`
    };
    storage.set(KEYS.TEAM, [...members, newMember]);
    toast.success('Team member added successfully');
    return newMember;
  },
  update: (id: string, updates: Partial<TeamMember>): TeamMember | null => {
    const members = teamStore.getAll();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return null;
    members[index] = { ...members[index], ...updates };
    storage.set(KEYS.TEAM, members);
    toast.success('Team member updated successfully');
    return members[index];
  },
  delete: (id: string): boolean => {
    const members = teamStore.getAll();
    const filtered = members.filter(m => m.id !== id);
    if (filtered.length === members.length) return false;
    storage.set(KEYS.TEAM, filtered);
    toast.success('Team member removed successfully');
    return true;
  }
};

// Design Store
export const designStore = {
  getAll: (): GeneratedDesign[] => storage.get(KEYS.DESIGNS, []),
  getByProject: (projectId: string): GeneratedDesign[] => {
    return designStore.getAll().filter(d => d.projectId === projectId);
  },
  getById: (id: string): GeneratedDesign | undefined => {
    return designStore.getAll().find(d => d.id === id);
  },
  create: (design: Omit<GeneratedDesign, 'id' | 'createdAt'>): GeneratedDesign => {
    const designs = designStore.getAll();
    const newDesign: GeneratedDesign = {
      ...design,
      id: `design_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    storage.set(KEYS.DESIGNS, [...designs, newDesign]);
    return newDesign;
  },
  update: (id: string, updates: Partial<GeneratedDesign>): GeneratedDesign | null => {
    const designs = designStore.getAll();
    const index = designs.findIndex(d => d.id === id);
    if (index === -1) return null;
    designs[index] = { ...designs[index], ...updates };
    storage.set(KEYS.DESIGNS, designs);
    return designs[index];
  },
  selectDesign: (id: string): void => {
    const designs = designStore.getAll();
    const projectId = designs.find(d => d.id === id)?.projectId;
    if (!projectId) return;
    
    // Unselect all designs for this project
    const updated = designs.map(d => 
      d.projectId === projectId 
        ? { ...d, status: d.id === id ? 'selected' : 'completed' as const }
        : d
    );
    storage.set(KEYS.DESIGNS, updated);
    toast.success('Design selected for project');
  },
  delete: (id: string): boolean => {
    const designs = designStore.getAll();
    const filtered = designs.filter(d => d.id !== id);
    if (filtered.length === designs.length) return false;
    storage.set(KEYS.DESIGNS, filtered);
    toast.success('Design deleted');
    return true;
  },
  deleteByProject: (projectId: string): void => {
    const designs = designStore.getAll().filter(d => d.projectId !== projectId);
    storage.set(KEYS.DESIGNS, designs);
  }
};

// Sensor Store
export const sensorStore = {
  getAll: (): Sensor[] => storage.get(KEYS.SENSORS, []),
  getById: (id: string): Sensor | undefined => {
    return sensorStore.getAll().find(s => s.id === id);
  },
  getActive: (): Sensor[] => {
    return sensorStore.getAll().filter(s => s.isActive);
  },
  create: (sensor: Omit<Sensor, 'id' | 'lastUpdate' | 'history'>): Sensor => {
    const sensors = sensorStore.getAll();
    const now = new Date().toISOString();
    const newSensor: Sensor = {
      ...sensor,
      id: `sensor_${Date.now()}`,
      lastUpdate: now,
      history: Array(24).fill(0).map((_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: sensor.value
      }))
    };
    storage.set(KEYS.SENSORS, [...sensors, newSensor]);
    toast.success('Sensor added successfully');
    return newSensor;
  },
  update: (id: string, updates: Partial<Sensor>): Sensor | null => {
    const sensors = sensorStore.getAll();
    const index = sensors.findIndex(s => s.id === id);
    if (index === -1) return null;
    sensors[index] = { ...sensors[index], ...updates };
    storage.set(KEYS.SENSORS, sensors);
    return sensors[index];
  },
  updateValue: (id: string, value: number): Sensor | null => {
    const sensor = sensorStore.getById(id);
    if (!sensor) return null;
    
    const newHistory = [...sensor.history.slice(1), {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value
    }];
    
    // Determine status based on thresholds
    let status: Sensor['status'] = 'online';
    if (value > sensor.maxThreshold || value < sensor.minThreshold) {
      status = 'warning';
    }
    
    return sensorStore.update(id, { 
      value, 
      history: newHistory, 
      status, 
      lastUpdate: new Date().toISOString() 
    });
  },
  delete: (id: string): boolean => {
    const sensors = sensorStore.getAll();
    const filtered = sensors.filter(s => s.id !== id);
    if (filtered.length === sensors.length) return false;
    storage.set(KEYS.SENSORS, filtered);
    toast.success('Sensor removed');
    return true;
  },
  exportData: (): string => {
    const sensors = sensorStore.getAll();
    return JSON.stringify(sensors, null, 2);
  }
};

// Changes Store
export const changeStore = {
  getAll: (): DesignChange[] => storage.get(KEYS.CHANGES, []),
  getByProject: (projectId: string): DesignChange[] => {
    return changeStore.getAll().filter(c => c.projectId === projectId);
  },
  getPending: (): DesignChange[] => {
    return changeStore.getAll().filter(c => c.approved === null);
  },
  create: (change: Omit<DesignChange, 'id' | 'timestamp'>): DesignChange => {
    const changes = changeStore.getAll();
    const newChange: DesignChange = {
      ...change,
      id: `change_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    storage.set(KEYS.CHANGES, [...changes, newChange]);
    toast.info('New design change pending approval');
    return newChange;
  },
  approve: (id: string, approvedBy: string): DesignChange | null => {
    const changes = changeStore.getAll();
    const index = changes.findIndex(c => c.id === id);
    if (index === -1) return null;
    changes[index] = { 
      ...changes[index], 
      approved: true, 
      approvedBy, 
      approvedAt: new Date().toISOString() 
    };
    storage.set(KEYS.CHANGES, changes);
    toast.success('Change approved and applied');
    return changes[index];
  },
  reject: (id: string): DesignChange | null => {
    const changes = changeStore.getAll();
    const index = changes.findIndex(c => c.id === id);
    if (index === -1) return null;
    changes[index] = { ...changes[index], approved: false };
    storage.set(KEYS.CHANGES, changes);
    toast.info('Change rejected');
    return changes[index];
  },
  delete: (id: string): boolean => {
    const changes = changeStore.getAll();
    const filtered = changes.filter(c => c.id !== id);
    if (filtered.length === changes.length) return false;
    storage.set(KEYS.CHANGES, filtered);
    return true;
  }
};

// Cost Store
export const costStore = {
  getAll: (): CostEntry[] => storage.get(KEYS.COSTS, []),
  getByProject: (projectId: string): CostEntry[] => {
    return costStore.getAll().filter(c => c.projectId === projectId);
  },
  getTotalByProject: (projectId: string): number => {
    return costStore.getByProject(projectId).reduce((sum, c) => sum + c.amount, 0);
  },
  getByCategory: (projectId: string): Record<string, number> => {
    const costs = costStore.getByProject(projectId);
    return costs.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.amount;
      return acc;
    }, {} as Record<string, number>);
  },
  create: (cost: Omit<CostEntry, 'id'>): CostEntry => {
    const costs = costStore.getAll();
    const newCost: CostEntry = {
      ...cost,
      id: `cost_${Date.now()}`
    };
    storage.set(KEYS.COSTS, [...costs, newCost]);
    
    // Update project spent amount
    const total = costStore.getTotalByProject(cost.projectId);
    projectStore.update(cost.projectId, { spent: total });
    
    toast.success('Cost entry added');
    return newCost;
  },
  update: (id: string, updates: Partial<CostEntry>): CostEntry | null => {
    const costs = costStore.getAll();
    const index = costs.findIndex(c => c.id === id);
    if (index === -1) return null;
    costs[index] = { ...costs[index], ...updates };
    storage.set(KEYS.COSTS, costs);
    
    // Recalculate project spent
    const projectId = costs[index].projectId;
    const total = costStore.getTotalByProject(projectId);
    projectStore.update(projectId, { spent: total });
    
    toast.success('Cost entry updated');
    return costs[index];
  },
  delete: (id: string): boolean => {
    const costs = costStore.getAll();
    const cost = costs.find(c => c.id === id);
    if (!cost) return false;
    
    const filtered = costs.filter(c => c.id !== id);
    storage.set(KEYS.COSTS, filtered);
    
    // Recalculate project spent
    const total = costStore.getTotalByProject(cost.projectId);
    projectStore.update(cost.projectId, { spent: total });
    
    toast.success('Cost entry deleted');
    return true;
  }
};

// Simulation Store
export const simulationStore = {
  getAll: (): SimulationResult[] => storage.get(KEYS.SIMULATIONS, []),
  getByProject: (projectId: string): SimulationResult[] => {
    return simulationStore.getAll().filter(s => s.projectId === projectId);
  },
  create: (simulation: Omit<SimulationResult, 'id' | 'createdAt'>): SimulationResult => {
    const simulations = simulationStore.getAll();
    const newSimulation: SimulationResult = {
      ...simulation,
      id: `sim_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    storage.set(KEYS.SIMULATIONS, [...simulations, newSimulation]);
    toast.success('Simulation saved successfully');
    return newSimulation;
  },
  delete: (id: string): boolean => {
    const simulations = simulationStore.getAll();
    const filtered = simulations.filter(s => s.id !== id);
    if (filtered.length === simulations.length) return false;
    storage.set(KEYS.SIMULATIONS, filtered);
    toast.success('Simulation deleted');
    return true;
  }
};

// Settings Store
export const settingsStore = {
  get: (): UserSettings => storage.get(KEYS.SETTINGS, {
    companyName: 'My Construction Company',
    currency: 'INR',
    autoRefresh: true,
    refreshInterval: 5000,
    emailNotifications: true,
    alertThresholds: {
      sensorWarning: 80,
      budgetWarning: 85,
      delayWarning: 7
    }
  }),
  update: (updates: Partial<UserSettings>): UserSettings => {
    const current = settingsStore.get();
    const updated = { ...current, ...updates };
    storage.set(KEYS.SETTINGS, updated);
    toast.success('Settings saved');
    return updated;
  }
};

// Initialize default data if empty
export const initializeDefaultData = (): void => {
  // Default sensors if none exist
  if (sensorStore.getAll().length === 0) {
    const defaultSensors: Omit<Sensor, 'id' | 'lastUpdate' | 'history'>[] = [
      { name: 'Structural Strain A1', type: 'strain', location: 'Tower A - Floor 15', status: 'online', value: 245.8, unit: 'με', minThreshold: 0, maxThreshold: 300, isActive: true },
      { name: 'Temperature Monitor B2', type: 'temperature', location: 'Tower B - Floor 8', status: 'online', value: 24.5, unit: '°C', minThreshold: 15, maxThreshold: 35, isActive: true },
      { name: 'Vibration Sensor C3', type: 'vibration', location: 'Foundation - Zone C', status: 'warning', value: 0.85, unit: 'mm/s', minThreshold: 0, maxThreshold: 0.8, isActive: true },
      { name: 'Load Cell D4', type: 'load', location: 'Crane - Main', status: 'online', value: 12500, unit: 'kg', minThreshold: 0, maxThreshold: 15000, isActive: true },
      { name: 'Environmental Monitor E5', type: 'environmental', location: 'Site Perimeter', status: 'online', value: 68, unit: 'dB', minThreshold: 0, maxThreshold: 85, isActive: true },
    ];
    defaultSensors.forEach(s => sensorStore.create(s));
  }

  // Default team members if none exist
  if (teamStore.getAll().length === 0) {
    const defaultTeam: Omit<TeamMember, 'id'>[] = [
      { name: 'Abhishek Singh', role: 'Project Manager', email: 'abhishek@company.com', phone: '+91 555-0101', avatar: 'AS', projects: [], hourlyRate: 75 },
      { name: 'Daniel Naroditsky', role: 'Structural Engineer', email: 'daniel@company.com', phone: '+1 555-0102', avatar: 'DN', projects: [], hourlyRate: 85 },
      { name: 'Utkarsh Pandey', role: 'Site Supervisor', email: 'utkarsh@company.com', phone: '+91 555-0103', avatar: 'UP', projects: [], hourlyRate: 65 },
      { name: 'Rachel Yadav', role: 'Architect', email: 'rachel@company.com', phone: '+91 555-0104', avatar: 'RY', projects: [], hourlyRate: 90 },
    ];
    defaultTeam.forEach(m => teamStore.create(m));
  }

  // Default project if none exist
  if (projectStore.getAll().length === 0) {
    projectStore.create({
      name: 'Tower A Construction',
      description: 'Main residential tower with 25 floors',
      status: 'in-progress',
      progress: 78,
      startDate: '2025-01-15',
      endDate: '2026-06-30',
      team: [],
      budget: 15000000,
      spent: 11700000,
      priority: 'high'
    });
  }
};

// Export all data
export const exportAllData = (): string => {
  const data = {
    projects: projectStore.getAll(),
    team: teamStore.getAll(),
    designs: designStore.getAll(),
    sensors: sensorStore.getAll(),
    changes: changeStore.getAll(),
    costs: costStore.getAll(),
    simulations: simulationStore.getAll(),
    settings: settingsStore.get(),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

// Import all data
export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.projects) storage.set(KEYS.PROJECTS, data.projects);
    if (data.team) storage.set(KEYS.TEAM, data.team);
    if (data.designs) storage.set(KEYS.DESIGNS, data.designs);
    if (data.sensors) storage.set(KEYS.SENSORS, data.sensors);
    if (data.changes) storage.set(KEYS.CHANGES, data.changes);
    if (data.costs) storage.set(KEYS.COSTS, data.costs);
    if (data.simulations) storage.set(KEYS.SIMULATIONS, data.simulations);
    if (data.settings) storage.set(KEYS.SETTINGS, data.settings);
    toast.success('Data imported successfully');
    return true;
  } catch (e) {
    toast.error('Failed to import data');
    return false;
  }
};

// Clear all data
export const clearAllData = (): void => {
  Object.values(KEYS).forEach(key => storage.remove(key));
  toast.success('All data cleared');
  initializeDefaultData();
};
