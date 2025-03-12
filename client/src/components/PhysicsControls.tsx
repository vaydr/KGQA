import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PhysicsSettings, getDefaultPhysicsSettings } from './ForceDirectedGraph';

interface PhysicsControlsProps {
  settings: PhysicsSettings;
  onChange: (settings: PhysicsSettings) => void;
}

interface SettingSliderProps {
  label: string;
  tooltip: string;
  value: number;
  onChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  minText?: string;
  maxText?: string;
  labelMap?: (x: number) => string;
  numDecimals?: number;
}
function SettingSlider({ label, tooltip, value, onChange, min, max, step, minText = "min", maxText = "max", labelMap = (x: number) => x.toString(), numDecimals = 0 }: SettingSliderProps) {
  return (
    <div className="space-y-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="text-sm font-medium cursor-help">{label}</label>
          </TooltipTrigger>
          <TooltipContent>
            <p className="w-[200px] text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="flex items-center gap-4">
        <div className="flex flex-col flex-1">
          <Slider
            value={[value]}
            onValueChange={onChange}
            min={min}
            max={max}
            step={step}
            className="flex-1"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{minText}</span>
            <span className="text-xs text-gray-500">{maxText}</span>
          </div>
        </div>
        <span className="text-xs tabular-nums w-12 text-right">
          {Number(labelMap(value)).toFixed(numDecimals)}
        </span>
      </div>
    </div>
  );
}

// New interface for dropdown settings
interface SettingSelectProps {
  label: string;
  tooltip: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

function SettingSelect({ label, tooltip, value, onChange, options }: SettingSelectProps) {
  return (
    <div className="space-y-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="text-sm font-medium cursor-help">{label}</label>
          </TooltipTrigger>
          <TooltipContent>
            <p className="w-[200px] text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const PhysicsControls: React.FC<PhysicsControlsProps> = ({ settings, onChange }) => {
  const [localSettings, setLocalSettings] = React.useState<PhysicsSettings>(settings);

  const handleChange = (key: keyof PhysicsSettings, value: number[]) => {
    const newSettings = { ...localSettings, [key]: value[0] };
    setLocalSettings(newSettings);
    onChange(newSettings);
  };

  const handleSelectChange = (key: keyof PhysicsSettings, value: string) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onChange(newSettings);
  };

  // Color scheme options
  const colorSchemeOptions = [
    { value: 'default', label: 'Default (Blue)' },
    { value: 'viridis', label: 'Viridis' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'rainbow', label: 'Rainbow' },
    { value: 'magma', label: 'Magma' },
    { value: 'inferno', label: 'Inferno' },
    { value: 'turbo', label: 'Turbo' },
    { value: 'cividis', label: 'Cividis' },
  ];

  // Community detection algorithm options
  const communityOptions = [
    { value: 'none', label: 'None' },
    { value: 'louvain', label: 'Louvain' },
    { value: 'girvan-newman', label: 'Girvan-Newman' },
  ];

  // Ensure we update local settings when passed settings change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Graph Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
        <DialogHeader>
          <DialogTitle>Physics</DialogTitle>
        </DialogHeader>
          <div className="grid gap-4">
            <SettingSlider
              label="Edge Length"
              tooltip="The ideal length of edges between nodes. Higher values spread nodes further apart."
              value={localSettings.linkDistance}
              onChange={(value) => handleChange("linkDistance", value)}
              min={5}
              max={300}
              step={5}
              minText="short"
              maxText="long"
            />
            <SettingSlider
              label="Edge Strength"
              tooltip="How strongly nodes are pulled together by their connections. Higher values make the graph more compact."
              value={localSettings.linkStrength}
              onChange={(value) => handleChange("linkStrength", value)}
              min={0.1}
              max={1}
              step={0.05}
              minText="weak"
              maxText="strong"
              numDecimals={2}
            />
            <SettingSlider
              label="Central Gravity"
              tooltip="How strongly nodes are pulled toward the center. Higher values make the graph more clustered."
              value={localSettings.chargeStrength}
              onChange={(value) => handleChange("chargeStrength", value)}
              min={-300}
              max={0}
              step={5}
              minText="weak"
              maxText="strong"
              labelMap={(x) => (x < 0 ? (-300/x).toFixed(2) : (300/x).toFixed(2))}
              numDecimals={2}
            />
            <SettingSlider
              label="Velocity Damping"
              tooltip="How quickly node movement slows down. Higher values make the graph more stable but less dynamic."
              value={localSettings.velocityDecay}
              onChange={(value) => handleChange("velocityDecay", value)}
              min={0.05}
              max={1}
              step={0.025}
              minText="slow"
              maxText="fast"
              numDecimals={3}
            />
          </div>
          
          <div className="border-t pt-4 mt-2">
            <DialogHeader>
              <DialogTitle>Visual</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 mt-4">
              <SettingSlider
                label="Edge Thickness"
                tooltip="Thickness of the edges between nodes."
                value={localSettings.edgeThickness}
                onChange={(value) => handleChange("edgeThickness", value)}
                min={0.1}
                max={10}
                step={0.1}
                minText="thin"
                maxText="thick"
                numDecimals={1}
              />
              
              <SettingSlider
                label="Node Radius"
                tooltip="Size of the nodes in the graph."
                value={localSettings.nodeRadius}
                onChange={(value) => handleChange("nodeRadius", value)}
                min={1}
                max={15}
                step={0.5}
                minText="small"
                maxText="large"
              />
              
              {/* New color scheme dropdown */}
              <SettingSelect
                label="Color Scheme"
                tooltip="Color palette for node coloring."
                value={localSettings.colorScheme}
                onChange={(value) => handleSelectChange("colorScheme", value)}
                options={colorSchemeOptions}
              />
              
              {/* Community detection dropdown */}
              <SettingSelect
                label="Community Detection"
                tooltip="Algorithm to detect and color node communities."
                value={localSettings.communityDetection}
                onChange={(value) => handleSelectChange("communityDetection", value)}
                options={communityOptions}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhysicsControls; 