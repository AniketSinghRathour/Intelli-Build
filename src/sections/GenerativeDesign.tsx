import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Loader2,
  Eye,
  Maximize2,
  Trash2,
  TrendingUp,
  DollarSign,
  Leaf,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  designStore, 
  projectStore,
  settingsStore,
  type GeneratedDesign,
  type DesignParameter 
} from '@/lib/store';

// Design calculation engine
const calculateDesignMetrics = (params: DesignParameter[]) => {
  const floors = params.find(p => p.id === 'floors')?.value || 25;
  const footprint = params.find(p => p.id === 'footprint')?.value || 2500;
  const materialEff = params.find(p => p.id === 'material')?.value || 85;
  const energyRating = params.find(p => p.id === 'energy')?.value || 92;
  const costOpt = params.find(p => p.id === 'cost')?.value || 78;

  // Calculate efficiency based on parameters
  const structuralEfficiency = Math.min(100, (materialEff * 0.6) + (energyRating * 0.4));
  
  // Calculate cost estimate (simplified model)
  const baseCostPerSqm = 1500;
  const totalSqm = footprint * floors;
  const baseCost = totalSqm * baseCostPerSqm;
  const costMultiplier = 1 - (costOpt / 200); // Better optimization = lower cost
  const costEstimate = (baseCost * costMultiplier) / 1000000; // In millions

  // Calculate sustainability score
  const sustainability = Math.min(100, (energyRating * 0.5) + (materialEff * 0.3) + (costOpt * 0.2));

  return {
    efficiency: Math.round(structuralEfficiency),
    costEstimate: Math.round(costEstimate * 100) / 100,
    sustainability: Math.round(sustainability)
  };
};

// Generate building visualization on canvas
const generateBuildingVisualization = (
  canvas: HTMLCanvasElement, 
  params: DesignParameter[],
  highlightColor: string = '#f59e0b'
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const floors = Math.round(params.find(p => p.id === 'floors')?.value || 25);
  const footprint = params.find(p => p.id === 'footprint')?.value || 2500;
  const materialEff = params.find(p => p.id === 'material')?.value || 85;
  
  // Clear canvas
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  ctx.strokeStyle = `${highlightColor}20`;
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
  
  // Calculate building dimensions
  const buildingWidth = Math.min(200, Math.sqrt(footprint) * 3);
  const buildingHeight = Math.min(350, floors * 12);
  const floorHeight = buildingHeight / floors;
  
  const centerX = canvas.width / 2;
  const bottomY = canvas.height - 50;
  
  // Draw building shadow
  ctx.fillStyle = `${highlightColor}15`;
  ctx.fillRect(
    centerX - buildingWidth/2 + 10, 
    bottomY - buildingHeight + 10, 
    buildingWidth, 
    buildingHeight
  );
  
  // Draw building floors
  for (let i = 0; i < floors; i++) {
    const y = bottomY - (i + 1) * floorHeight;
    const isHighlighted = i % 5 === 0 || i === floors - 1;
    
    // Floor gradient based on material efficiency
    const opacity = 0.15 + (materialEff / 200);
    const gradient = ctx.createLinearGradient(
      centerX - buildingWidth/2, y,
      centerX + buildingWidth/2, y
    );
    gradient.addColorStop(0, `${highlightColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `${highlightColor}${Math.round((opacity + 0.2) * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${highlightColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - buildingWidth/2, y, buildingWidth, floorHeight - 2);
    
    // Floor outline
    ctx.strokeStyle = `${highlightColor}80`;
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.strokeRect(centerX - buildingWidth/2, y, buildingWidth, floorHeight - 2);
    
    // Floor number
    if (isHighlighted) {
      ctx.fillStyle = highlightColor;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`F${i + 1}`, centerX + buildingWidth/2 + 5, y + floorHeight/2 + 3);
    }
    
    // Windows
    const windowsPerFloor = Math.floor(buildingWidth / 25);
    ctx.fillStyle = '#1a1a2e';
    for (let w = 0; w < windowsPerFloor; w++) {
      const wx = centerX - buildingWidth/2 + 10 + w * 25;
      const wy = y + 5;
      ctx.fillRect(wx, wy, 12, floorHeight - 12);
      
      // Window light (random)
      if (Math.random() > 0.3) {
        ctx.fillStyle = `${highlightColor}40`;
        ctx.fillRect(wx + 2, wy + 2, 8, floorHeight - 16);
        ctx.fillStyle = '#1a1a2e';
      }
    }
  }
  
  // Draw foundation
  ctx.fillStyle = '#374151';
  ctx.fillRect(centerX - buildingWidth/2 - 10, bottomY, buildingWidth + 20, 15);
  
  // Draw measurements
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  
  // Height measurement
  ctx.beginPath();
  ctx.moveTo(centerX + buildingWidth/2 + 30, bottomY);
  ctx.lineTo(centerX + buildingWidth/2 + 30, bottomY - buildingHeight);
  ctx.stroke();
  
  // Height label
  ctx.fillStyle = highlightColor;
  ctx.font = '12px sans-serif';
  ctx.fillText(`${floors * 4}m`, centerX + buildingWidth/2 + 35, bottomY - buildingHeight/2);
  
  ctx.setLineDash([]);
  
  // Draw info panel
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 10, 150, 80);
  ctx.strokeStyle = `${highlightColor}40`;
  ctx.strokeRect(10, 10, 150, 80);
  
  ctx.fillStyle = highlightColor;
  ctx.font = '11px sans-serif';
  ctx.fillText(`Floors: ${floors}`, 20, 30);
  ctx.fillText(`Height: ${floors * 4}m`, 20, 48);
  ctx.fillText(`Footprint: ${footprint}m²`, 20, 66);
  ctx.fillText(`Material: ${materialEff}%`, 20, 84);
};

export default function GenerativeDesign() {
  const [projects] = useState(projectStore.getAll());
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [parameters, setParameters] = useState<DesignParameter[]>([
    { id: 'floors', name: 'Floor Count', value: 25, min: 5, max: 50, unit: 'floors' },
    { id: 'height', name: 'Building Height', value: 120, min: 20, max: 300, unit: 'm' },
    { id: 'footprint', name: 'Floor Footprint', value: 2500, min: 500, max: 5000, unit: 'm²' },
    { id: 'material', name: 'Material Efficiency', value: 85, min: 50, max: 100, unit: '%' },
    { id: 'energy', name: 'Energy Rating', value: 92, min: 60, max: 100, unit: 'score' },
    { id: 'cost', name: 'Cost Optimization', value: 78, min: 50, max: 100, unit: '%' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [sustainabilityPriority, setSustainabilityPriority] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const settings = settingsStore.get();

  useEffect(() => {
    if (canvasRef.current) {
      generateBuildingVisualization(canvasRef.current, parameters);
    }
  }, [parameters]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProject) {
      setGeneratedDesigns(designStore.getByProject(selectedProject));
    }
  }, [selectedProject]);

  const handleParameterChange = (id: string, value: number) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, value } : p));
  };

  const handleGenerate = async () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Simulate generation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Generate multiple design variations
    setTimeout(() => {
      const designs: GeneratedDesign[] = [];
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
      
      for (let i = 0; i < 4; i++) {
        // Create varied parameters
        const variedParams = parameters.map(p => {
          let variance = 0;
          if (autoOptimize) {
            variance = (Math.random() - 0.5) * p.value * 0.15;
          }
          if (sustainabilityPriority && (p.id === 'energy' || p.id === 'material')) {
            variance += p.value * 0.1;
          }
          return {
            ...p,
            value: Math.max(p.min, Math.min(p.max, p.value + variance))
          };
        });

        // Calculate metrics
        const metrics = calculateDesignMetrics(variedParams);

        // Generate thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        generateBuildingVisualization(canvas, variedParams, colors[i]);
        const thumbnail = canvas.toDataURL();

        const design = designStore.create({
          projectId: selectedProject,
          name: `Design Variant ${String.fromCharCode(65 + i)}`,
          parameters: variedParams,
          efficiency: metrics.efficiency,
          costEstimate: metrics.costEstimate,
          sustainability: metrics.sustainability,
          thumbnail,
          status: 'completed'
        });

        designs.push(design);
      }

      setGeneratedDesigns(designs);
      setIsGenerating(false);
      setProgress(100);
      toast.success(`Generated ${designs.length} design variants`);
    }, 3000);
  };

  const handleSelectDesign = (design: GeneratedDesign) => {
    designStore.selectDesign(design.id);
    setGeneratedDesigns(designStore.getByProject(selectedProject));
    toast.success(`${design.name} selected for project`);
  };

  const handleDeleteDesign = (id: string) => {
    designStore.delete(id);
    setGeneratedDesigns(designStore.getByProject(selectedProject));
  };

  const selectedDesign = generatedDesigns.find(d => d.status === 'selected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Generative Design
          </h2>
          <p className="text-muted-foreground">
            Generate optimized building designs using AI-powered algorithms
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <Building2 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            onClick={handleGenerate}
            disabled={isGenerating || !selectedProject}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Design Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {parameters.map((param) => (
              <div key={param.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{param.name}</Label>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(param.value)} {param.unit}
                  </Badge>
                </div>
                <Slider
                  value={[param.value]}
                  min={param.min}
                  max={param.max}
                  step={param.id === 'footprint' ? 50 : 1}
                  onValueChange={([value]) => handleParameterChange(param.id, value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{param.min}</span>
                  <span>{param.max}</span>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Auto-Optimize</Label>
                  <p className="text-xs text-muted-foreground">AI optimizes parameters</p>
                </div>
                <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Sustainability Priority</Label>
                  <p className="text-xs text-muted-foreground">Prioritize green design</p>
                </div>
                <Switch checked={sustainabilityPriority} onCheckedChange={setSustainabilityPriority} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/30 rounded-lg overflow-hidden">
                <canvas 
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full h-[300px] object-contain"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-sm font-medium mb-2">Generating Designs...</p>
                    <Progress value={progress} className="w-48 h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generated Designs */}
          {generatedDesigns.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Generated Variants
                </CardTitle>
                {selectedDesign && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {selectedDesign.name} Selected
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {generatedDesigns.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        design.status === 'selected' 
                          ? 'border-green-500 bg-green-500/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        {design.status === 'selected' && (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDesign(design.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <div onClick={() => handleSelectDesign(design)}>
                        <img 
                          src={design.thumbnail} 
                          alt={design.name}
                          className="w-full h-32 object-contain bg-muted/30 rounded mb-3"
                        />
                        <h4 className="font-medium text-sm">{design.name}</h4>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div className="p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <TrendingUp className="w-3 h-3" />
                              Efficiency
                            </div>
                            <p className="font-medium text-green-500">{design.efficiency}%</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <DollarSign className="w-3 h-3" />
                              Cost
                            </div>
                            <p className="font-medium">{settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : '₹'}{design.costEstimate}M</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <Leaf className="w-3 h-3" />
                              Green
                            </div>
                            <p className="font-medium text-emerald-500">{design.sustainability}%</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Design Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center">
            <canvas 
              ref={previewCanvasRef}
              width={800}
              height={500}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
