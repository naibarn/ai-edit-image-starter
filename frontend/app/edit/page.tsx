"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { Gallery } from "@/components/Gallery";
import { Toaster } from "@/components/ui/sonner";

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
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    try {
      const res = await fetch(`${API}/images`, { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
    }
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
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <Header isDarkMode={isDarkMode} onToggleDarkMode={setIsDarkMode} />
      <div className="grid lg:grid-cols-[320px_1fr] min-h-[calc(100vh-80px)]">
        <Sidebar
          mode={form.watch("mode")}
          preset={form.watch("preset")}
          provider={form.watch("provider")}
          onModeChange={(v: string) => form.setValue("mode", v as any)}
          onPresetChange={(v: string) => form.setValue("preset", v as any)}
          onProviderChange={(v: string) => form.setValue("provider", v as any)}
        />
        <div className="flex flex-col">
          <MainPanel
            form={form}
            busy={busy}
            progress={progress}
            basePreview={basePreview}
            maskPreview={maskPreview}
            refPreviews={refPreviews}
            onSubmit={onSubmit}
          />
          <Gallery items={items} apiBase={API} />
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
