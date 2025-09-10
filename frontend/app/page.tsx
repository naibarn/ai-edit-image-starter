'use client';

import { useState } from 'react';
import { Upload, Image, Sparkles, Clock } from 'lucide-react';

export default function EditPage() {
  const [mode, setMode] = useState('composite');
  const [preset, setPreset] = useState('none');
  const [provider, setProvider] = useState('auto');
  const [prompt, setPrompt] = useState('Make a tasteful composite; keep identity and lighting natural');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [format, setFormat] = useState('png');
  const [outputs, setOutputs] = useState(1);
  const [useQueue, setUseQueue] = useState(false);
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [maskImage, setMaskImage] = useState<File | null>(null);
  const [refImages, setRefImages] = useState<File[]>([]);

  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBaseImage(e.target.files[0]);
    }
  };

  const handleMaskImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMaskImage(e.target.files[0]);
    }
  };

  const handleRefImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 7);
      setRefImages(files);
    }
  };

  const handleGenerate = () => {
    console.log('Generating with settings:', {
      mode, preset, provider, prompt, width, height, format, outputs, useQueue
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
            AI Image Studio
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Base + Refs + Mask · Presets · Provider Switch · Queue · shadcn/ui + toasts
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Settings */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload & Settings
              </h2>

              {/* Base Image Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Base Image <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBaseImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <Upload className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {baseImage ? baseImage.name : 'เลือกไฟล์ ไม่ได้เลือกไฟล์ใด'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mask Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mask (PNG/alpha, optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleMaskImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {maskImage ? maskImage.name : 'เลือกไฟล์ ไม่ได้เลือกไฟล์ใด'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reference Images */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Reference Images (0-7)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleRefImagesChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {refImages.length > 0 
                          ? `${refImages.length} files selected` 
                          : 'เลือกไฟล์ ไม่ได้เลือกไฟล์ใด'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mode
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'composite', label: 'Composite' },
                      { value: 'garment', label: 'Garment Transfer' },
                      { value: 'inpaint', label: 'Inpaint (Mask)' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="mode"
                          value={option.value}
                          checked={mode === option.value}
                          onChange={(e) => setMode(e.target.value)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preset and Provider */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Preset
                    </label>
                    <select
                      value={preset}
                      onChange={(e) => setPreset(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="none">none</option>
                      <option value="enhance">enhance</option>
                      <option value="artistic">artistic</option>
                      <option value="photorealistic">photorealistic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="auto">auto</option>
                      <option value="openai">openai</option>
                      <option value="stability">stability</option>
                      <option value="midjourney">midjourney</option>
                    </select>
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                    placeholder="Describe your image..."
                  />
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Width
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Height
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Format and Outputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="png">png</option>
                      <option value="jpg">jpg</option>
                      <option value="webp">webp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Outputs
                    </label>
                    <input
                      type="number"
                      value={outputs}
                      onChange={(e) => setOutputs(Number(e.target.value))}
                      min="1"
                      max="4"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Use Queue */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useQueue}
                      onChange={(e) => setUseQueue(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                      Use Queue
                    </span>
                  </label>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate / Edit
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Preview
              </h2>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Generated image will appear here
                  </p>
                </div>
              </div>
            </div>

            {/* Queue Status */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Queue Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Position in queue:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Estimated time:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">--</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}