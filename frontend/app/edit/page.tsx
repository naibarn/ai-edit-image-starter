"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

const API = process.env.NEXT_PUBLIC_API_BASE as string;
const DEFAULT_USE_QUEUE = String(process.env.NEXT_PUBLIC_USE_QUEUE || "false") === "true";

const schema = z.object({
  prompt: z.string().min(3),
  mode: z.enum(["composite", "garment_transfer", "inpaint"]),
  preset: z.enum(["none", "blur_bg", "change_clothes", "remove_object"]),
  provider: z.enum(["auto", "openrouter", "gemini-direct"]),
  width: z.number().min(256).max(2048),
  height: z.number().min(256).max(2048),
  fmt: z.enum(["png", "webp", "jpg"]),
  n: z.number().min(1).max(4),
  base: z.custom<File>((v) => v instanceof File, "base image is required").optional(),
  mask: z.custom<File | undefined>().optional(),
  refs: z.array(z.custom<File>()).max(7),
  useQueue: z.boolean(),
});

type FormValues = z.infer<typeof schema>;
type ImageItem = { filename: string; url: string; size_bytes: number; created_at: number };
type JobItem = { id: string; status: string; result?: ImageItem[]; error?: string };

export default function EditPage() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<ImageItem[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: "Make a tasteful composite; keep identity and lighting natural",
      mode: "composite",
      preset: "none",
      provider: "auto",
      width: 1024,
      height: 1024,
      fmt: "png",
      n: 1,
      refs: [],
      useQueue: DEFAULT_USE_QUEUE,
    },
  });

  async function refresh() {
    const res = await fetch(`${API}/images`, { cache: "no-store" });
    setItems(await res.json());
  }
  useEffect(() => {
    refresh();
  }, []);

  const basePreview = useMemo(() => {
    const f = (form.getValues("base") as any) || undefined;
    return f ? URL.createObjectURL(f) : "";
  }, [form.watch("base")]);

  const maskPreview = useMemo(() => {
    const f = (form.getValues("mask") as any) || undefined;
    return f ? URL.createObjectURL(f) : "";
  }, [form.watch("mask")]);

  const refPreviews = useMemo(() => {
    const arr = (form.getValues("refs") || []) as any[];
    return arr.map((f) => URL.createObjectURL(f));
  }, [form.watch("refs")]);

  async function pollJob(id: string) {
    let tries = 0;
    while (tries < 240) { // ~2 นาที
      const r = await fetch(`${API}/jobs/${id}?_=${Date.now()}`, { cache: "no-store" });
      const j: JobItem = await r.json();
      if (j.status === "done") return j.result || [];
      if (j.status === "error") throw new Error(j.error || "Job error");
      await new Promise((res) => setTimeout(res, 1000));
      tries++;
    }
    throw new Error("Timeout waiting for job");
  }

  async function onSubmit(values: FormValues) {
    setBusy(true);
    setProgress(5);
    const tid = setInterval(() => setProgress((p) => Math.min(95, p + 5)), 400);

    try {
      const fd = new FormData();
      fd.append("prompt", values.prompt);
      fd.append("mode", values.mode);
      if (values.preset !== "none") fd.append("preset", values.preset);
      fd.append("width", String(values.width));
      fd.append("height", String(values.height));
      fd.append("fmt", values.fmt);
      fd.append("n", String(values.n));
      fd.append("provider", values.provider);

      const useQueue = values.useQueue;

      if (useQueue) {
        // Jobs flow
        if (values.base) fd.append("base", values.base);
        if (values.mask) fd.append("mask", values.mask);
        for (const r of values.refs) fd.append("refs", r);

        const op = values.base ? "edit" : "generate";
        fd.append("op", op);

        const res = await axios.post(`${API}/jobs/submit`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        if (res.status >= 200 && res.status < 300) {
          const jobId = res.data.id as string;
          toast.info("Submitted to queue", { description: `Job #${jobId.slice(0, 8)}` });
          const result = await pollJob(jobId);
          toast.success("Image ready");
          await refresh();
          return;
        } else {
          throw new Error(`Submit failed ${res.status}`);
        }
      } else {
        // Direct flow
        if (values.base) {
          fd.append("base", values.base);
          if (values.mask) fd.append("mask", values.mask);
          for (const r of values.refs) fd.append("refs", r);
          const res = await axios.post(`${API}/images/edit`, fd, { headers: { "Content-Type": "multipart/form-data" } });
          if (res.status >= 200 && res.status < 300) {
            toast.success("Image generated");
            await refresh();
          } else {
            throw new Error(`Edit failed ${res.status}`);
          }
        } else {
          // generate
          const res = await axios.post(`${API}/images/generate`, fd);
          if (res.status >= 200 && res.status < 300) {
            toast.success("Image generated");
            await refresh();
          } else {
            throw new Error(`Generate failed ${res.status}`);
          }
        }
      }
    } catch (e: any) {
      toast.error(e?.response?.data || e.message || "Error");
      try {
        await fetch(`${API}/logs/client`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: String(e?.message || e), stack: e?.stack, path: "/edit" }),
        });
      } catch {}
    } finally {
      clearInterval(tid);
      setProgress(100);
      setTimeout(() => setProgress(0), 600);
      setBusy(false);
    }
  }

  return (
    <main className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-muted/40 to-muted p-6 border">
        <h1 className="text-3xl font-semibold tracking-tight">AI Image Studio</h1>
        <p className="text-muted-foreground mt-1">
          Base + Refs + Mask · Presets · Provider Switch · Queue · shadcn/ui + toasts
        </p>
      </div>

      <Card className="shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle>Upload & Settings</CardTitle>
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
                />
              </div>

              {basePreview && (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border">
                  <Image src={basePreview} alt="base" fill sizes="50vw" style={{ objectFit: "cover" }} />
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
                />
              </div>

              {maskPreview && (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border">
                  <Image src={maskPreview} alt="mask" fill sizes="50vw" style={{ objectFit: "cover" }} />
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
                />
              </div>

              {refPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {refPreviews.map((src, i) => (
                    <div key={i} className="relative w-full aspect-square rounded-lg overflow-hidden border">
                      <Image src={src} alt={`ref-${i}`} fill sizes="25vw" style={{ objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <RadioGroup
                  defaultValue={form.getValues("mode")}
                  onValueChange={(v) => form.setValue("mode", v as any)}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="m1" value="composite" />
                    <Label htmlFor="m1">Composite</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="m2" value="garment_transfer" />
                    <Label htmlFor="m2">Garment Transfer</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="m3" value="inpaint" />
                    <Label htmlFor="m3">Inpaint (Mask)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Preset</Label>
                <Select defaultValue={form.getValues("preset")} onValueChange={(v) => form.setValue("preset", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">none</SelectItem>
                    <SelectItem value="blur_bg">blur background</SelectItem>
                    <SelectItem value="change_clothes">change clothes</SelectItem>
                    <SelectItem value="remove_object">remove object</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Provider</Label>
                <Select defaultValue={form.getValues("provider")} onValueChange={(v) => form.setValue("provider", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">auto</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="gemini-direct">Gemini (direct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  rows={4}
                  defaultValue={form.getValues("prompt")}
                  onChange={(e) => form.setValue("prompt", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width: {form.watch("width")}</Label>
                  <Slider
                    defaultValue={[form.getValues("width")]}
                    min={256}
                    max={2048}
                    step={64}
                    onValueChange={(v) => form.setValue("width", v[0])}
                  />
                </div>
                <div>
                  <Label>Height: {form.watch("height")}</Label>
                  <Slider
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
                  <Label>Format</Label>
                  <Select defaultValue={form.getValues("fmt")} onValueChange={(v) => form.setValue("fmt", v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">png</SelectItem>
                      <SelectItem value="webp">webp</SelectItem>
                      <SelectItem value="jpg">jpg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Outputs: {form.watch("n")}</Label>
                  <Slider defaultValue={[form.getValues("n")]} min={1} max={4} step={1} onValueChange={(v) => form.setValue("n", v[0])} />
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
                  {progress > 0 && <Progress value={progress} />}
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" disabled={busy} onClick={form.handleSubmit(onSubmit)}>
                  {busy ? "Processing…" : "Generate / Edit"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((it) => (
          <figure key={it.filename} className="border rounded-2xl p-3 shadow-sm">
            <div className="relative w-full aspect-square">
              <Image src={`${API}${it.url}`} alt={it.filename} fill sizes="33vw" style={{ objectFit: "cover" }} />
            </div>
            <div className="mt-2 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">{(it.size_bytes / 1024).toFixed(1)} KB</span>
              <a className="underline" href={`${API}${it.url}`} download>
                Download
              </a>
            </div>
          </figure>
        ))}
      </section>
    </main>
  );
}
