
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { generateScriptScene } from '../services/geminiService';
import { ScriptScene } from '../types';
import { Clapperboard, Plus, Loader2, Download, Image as ImageIcon, Trash2, Wand2, FileText, Maximize, Save, Upload, X, Type } from 'lucide-react';
import ImageViewer from './ImageViewer';

const SCENE_STYLES = [
    "Cinematic Realistic",
    "Dark Thriller / Mystery",
    "Bright & Cheerful Vlog",
    "Futuristic Sci-Fi",
    "Hand-Drawn Animation",
    "Minimalist Vector",
    "Vintage Film",
    "Custom"
];

const TEXT_OPTIONS = [
    "No Text (Clean)",
    "Cinematic Label",
    "Bold Title Overlay",
    "Subtle Context Text",
    "Custom"
];

const ScriptVisualizer: React.FC = () => {
  const [globalContext, setGlobalContext] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(SCENE_STYLES[0]);
  const [customStyle, setCustomStyle] = useState('');
  const [textMode, setTextMode] = useState(TEXT_OPTIONS[0]);
  const [customTextInstruction, setCustomTextInstruction] = useState('');
  const [styleReferenceImage, setStyleReferenceImage] = useState<string | null>(null);
  
  const [scenes, setScenes] = useState<ScriptScene[]>([
      { id: '1', segmentText: '', imageData: null, status: 'idle' }
  ]);
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              setGlobalContext(text);
          };
          reader.readAsText(file);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              const base64Data = base64.split(',')[1];
              setStyleReferenceImage(base64Data);
          };
          reader.readAsDataURL(file);
      }
  };

  const addScene = () => {
      const newId = (scenes.length + 1).toString();
      setScenes([...scenes, { id: newId, segmentText: '', imageData: null, status: 'idle' }]);
  };

  const removeScene = (id: string) => {
      if (scenes.length > 1) {
          setScenes(scenes.filter(s => s.id !== id));
      }
  };

  const updateSceneText = (id: string, text: string) => {
      setScenes(scenes.map(s => s.id === id ? { ...s, segmentText: text } : s));
  };

  const generateScene = async (scene: ScriptScene) => {
      if (!scene.segmentText.trim()) return;
      
      // Update status to generating
      setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'generating' } : s));
      
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
      const textToUse = textMode === 'Custom' ? customTextInstruction : textMode;

      try {
          const imageData = await generateScriptScene(scene.segmentText, globalContext, styleToUse, styleReferenceImage, textToUse);
          setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageData, status: imageData ? 'complete' : 'error' } : s));
      } catch (e) {
          setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'error' } : s));
      }
  };

  const generateAll = async () => {
      // Filter idle or error scenes that have text
      const targets = scenes.filter(s => s.segmentText.trim() && (s.status === 'idle' || s.status === 'error'));
      
      // Generate strictly sequentially to avoid hitting rate limits too hard with concurrent complex image reqs
      for (const scene of targets) {
          await generateScene(scene);
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 mb-20">
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-teal-400 via-emerald-200 to-slate-500 font-sans">
          Script <span className="text-teal-500">Visualizer</span>.
        </h2>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          Turn your video script into a storyboard of 16:9 cinematic plates.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar: Context & Settings */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="glass-panel p-6 rounded-3xl space-y-6">
                  
                  {/* Global Script Context */}
                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-teal-400 font-mono tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> GLOBAL_KNOWLEDGE_BASE
                        </label>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                        >
                            <Upload className="w-3 h-3" /> Upload .TXT
                        </button>
                        <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                      </div>
                      
                      <textarea 
                        value={globalContext}
                        onChange={(e) => setGlobalContext(e.target.value)}
                        placeholder="Paste your full video script here or upload a file. This gives the AI context for character consistency, tone, and setting across all scenes."
                        className="w-full h-64 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:ring-1 focus:ring-teal-500/50 resize-none leading-relaxed font-mono"
                      />
                      <div className="text-[10px] text-slate-500 text-right">
                          {globalContext.length} chars
                      </div>
                  </div>

                  {/* Style Selector */}
                  <div className="space-y-2">
                      <label className="text-xs text-teal-400 font-mono tracking-wider flex items-center gap-2">
                            <Wand2 className="w-4 h-4" /> VISUAL_STYLE
                      </label>
                      <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-teal-500/50"
                        >
                            {SCENE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      
                      {selectedStyle === 'Custom' && (
                          <input 
                              type="text"
                              value={customStyle}
                              onChange={(e) => setCustomStyle(e.target.value)}
                              placeholder="Describe your custom style (e.g. '80s Synthwave, Neon Colors')..."
                              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-teal-500/50 animate-in fade-in"
                          />
                      )}
                  </div>

                  {/* Text Overlay Control */}
                  <div className="space-y-2">
                      <label className="text-xs text-teal-400 font-mono tracking-wider flex items-center gap-2">
                            <Type className="w-4 h-4" /> TEXT_GENERATION
                      </label>
                      <select
                            value={textMode}
                            onChange={(e) => setTextMode(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-teal-500/50"
                        >
                            {TEXT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>

                      {textMode === 'Custom' && (
                          <input 
                              type="text"
                              value={customTextInstruction}
                              onChange={(e) => setCustomTextInstruction(e.target.value)}
                              placeholder="Describe how text should appear (e.g. 'Neon sign saying EXIT')"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-teal-500/50 animate-in fade-in"
                          />
                      )}
                  </div>

                  {/* Reference Image Upload */}
                  <div className="space-y-2">
                        <label className="text-xs text-teal-400 font-mono tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> REFERENCE_STYLE_IMAGE (Optional)
                        </label>
                        <div 
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full h-24 border border-dashed border-white/10 rounded-xl bg-slate-950/30 hover:bg-white/5 hover:border-teal-500/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            {styleReferenceImage ? (
                                <>
                                    <img src={`data:image/png;base64,${styleReferenceImage}`} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Reference" />
                                    <div className="relative z-10 flex items-center gap-2">
                                         <div className="bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold flex items-center gap-1 border border-white/10">
                                            <Wand2 className="w-3 h-3 text-teal-400" /> Style Loaded
                                         </div>
                                         <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setStyleReferenceImage(null); }}
                                            className="text-white hover:text-red-400 bg-red-500/20 p-1 rounded-full hover:bg-red-500/30 transition-colors z-20"
                                         >
                                             <X className="w-3 h-3" />
                                         </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                                    <span className="text-xs text-slate-500 font-mono">Upload Reference Image</span>
                                </>
                            )}
                            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </div>
                  </div>

                  <button 
                    onClick={generateAll}
                    disabled={scenes.some(s => s.status === 'generating') || scenes.every(s => !s.segmentText.trim())}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
                  >
                      {scenes.some(s => s.status === 'generating') ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clapperboard className="w-5 h-5" />}
                      Generate All Scenes
                  </button>

              </div>
          </div>

          {/* Main Area: Scenes List */}
          <div className="lg:col-span-8 space-y-6">
              {scenes.map((scene, index) => (
                  <div key={scene.id} className="glass-panel p-1.5 rounded-2xl flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4">
                      
                      {/* Left: Input */}
                      <div className="flex-1 p-4 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 font-mono uppercase">Scene {index + 1}</span>
                              {scenes.length > 1 && (
                                  <button onClick={() => removeScene(scene.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              )}
                          </div>
                          <textarea
                              value={scene.segmentText}
                              onChange={(e) => updateSceneText(scene.id, e.target.value)}
                              placeholder={`Script segment for scene ${index + 1}...`}
                              className="w-full h-32 bg-slate-900/50 border border-white/5 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-teal-500/50 resize-none"
                          />
                          <div className="mt-auto">
                              <button
                                onClick={() => generateScene(scene)}
                                disabled={scene.status === 'generating' || !scene.segmentText.trim()}
                                className="px-4 py-2 bg-slate-800 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-white/5 hover:border-teal-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                              >
                                  {scene.status === 'generating' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                  {scene.status === 'generating' ? "Generating..." : "Generate Image"}
                              </button>
                          </div>
                      </div>

                      {/* Right: Output */}
                      <div className="w-full md:w-[320px] bg-slate-950 rounded-xl relative overflow-hidden aspect-video border border-white/5 group flex-shrink-0">
                          {scene.imageData ? (
                              <>
                                <img src={`data:image/png;base64,${scene.imageData}`} alt={`Scene ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <button 
                                        onClick={() => setFullScreenImage({src: `data:image/png;base64,${scene.imageData!}`, alt: `Scene ${index + 1}`})}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                                    >
                                        <Maximize className="w-4 h-4" />
                                    </button>
                                    <a 
                                        href={`data:image/png;base64,${scene.imageData}`}
                                        download={`scene-${index + 1}.png`}
                                        className="p-2 bg-teal-500/50 hover:bg-teal-500 rounded-lg text-white transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                              </>
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                                   {scene.status === 'generating' ? (
                                       <>
                                        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2" />
                                        <span className="text-xs font-mono text-teal-400">Rendering...</span>
                                       </>
                                   ) : (
                                       <>
                                        <ImageIcon className="w-8 h-8 opacity-20 mb-2" />
                                        <span className="text-xs font-mono opacity-50">16:9 Output</span>
                                       </>
                                   )}
                              </div>
                          )}
                          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-slate-400 border border-white/5">
                              IMG_{index + 1}
                          </div>
                      </div>

                  </div>
              ))}

              <button 
                onClick={addScene}
                className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
              >
                  <Plus className="w-5 h-5" /> Add Next Scene
              </button>
          </div>
      </div>
    </div>
  );
};

export default ScriptVisualizer;
