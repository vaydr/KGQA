import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface GraphSettings {
  linkDistance: number;
  linkStrength: number;
  chargeStrength: number;
  gravity: number;
  velocityDecay: number;
}

interface GraphSettingsProps {
  settings: GraphSettings;
  onSettingsChange: (settings: GraphSettings) => void;
}

export const defaultSettings: GraphSettings = {
  linkDistance: 100,
  linkStrength: 1,
  chargeStrength: -30,
  gravity: 0.1,
  velocityDecay: 0.4,
};

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

export function GraphSettings({ settings, onSettingsChange }: GraphSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: keyof GraphSettings, value: number[]) => {
    const newSettings = { ...localSettings, [key]: value[0] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Graph Physics Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <SettingSlider
            label="Link Distance"
            tooltip="The ideal length of edges between nodes. Higher values spread nodes further apart."
            value={localSettings.linkDistance}
            onChange={(value) => handleChange("linkDistance", value)}
            min={30}
            max={300}
            step={10}
          />
          <SettingSlider
            label="Link Strength"
            tooltip="How strongly nodes are pulled together by their connections. Higher values make the graph more compact."
            value={localSettings.linkStrength}
            onChange={(value) => handleChange("linkStrength", value)}
            min={0}
            max={2}
            step={0.1}
          />
          <SettingSlider
            label="Charge Strength"
            tooltip="How strongly nodes repel each other. More negative values push nodes apart more."
            value={localSettings.chargeStrength}
            onChange={(value) => handleChange("chargeStrength", value)}
            min={-100}
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
            min={0}
            max={1}
            step={0.05}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}