
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { generateVeoBroll, enhanceVideoPrompt } from '../services/geminiService';
import { Video, Loader2, AlertCircle, Sparkles, Download, Upload, MonitorPlay, Film, Ratio, Maximize, Wand2 } from 'lucide-react';

const VIDEO_STYLES = [
    "Cinematic Drone",
    "Handheld Vlog",
    "Slow Motion Product",
    "Cyberpunk Neon",
    "Nature Documentary",
    "Hyperlapse",
    "Vintage 16mm",
    "Corporate Clean"
];

const ASPECT_RATIOS = [
    { label: "Landscape (16:9)", value: "16:9" },
    { label: "Portrait (9:16)", value: "9:16" }
];

const RESOLUTIONS = [
    { label: "HD (720p)", value: "720p" },
    { label: "FHD (1080p)", value: "1080p" }
];

const BrollCreator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(VIDEO_STYLES[0]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleEnhancePrompt = async () => {
      if (!prompt.trim()) return;
      setIsEnhancing(true);
      try {
          const enhanced = await enhanceVideoPrompt(prompt, selectedStyle);
          setPrompt(enhanced);
      } catch (e) {
          console.error(e);
      } finally {
          setIsEnhancing(false);
      }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
        setError("Please describe the video you want to create.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    
    try {
        const url = await generateVeoBroll(
            prompt,
            aspectRatio,
            resolution,
            sourceImage,
            (stage) => setLoadingStage(stage)
        );
        setVideoUrl(url);
    } catch (err: any) {
        setError(err.message || "Failed to generate video.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 mb-20">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 via-purple-200 to-slate-500 font-sans">
          Veo <span className="text-indigo-500">Director</span>.
        </h2>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          Generate cinematic B-roll and video assets with Veo 3.1.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
               <form onSubmit={handleGenerate} className="glass-panel p-6 rounded-3xl space-y-6">
                    
                    {/* Prompt Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-indigo-400 font-mono tracking-wider flex items-center gap-2">
                                <Film className="w-4 h-4" /> SCENE_DESCRIPTION
                            </label>
                            <button 
                                type="button" 
                                onClick={handleEnhancePrompt}
                                disabled={isEnhancing || !prompt}
                                className="text-[10px] flex items-center gap-1 text-purple-300 hover:text-white transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded border border-purple-500/30 disabled:opacity-50"
                            >
                                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                Magic Enhance
                            </button>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the camera movement, subject, lighting, and action..."
                            className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 resize-none leading-relaxed"
                        />
                    </div>

                    {/* Image Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-indigo-400 font-mono tracking-wider flex items-center gap-2">
                            <Upload className="w-4 h-4" /> START_FRAME (Image-to-Video)
                        </label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-20 border border-dashed border-white/10 rounded-xl bg-slate-950/30 hover:bg-white/5 hover:border-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-4 group relative overflow-hidden"
                        >
                            {sourceImage ? (
                                <>
                                    <img src={`data:image/png;base64,${sourceImage}`} className="h-full w-auto object-contain opacity-50 absolute left-4" alt="Ref" />
                                    <div className="relative z-10 flex items-center gap-2 text-white font-bold text-xs bg-black/50 px-3 py-1 rounded-full ml-12">
                                        <Upload className="w-3 h-3" /> Change Image
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20">
                                        <Upload className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">Upload Start Frame (Optional)</span>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-indigo-400 font-mono tracking-wider flex items-center gap-2">
                                <Ratio className="w-4 h-4" /> ASPECT
                            </label>
                            <div className="flex flex-col gap-1">
                                {ASPECT_RATIOS.map(ar => (
                                    <button
                                        key={ar.value}
                                        type="button"
                                        onClick={() => setAspectRatio(ar.value as any)}
                                        className={`px-3 py-2 rounded-lg text-xs font-mono text-left transition-all border ${
                                            aspectRatio === ar.value
                                            ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30'
                                            : 'bg-slate-900/50 text-slate-500 border-white/5 hover:text-white'
                                        }`}
                                    >
                                        {ar.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                         <div className="space-y-2">
                            <label className="text-xs text-indigo-400 font-mono tracking-wider flex items-center gap-2">
                                <MonitorPlay className="w-4 h-4" /> QUALITY
                            </label>
                            <div className="flex flex-col gap-1">
                                {RESOLUTIONS.map(res => (
                                    <button
                                        key={res.value}
                                        type="button"
                                        onClick={() => setResolution(res.value as any)}
                                        className={`px-3 py-2 rounded-lg text-xs font-mono text-left transition-all border ${
                                            resolution === res.value
                                            ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30'
                                            : 'bg-slate-900/50 text-slate-500 border-white/5 hover:text-white'
                                        }`}
                                    >
                                        {res.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Style Presets */}
                    <div className="space-y-2">
                         <label className="text-xs text-indigo-400 font-mono tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> CINEMATIC_STYLE
                        </label>
                        <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500/50"
                        >
                            {VIDEO_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !prompt}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        {loading ? "RENDERING..." : "GENERATE CLIP"}
                    </button>
               </form>
               
               {error && (
                    <div className="glass-panel border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 font-mono text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
          </div>

          {/* Preview / Result */}
          <div className="lg:col-span-7">
              <div className="glass-panel rounded-3xl p-1.5 h-full min-h-[500px] flex flex-col">
                  <div className="px-4 py-3 border-b border-white/5 bg-slate-950/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Viewport ({resolution})</span>
                        </div>
                        {videoUrl && (
                            <a 
                                href={videoUrl}
                                download="veo-clip.mp4"
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-mono transition-colors"
                            >
                                <Download className="w-3 h-3" /> Save MP4
                            </a>
                        )}
                  </div>

                  <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden rounded-b-2xl">
                      {loading ? (
                          <div className="text-center space-y-6">
                              <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Video className="w-8 h-8 text-indigo-500 opacity-50 animate-pulse" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-indigo-400 font-mono text-sm animate-pulse tracking-widest uppercase">{loadingStage}</p>
                                <p className="text-slate-500 text-xs font-mono">This usually takes 1-2 minutes.</p>
                              </div>
                          </div>
                      ) : videoUrl ? (
                          <video 
                            src={videoUrl} 
                            controls 
                            autoPlay 
                            loop 
                            className={`w-full h-full ${aspectRatio === '9:16' ? 'max-w-[350px]' : 'max-w-full'} object-contain`} 
                          />
                      ) : (
                          <div className="text-center text-slate-700">
                                <Film className="w-20 h-20 mx-auto mb-4 opacity-10" />
                                <p className="font-mono text-xs uppercase tracking-wider opacity-30">Awaiting Footage</p>
                          </div>
                      )}
                      
                      {/* Grid overlay for director vibe */}
                      {!videoUrl && !loading && (
                           <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                               backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                               backgroundSize: '40px 40px'
                           }}></div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default BrollCreator;
