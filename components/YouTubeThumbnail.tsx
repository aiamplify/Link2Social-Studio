
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { generateYouTubeThumbnail } from '../services/geminiService';
import { Youtube, Loader2, AlertCircle, Image as ImageIcon, Sparkles, Download, Upload, Zap, Search, Type, Palette, User, Maximize } from 'lucide-react';
import ImageViewer from './ImageViewer';

const STYLES = [
    "MrBeast (Hyper-Real)",
    "Gaming (Neon/RGB)",
    "Tech Review (Clean)",
    "Vlog (Natural)",
    "Cinematic Documentary",
    "Financial (Minimalist)",
    "VS Challenge (Split)"
];

const EMOTIONS = [
    "Shocked / Surprised",
    "Angry / Furious",
    "Overjoyed / Ecstatic",
    "Confused / Thinking",
    "Serious / Intense",
    "Sad / Crying",
    "Neutral / Professional"
];

const YouTubeThumbnail: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [textOverlay, setTextOverlay] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
    const [selectedEmotion, setSelectedEmotion] = useState(EMOTIONS[0]);
    const [useSearch, setUseSearch] = useState(true);
    const [imageData, setImageData] = useState<string | null>(null);
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Strip prefix
                const base64Data = base64.split(',')[1];
                setSourceImage(base64Data);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError("Please describe the video topic.");
            return;
        }
        
        setLoading(true);
        setError(null);
        setImageData(null);
        
        try {
            const result = await generateYouTubeThumbnail(
                topic,
                selectedStyle,
                selectedEmotion,
                textOverlay,
                useSearch,
                sourceImage,
                (stage) => setLoadingStage(stage)
            );
            
            if (result) {
                setImageData(result);
            } else {
                throw new Error("No image data returned.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate thumbnail.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 mb-20">
             {fullScreenImage && (
                <ImageViewer 
                    src={fullScreenImage.src} 
                    alt={fullScreenImage.alt} 
                    onClose={() => setFullScreenImage(null)} 
                />
            )}

            {/* Hero */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
                <h2 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-rose-300 to-slate-500 font-sans">
                Viral <span className="text-red-600">Thumbnails</span>.
                </h2>
                <p className="text-slate-400 text-lg font-light tracking-wide">
                Create high-CTR YouTube thumbnails using trend analysis and Nano Banana Pro.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Controls Column */}
                <div className="lg:col-span-5 space-y-6">
                    <form onSubmit={handleGenerate} className="glass-panel p-6 rounded-3xl space-y-6">
                        
                        {/* Topic Input */}
                        <div className="space-y-2">
                            <label className="text-xs text-red-400 font-mono tracking-wider flex items-center gap-2">
                                <Youtube className="w-4 h-4" /> VIDEO_TOPIC
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., I Spent 24 Hours in a Bunker"
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-1 focus:ring-red-500/50"
                            />
                        </div>

                         {/* Text Overlay */}
                         <div className="space-y-2">
                            <label className="text-xs text-red-400 font-mono tracking-wider flex items-center gap-2">
                                <Type className="w-4 h-4" /> TEXT_OVERLAY (Short)
                            </label>
                            <input
                                type="text"
                                value={textOverlay}
                                onChange={(e) => setTextOverlay(e.target.value)}
                                placeholder="e.g., INSANE!"
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-1 focus:ring-red-500/50"
                            />
                        </div>

                        {/* Style Select */}
                        <div className="space-y-2">
                            <label className="text-xs text-red-400 font-mono tracking-wider flex items-center gap-2">
                                <Palette className="w-4 h-4" /> VISUAL_STYLE
                            </label>
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-red-500/50"
                            >
                                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Emotion Select */}
                        <div className="space-y-2">
                            <label className="text-xs text-red-400 font-mono tracking-wider flex items-center gap-2">
                                <Zap className="w-4 h-4" /> FACE_EMOTION
                            </label>
                            <select
                                value={selectedEmotion}
                                onChange={(e) => setSelectedEmotion(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-red-500/50"
                            >
                                {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>

                        {/* Upload Face */}
                        <div className="space-y-2">
                            <label className="text-xs text-red-400 font-mono tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> INSERT_YOUR_FACE (Optional)
                            </label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-24 border border-dashed border-white/10 rounded-xl bg-slate-950/30 hover:bg-white/5 hover:border-red-500/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                {sourceImage ? (
                                    <>
                                        <img src={`data:image/png;base64,${sourceImage}`} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Reference" />
                                        <div className="relative z-10 flex items-center gap-2 text-white font-bold text-xs bg-black/50 px-3 py-1 rounded-full">
                                            <Upload className="w-3 h-3" /> Change Image
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
                                        <span className="text-xs text-slate-500 font-mono">Upload PNG/JPG</span>
                                    </>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>
                        </div>

                         {/* Trend Toggle */}
                         <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                <div className="text-xs font-mono text-slate-300">
                                    <div>Use Trend Research</div>
                                    <div className="text-slate-500 text-[10px]">Analyzes viral hits</div>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !topic}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? "GENERATING..." : "CREATE VIRAL THUMBNAIL"}
                        </button>
                    </form>
                    
                    {error && (
                        <div className="glass-panel border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 font-mono text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                        </div>
                    )}
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass-panel rounded-3xl p-1.5 relative overflow-hidden min-h-[400px] flex flex-col">
                         <div className="px-4 py-3 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                 <ImageIcon className="w-4 h-4 text-red-400" />
                                 <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Thumbnail Preview (16:9)</span>
                             </div>
                             {imageData && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setFullScreenImage({src: `data:image/png;base64,${imageData}`, alt: "Viral Thumbnail"})}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    >
                                        <Maximize className="w-4 h-4" />
                                    </button>
                                    <a 
                                        href={`data:image/png;base64,${imageData}`} 
                                        download="viral-thumbnail.png"
                                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                             )}
                         </div>

                         <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                             {loading ? (
                                 <div className="text-center space-y-4">
                                     <div className="relative w-16 h-16 mx-auto">
                                        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                     </div>
                                     <p className="text-red-400 font-mono text-xs animate-pulse tracking-widest uppercase">{loadingStage}</p>
                                 </div>
                             ) : imageData ? (
                                 <img src={`data:image/png;base64,${imageData}`} alt="Generated Thumbnail" className="w-full h-full object-contain" />
                             ) : (
                                 <div className="text-center text-slate-600">
                                     <Youtube className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                     <p className="font-mono text-xs uppercase tracking-wider opacity-50">Ready to Generate</p>
                                 </div>
                             )}
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Zap className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 font-mono uppercase">CTR Potential</div>
                                <div className="text-sm font-bold text-white">High</div>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                             <div className="p-2 bg-rose-500/10 rounded-lg">
                                <Search className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 font-mono uppercase">Trend Alignment</div>
                                <div className="text-sm font-bold text-white">{useSearch ? "Active" : "Standard"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YouTubeThumbnail;
