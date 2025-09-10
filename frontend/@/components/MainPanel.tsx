"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MainPanelProps {
  form: any;
  busy: boolean;
  progress: number;
  basePreview: string;
  maskPreview: string;
  refPreviews: string[];
  onSubmit: (values: any) => void;
}

export function MainPanel({
  form,
  busy,
  progress,
  basePreview,
  maskPreview,
  refPreviews,
  onSubmit,
}: MainPanelProps) {
  return (
    <main className="flex-1 p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload & Configure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Uploads */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="base">Base Image *</Label>
                <Input
                  id="base"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) form.setValue("base", f, { shouldValidate: true });
                  }}
                  aria-describedby="base-help"
                />
                <p id="base-help" className="text-xs text-muted-foreground">
                  Primary image for editing or generation
                </p>
              </div>

              {basePreview && (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border">
                  <Image
                    src={basePreview}
                    alt="Base image preview"
                    fill
                    sizes="50vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mask">Mask (PNG/alpha, optional)</Label>
                <Input
                  id="mask"
                  type="file"
                  accept="image/png,image/webp,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    form.setValue("mask", f as any);
                  }}
                  aria-describedby="mask-help"
                />
                <p id="mask-help" className="text-xs text-muted-foreground">
                  Define areas to modify
                </p>
              </div>

              {maskPreview && (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border">
                  <Image
                    src={maskPreview}
                    alt="Mask preview"
                    fill
                    sizes="50vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="refs">Reference Images (0–7)</Label>
                <Input
                  id="refs"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const list = e.target.files ? Array.from(e.target.files).slice(0, 7) : [];
                    form.setValue("refs", list as any, { shouldValidate: true });
                  }}
                  aria-describedby="refs-help"
                />
                <p id="refs-help" className="text-xs text-muted-foreground">
                  Additional images for composition
                </p>
              </div>

              {refPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {refPreviews.map((src, i) => (
                    <div key={i} className="relative w-full aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={src}
                        alt={`Reference ${i + 1}`}
                        fill
                        sizes="25vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  rows={4}
                  defaultValue={form.getValues("prompt")}
                  onChange={(e) => form.setValue("prompt", e.target.value)}
                  placeholder="Describe the desired output..."
                  aria-describedby="prompt-help"
                />
                <p id="prompt-help" className="text-xs text-muted-foreground">
                  Instructions for AI image generation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width-slider">Width: {form.watch("width")}</Label>
                  <Slider
                    id="width-slider"
                    aria-label="Width"
                    defaultValue={[form.getValues("width")]}
                    min={256}
                    max={2048}
                    step={64}
                    onValueChange={(v) => form.setValue("width", v[0])}
                  />
                </div>
                <div>
                  <Label htmlFor="height-slider">Height: {form.watch("height")}</Label>
                  <Slider
                    id="height-slider"
                    aria-label="Height"
                    defaultValue={[form.getValues("height")]}
                    min={256}
                    max={2048}
                    step={64}
                    onValueChange={(v) => form.setValue("height", v[0])}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format-select">Format</Label>
                  <Select
                    defaultValue={form.getValues("fmt")}
                    onValueChange={(v) => form.setValue("fmt", v as any)}
                  >
                    <SelectTrigger id="format-select" aria-label="Select format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="outputs-slider">Outputs: {form.watch("n")}</Label>
                  <Slider
                    id="outputs-slider"
                    aria-label="Number of outputs"
                    defaultValue={[form.getValues("n")]}
                    min={1}
                    max={4}
                    step={1}
                    onValueChange={(v) => form.setValue("n", v[0])}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="useQueue"
                    checked={form.watch("useQueue")}
                    onCheckedChange={(v) => form.setValue("useQueue", !!v)}
                  />
                  <Label htmlFor="useQueue">Use Queue</Label>
                </div>
                <div className="space-y-2 w-40">
                  <Progress value={progress} aria-label="Generation progress" />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={form.handleSubmit(onSubmit)}
                  aria-describedby="generate-help"
                >
                  {busy ? "Processing…" : "Generate / Edit"}
                </Button>
                <p id="generate-help" className="text-xs text-muted-foreground text-center">
                  Click to start AI image processing
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}