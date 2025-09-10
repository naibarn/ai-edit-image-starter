import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { Gallery } from "@/components/Gallery";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("UI Management Layer", () => {
  describe("Header Component", () => {
    it("renders header with title and dark mode toggle", () => {
      const mockToggle = vi.fn();
      render(<Header isDarkMode={false} onToggleDarkMode={mockToggle} />);

      expect(screen.getByText("AI Image Studio")).toBeInTheDocument();
      expect(screen.getByText("Modern UI · Grid Layout · Dark Mode · Animations")).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: /toggle dark mode/i })).toBeInTheDocument();
    });

    it("calls toggle function when switch is clicked", async () => {
      const mockToggle = vi.fn();
      const user = userEvent.setup();
      render(<Header isDarkMode={false} onToggleDarkMode={mockToggle} />);

      const toggle = screen.getByRole("switch", { name: /toggle dark mode/i });
      await user.click(toggle);

      expect(mockToggle).toHaveBeenCalledWith(true);
    });
  });

  describe("Sidebar Component", () => {
    const defaultProps = {
      mode: "composite",
      preset: "none",
      provider: "auto",
      onModeChange: vi.fn(),
      onPresetChange: vi.fn(),
      onProviderChange: vi.fn(),
    };

    it("renders sidebar with tabs", () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getByRole("tab", { name: /modes/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /settings/i })).toBeInTheDocument();
    });

    it("renders mode selection controls", () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getByRole("radiogroup", { name: /select mode/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /composite/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /garment transfer/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /inpaint/i })).toBeInTheDocument();
    });

    it("renders preset and provider selects", () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getByRole("combobox", { name: /select preset/i })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: /select provider/i })).toBeInTheDocument();
    });

    it("calls onModeChange when mode is selected", async () => {
      const mockOnModeChange = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onModeChange={mockOnModeChange} />);

      const garmentRadio = screen.getByRole("radio", { name: /garment transfer/i });
      await user.click(garmentRadio);

      expect(mockOnModeChange).toHaveBeenCalledWith("garment_transfer");
    });
  });

  describe("Gallery Component", () => {
    const mockItems = [
      {
        filename: "test1.png",
        url: "/images/test1.png",
        size_bytes: 102400,
        created_at: 1640995200,
      },
      {
        filename: "test2.png",
        url: "/images/test2.png",
        size_bytes: 204800,
        created_at: 1640995300,
      },
    ];

    it("renders gallery with images", () => {
      render(<Gallery items={mockItems} apiBase="http://localhost:8000" />);

      expect(screen.getByAltText("Generated image test1.png")).toBeInTheDocument();
      expect(screen.getByAltText("Generated image test2.png")).toBeInTheDocument();
    });

    it("renders download buttons with correct href", () => {
      render(<Gallery items={mockItems} apiBase="http://localhost:8000" />);

      const downloadLinks = screen.getAllByRole("link", { name: /download/i });
      expect(downloadLinks).toHaveLength(2);
      expect(downloadLinks[0]).toHaveAttribute("href", "http://localhost:8000/images/test1.png");
      expect(downloadLinks[0]).toHaveAttribute("download", "test1.png");
    });

    it("shows empty state when no items", () => {
      render(<Gallery items={[]} apiBase="http://localhost:8000" />);

      expect(screen.getByText("No images generated yet")).toBeInTheDocument();
    });

    it("displays file size and creation date", () => {
      render(<Gallery items={mockItems} apiBase="http://localhost:8000" />);

      expect(screen.getByText("100.0 KB")).toBeInTheDocument();
      expect(screen.getByText("200.0 KB")).toBeInTheDocument();
    });
  });

  describe("MainPanel Component", () => {
    const mockForm = {
      getValues: vi.fn((key: string) => {
        const values: any = {
          prompt: "Test prompt",
          mode: "composite",
          preset: "none",
          provider: "auto",
          width: 1024,
          height: 1024,
          fmt: "png",
          n: 1,
          useQueue: false,
        };
        return values[key];
      }),
      setValue: vi.fn(),
      watch: vi.fn((key: string) => {
        const values: any = {
          width: 1024,
          height: 1024,
          n: 1,
          useQueue: false,
        };
        return values[key];
      }),
      handleSubmit: vi.fn((fn) => fn),
    };

    const defaultProps = {
      form: mockForm,
      busy: false,
      progress: 0,
      basePreview: "",
      maskPreview: "",
      refPreviews: [],
      onSubmit: vi.fn(),
    };

    it("renders upload inputs with proper labels", () => {
      render(<MainPanel {...defaultProps} />);

      expect(screen.getByLabelText(/base image \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mask \(png\/alpha, optional\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference images \(0–7\)/i)).toBeInTheDocument();
    });

    it("renders form controls", () => {
      render(<MainPanel {...defaultProps} />);

      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: /width/i })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: /height/i })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: /number of outputs/i })).toBeInTheDocument();
    });

    it("renders generate button", () => {
      render(<MainPanel {...defaultProps} />);

      const button = screen.getByRole("button", { name: /generate \/ edit/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("shows progress bar", () => {
      render(<MainPanel {...defaultProps} progress={50} />);

      expect(screen.getByRole("progressbar", { name: /generation progress/i })).toBeInTheDocument();
    });

    it("disables button when busy", () => {
      render(<MainPanel {...defaultProps} busy={true} />);

      const button = screen.getByRole("button", { name: /processing…/i });
      expect(button).toBeDisabled();
    });
  });
});