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
}

function SettingSlider({ label, tooltip, value, onChange, min, max, step }: SettingSliderProps) {
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
        <Slider
          value={[value]}
          onValueChange={onChange}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <span className="text-xs tabular-nums w-12 text-right">
          {value.toFixed(2)}
        </span>
      </div>
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
              label="Link Distance"
              tooltip="The ideal length of edges between nodes. Higher values spread nodes further apart."
              value={localSettings.linkDistance}
              onChange={(value) => handleChange("linkDistance", value)}
              min={5}
              max={300}
              step={5}
            />
            <SettingSlider
              label="Edge Strength"
              tooltip="How strongly nodes are pulled together by their connections. Higher values make the graph more compact."
              value={localSettings.linkStrength}
              onChange={(value) => handleChange("linkStrength", value)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <SettingSlider
              label="Charge Strength"
              tooltip="How strongly nodes repel each other. Higher values (more negative) push nodes apart more."
              value={localSettings.chargeStrength}
              onChange={(value) => handleChange("chargeStrength", value)}
              min={-300}
              max={0}
              step={5}
            />
            <SettingSlider
              label="Gravity"
              tooltip="How strongly nodes are pulled toward the center. Higher values make the graph more clustered."
              value={localSettings.gravity}
              onChange={(value) => handleChange("gravity", value)}
              min={0}
              max={1}
              step={0.05}
            />
            <SettingSlider
              label="Velocity Decay"
              tooltip="How quickly node movement slows down. Higher values make the graph more stable but less dynamic."
              value={localSettings.velocityDecay}
              onChange={(value) => handleChange("velocityDecay", value)}
              min={0.05}
              max={1}
              step={0.025}
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
              />
              
              <SettingSlider
                label="Node Radius"
                tooltip="Size of the nodes in the graph."
                value={localSettings.nodeRadius}
                onChange={(value) => handleChange("nodeRadius", value)}
                min={1}
                max={15}
                step={0.5}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhysicsControls; 