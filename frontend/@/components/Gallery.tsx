"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";

interface ImageItem {
  filename: string;
  url: string;
  size_bytes: number;
  created_at: number;
}

interface GalleryProps {
  items: ImageItem[];
  apiBase: string;
}


export function Gallery({ items, apiBase }: GalleryProps) {
  return (
    <section className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={item.filename}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="relative w-full aspect-square">
                  <Image
                    src={`${apiBase}${item.url}`}
                    alt={`Generated image ${item.filename}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    style={{ objectFit: "cover" }}
                    className="transition-transform duration-200 hover:scale-105"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {(item.size_bytes / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      aria-label={`Download ${item.filename}`}
                    >
                      <a
                        href={`${apiBase}${item.url}`}
                        download={item.filename}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at * 1000).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No images generated yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload images and click Generate to create your first AI image
          </p>
        </div>
      )}
    </section>
  );
}