"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: (checked: boolean) => void;
}

export function Header({ isDarkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Image Studio</h1>
        <p className="text-sm text-muted-foreground">
          Modern UI · Grid Layout · Dark Mode · Animations
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="dark-mode-toggle" className="text-sm">
          {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Label>
        <Switch
          id="dark-mode-toggle"
          checked={isDarkMode}
          onCheckedChange={onToggleDarkMode}
          aria-label="Toggle dark mode"
        />
      </div>
    </header>
  );
}