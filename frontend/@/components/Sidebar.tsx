"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SidebarProps {
  mode: string;
  preset: string;
  provider: string;
  onModeChange: (value: string) => void;
  onPresetChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}

export function Sidebar({
  mode,
  preset,
  provider,
  onModeChange,
  onPresetChange,
  onProviderChange,
}: SidebarProps) {
  return (
    <aside className="w-80 border-r bg-muted/10 p-4">
      <Tabs defaultValue="modes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modes">Modes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="modes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mode Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={mode}
                onValueChange={onModeChange}
                className="space-y-2"
                aria-label="Select mode"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="mode-composite" value="composite" />
                  <Label htmlFor="mode-composite">Composite</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="mode-garment" value="garment_transfer" />
                  <Label htmlFor="mode-garment">Garment Transfer</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="mode-inpaint" value="inpaint" />
                  <Label htmlFor="mode-inpaint">Inpaint (Mask)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Preset</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={preset} onValueChange={onPresetChange}>
                <SelectTrigger aria-label="Select preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="blur_bg">Blur Background</SelectItem>
                  <SelectItem value="change_clothes">Change Clothes</SelectItem>
                  <SelectItem value="remove_object">Remove Object</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={provider} onValueChange={onProviderChange}>
                <SelectTrigger aria-label="Select provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="gemini-direct">Gemini (Direct)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </aside>
  );
}