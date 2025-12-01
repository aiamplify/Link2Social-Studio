/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { generateCarousel } from '../services/geminiService';
import { CarouselResult } from '../types';
import { Link, Loader2, Download, Sparkles, AlertCircle, Palette, Globe, Layout, Copy, Check, ArrowLeft, ArrowRight, Image as ImageIcon, MessageSquare, Upload, X } from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';

const CAROUSEL_STYLES = [
    "Corporate",
    "Bold",
    "Minimalist"
];

const LANGUAGES = [
  { label: "English (US)", value: "English" },
  { label: "Spanish (Mexico)", value: "Spanish" },
  { label: "French (France)", value: "French" },
  { label: "German (Germany)", value: "German" },
  { label: "Portuguese (Brazil)", value: "Portuguese" },
  { label: "Japanese (Japan)", value: "Japanese" },
];

const ArticleToCarousel: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  
  const [selectedStyle, setSelectedStyle] = useState(CAROUSEL_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CarouselResult | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  
  // Viewer State
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        setSourceImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() && !prompt.trim() && !sourceImage) {
        setError("Please provide at least a URL, a text prompt, or an image.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
        const data = await generateCarousel(
            urlInput, 
            prompt,
            sourceImage,
            selectedStyle, 
            selectedLanguage, 
            (stage) => setLoadingStage(stage)
        );
        setResult(data);
    } catch (err: any) {
        setError(err.message || "Failed to generate carousel.");
    } finally {
        setLoading(false);
    }
  };

  const copyCaption = () => {
      if (result?.caption) {
          navigator.clipboard.writeText(result.caption);
          setCopiedCaption(true);
          setTimeout(() => setCopiedCaption(false), 2000);
      }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 mb-20">
      
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-sky-200 via-blue-200 to-slate-500 font-sans">
          Carousel <span className="text-sky-400">Creator</span>.
        </h2>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          Generate multi-slide visual narratives for LinkedIn & Instagram.
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-panel rounded-3xl p-6 md:p-10 space-y-8 relative z-10">
         <form onSubmit={handleGenerate} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-sky-400 font-mono tracking-wider flex items-center gap-2">
                            <Link className="w-4 h-4" /> SOURCE_URL (Optional)
                        </label>
                        <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com/article"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 font-mono transition-all"
                        />
                    </div>

                    {/* Text Prompt */}
                    <div className="space-y-2">
                        <label className="text-xs text-sky-400 font-mono tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> CONTEXT / INSTRUCTIONS
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="E.g., Create a carousel about '5 Tips for Remote Work' with a friendly tone..."
                            className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 font-mono transition-all resize-none leading-relaxed"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-2 h-full flex flex-col">
                        <label className="text-xs text-sky-400 font-mono tracking-wider flex items-center gap-2">
                            <Upload className="w-4 h-4" /> REFERENCE_IMAGE (Optional)
                        </label>
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex-1 min-h-[160px] border border-dashed border-white/10 rounded-xl bg-slate-950/30 hover:bg-white/5 hover:border-sky-500/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            {sourceImage ? (
                                <>
                                    <img src={`data:image/png;base64,${sourceImage}`} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Reference" />
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                         <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs text-white border border-white/10 font-bold flex items-center gap-2">
                                            <Check className="w-3 h-3 text-green-400" /> Image Loaded
                                         </div>
                                         <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setSourceImage(null); }}
                                            className="text-[10px] text-red-300 hover:text-red-200 bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/30 transition-colors z-20"
                                         >
                                             Remove
                                         </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-3 bg-sky-500/10 rounded-xl group-hover:bg-sky-500/20 transition-colors">
                                        <ImageIcon className="w-6 h-6 text-sky-400" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm text-slate-400 group-hover:text-slate-300">Upload Context Image</p>
                                        <p className="text-[10px] text-slate-600 font-mono">PNG / JPG Supported</p>
                                    </div>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Config */}
            <div className="grid md:grid-cols-2 gap-8 border-t border-white/5 pt-6">
                <div className="space-y-4">
                    <label className="text-xs text-sky-400 font-mono tracking-wider flex items-center gap-2">
                        <Palette className="w-4 h-4" /> VISUAL_THEME
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {CAROUSEL_STYLES.map(style => (
                            <button
                                key={style}
                                type="button"
                                onClick={() => setSelectedStyle(style)}
                                className={`py-3 px-2 rounded-xl font-mono text-xs transition-all border text-center ${
                                    selectedStyle === style 
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                                    : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs text-sky-400 font-mono tracking-wider flex items-center gap-2">
                        <Globe className="w-4 h-4" /> LANGUAGE
                    </label>
                     <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 font-mono appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-300">
                                {lang.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || (!urlInput.trim() && !prompt.trim() && !sourceImage)}
                className="w-full py-5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-mono text-base tracking-wider hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] group"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layout className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                {loading ? "GENERATING SLIDES..." : "GENERATE CAROUSEL"}
            </button>
         </form>
      </div>

      {error && (
        <div className="glass-panel border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in font-mono text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 animate-in fade-in">
             <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-sky-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
             </div>
             <p className="text-sky-300 font-mono animate-pulse">{loadingStage}</p>
        </div>
      )}

      {result && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Slides Grid */}
              <div>
                  <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-sky-400" /> Generated Slides
                      </h3>
                      <span className="text-xs text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">
                          3:4 Aspect Ratio (Best for LinkedIn/IG)
                      </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {result.slides.map((slide) => (
                          <div key={slide.order} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-[3/4]">
                              {slide.imageData ? (
                                  <img 
                                    src={`data:image/png;base64,${slide.imageData}`} 
                                    alt={`Slide ${slide.order}`}
                                    className="w-full h-full object-cover"
                                  />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950">
                                      <ImageIcon className="w-8 h-8 opacity-50" />
                                  </div>
                              )}
                              
                              {/* Overlay Controls */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                  {slide.imageData && (
                                      <>
                                        <button 
                                            onClick={() => setFullScreenImage({src: `data:image/png;base64,${slide.imageData}`, alt: `Slide ${slide.order}`})}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-mono border border-white/10 flex items-center gap-2"
                                        >
                                            View Full
                                        </button>
                                        <a 
                                            href={`data:image/png;base64,${slide.imageData}`} 
                                            download={`slide-${slide.order}.png`}
                                            className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 rounded-lg text-sky-300 text-xs font-mono border border-sky-500/30 flex items-center gap-2"
                                        >
                                            <Download className="w-3 h-3" /> Download
                                        </a>
                                      </>
                                  )}
                              </div>
                              
                              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-white/5">
                                  {slide.order}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Caption */}
              <div className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-sky-300 font-mono uppercase tracking-wider">
                          Social Caption
                      </h3>
                      <button 
                        onClick={copyCaption}
                        className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors font-mono"
                      >
                          {copiedCaption ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          {copiedCaption ? "Copied" : "Copy Text"}
                      </button>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                      <p className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                          {result.caption}
                      </p>
                  </div>
              </div>

          </div>
      )}
    </div>
  );
};

export default ArticleToCarousel;