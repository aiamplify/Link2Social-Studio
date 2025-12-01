/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { generateArticleInfographic } from '../services/geminiService';
import { Citation, ArticleHistoryItem, SocialPost } from '../types';
import { Link, Loader2, Download, Sparkles, AlertCircle, Palette, Globe, ExternalLink, BookOpen, Clock, Maximize, Copy, Check, Linkedin, Twitter, Instagram, Facebook, Share2, Cloud, AtSign, MessageSquare, Type, AlignLeft } from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';

interface ArticleToInfographicProps {
    history: ArticleHistoryItem[];
    onAddToHistory: (item: ArticleHistoryItem) => void;
}

const SKETCH_STYLES = [
    "Modern Editorial",
    "Fun & Playful",
    "Clean Minimalist",
    "Dark Mode Tech",
    "Custom"
];

const LANGUAGES = [
  { label: "English (US)", value: "English" },
  { label: "Arabic (Egypt)", value: "Arabic" },
  { label: "German (Germany)", value: "German" },
  { label: "Spanish (Mexico)", value: "Spanish" },
  { label: "French (France)", value: "French" },
  { label: "Hindi (India)", value: "Hindi" },
  { label: "Indonesian (Indonesia)", value: "Indonesian" },
  { label: "Italian (Italy)", value: "Italian" },
  { label: "Japanese (Japan)", value: "Japanese" },
  { label: "Korean (South Korea)", value: "Korean" },
  { label: "Portuguese (Brazil)", value: "Portuguese" },
  { label: "Russian (Russia)", value: "Russian" },
  { label: "Ukrainian (Ukraine)", value: "Ukrainian" },
  { label: "Vietnamese (Vietnam)", value: "Vietnamese" },
  { label: "Chinese (China)", value: "Chinese" },
];

const PLATFORMS = [
    { id: 'LinkedIn', label: 'LinkedIn', icon: Linkedin },
    { id: 'Twitter', label: 'X / Twitter', icon: Twitter },
    { id: 'Instagram', label: 'Instagram', icon: Instagram },
    { id: 'Facebook', label: 'Facebook', icon: Facebook },
    { id: 'BlueSky', label: 'BlueSky', icon: Cloud },
    { id: 'Threads', label: 'Threads', icon: AtSign },
    { id: 'Reddit', label: 'Reddit', icon: MessageSquare }
];

const ArticleToInfographic: React.FC<ArticleToInfographicProps> = ({ history, onAddToHistory }) => {
  const [inputMode, setInputMode] = useState<'url' | 'prompt'>('url');
  const [inputValue, setInputValue] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(SKETCH_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['LinkedIn', 'Twitter']);
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<SocialPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('');
  const [copiedPostIndex, setCopiedPostIndex] = useState<number | null>(null);
  
  // Viewer State
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);

  const togglePlatform = (platform: string) => {
      setSelectedPlatforms(prev => 
          prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
      );
  };

  const copyToClipboard = (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedPostIndex(index);
      setTimeout(() => setCopiedPostIndex(null), 2000);
  };

  const addToHistory = (input: string, image: string, cites: Citation[], posts: SocialPost[]) => {
      let title = input;
      if (inputMode === 'url') {
        try { title = new URL(input).hostname; } catch(e) {}
      } else {
        title = input.length > 30 ? input.substring(0, 30) + '...' : input;
      }
      
      const newItem: ArticleHistoryItem = {
          id: Date.now().toString(),
          title: title,
          url: inputMode === 'url' ? input : 'Text Prompt',
          imageData: image,
          citations: cites,
          socialPosts: posts,
          date: new Date()
      };
      onAddToHistory(newItem);
  };

  const loadFromHistory = (item: ArticleHistoryItem) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Infer mode from URL field check
      if (item.url === 'Text Prompt') {
          setInputMode('prompt');
          setInputValue(item.title); // We stored snippet in title, roughly
      } else {
          setInputMode('url');
          setInputValue(item.url);
      }
      
      setImageData(item.imageData);
      setCitations(item.citations);
      setGeneratedPosts(item.socialPosts || []);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
        setError(inputMode === 'url' ? "Please provide a valid URL." : "Please enter a topic or text.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setImageData(null);
    setCitations([]);
    setGeneratedPosts([]);
    setLoadingStage('INITIALIZING...');

    try {
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
      const { imageData: resultImage, citations: resultCitations, socialPosts: resultPosts } = await generateArticleInfographic(
          inputValue,
          inputMode,
          styleToUse, 
          selectedPlatforms,
          (stage) => {
            setLoadingStage(stage);
          }, 
          selectedLanguage
      );
      
      if (resultImage) {
          setImageData(resultImage);
          setCitations(resultCitations);
          setGeneratedPosts(resultPosts);
          addToHistory(inputValue, resultImage, resultCitations, resultPosts);
      } else {
          throw new Error("Failed to generate infographic content.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 mb-20">
      
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 via-teal-200 to-slate-500 font-sans">
          Link<span className="text-emerald-400">2Social</span>.
        </h2>
        <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide">
          Convert web articles or topics into viral social media posts and stunning infographics.
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-panel rounded-3xl p-6 md:p-10 space-y-8 relative z-10">
         <form onSubmit={handleGenerate} className="space-y-8">
            
            <div className="space-y-4">
                {/* Input Mode Toggle */}
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <button
                        type="button"
                        onClick={() => setInputMode('url')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono transition-all ${
                            inputMode === 'url' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Link className="w-4 h-4" /> Link Mode
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMode('prompt')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono transition-all ${
                            inputMode === 'prompt' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Type className="w-4 h-4" /> Topic / Prompt
                    </button>
                </div>

                <label className="text-xs text-emerald-400 font-mono tracking-wider flex items-center gap-2">
                    {inputMode === 'url' ? <Link className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
                    {inputMode === 'url' ? 'SOURCE_URL' : 'TOPIC_OR_TEXT'}
                </label>
                
                <div className="relative">
                    {inputMode === 'url' ? (
                        <input
                            type="url"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="https://example.com/interesting-article"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-lg text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono transition-all shadow-inner"
                        />
                    ) : (
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Describe a topic (e.g. 'Benefits of Meditation') or paste text here..."
                            className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-lg text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono transition-all shadow-inner resize-none leading-relaxed"
                        />
                    )}
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700">
                        <Sparkles className="w-5 h-5 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Configuration Grid */}
            <div className="grid md:grid-cols-12 gap-8">
                
                {/* Platforms Column */}
                <div className="md:col-span-4 space-y-4">
                    <label className="text-xs text-emerald-400 font-mono tracking-wider flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> TARGET_PLATFORMS
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {PLATFORMS.map(p => {
                            const Icon = p.icon;
                            const isSelected = selectedPlatforms.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => togglePlatform(p.id)}
                                    className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all border ${
                                        isSelected 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                        : 'bg-slate-950/50 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                                >
                                    <div className={`w-4 h-4 flex items-center justify-center rounded ${isSelected ? 'bg-emerald-500/20' : 'bg-transparent'} flex-shrink-0`}>
                                        {isSelected && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                                    </div>
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="font-mono text-[11px] md:text-xs truncate">{p.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Style & Language Column */}
                <div className="md:col-span-8 space-y-6">
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-xs text-emerald-400 font-mono tracking-wider flex items-center gap-2">
                                <Palette className="w-4 h-4" /> ARTISTIC_STYLE
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {SKETCH_STYLES.map(style => (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => setSelectedStyle(style)}
                                        className={`py-2 px-2 rounded-xl font-mono text-[11px] transition-all border whitespace-nowrap truncate ${
                                            selectedStyle === style 
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                            : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                            {selectedStyle === 'Custom' && (
                                <input 
                                    type="text" 
                                    value={customStyle}
                                    onChange={(e) => setCustomStyle(e.target.value)}
                                    placeholder="Describe custom style..."
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono transition-all"
                                />
                            )}
                        </div>

                        <div className="space-y-4 min-w-0">
                            <label className="text-xs text-emerald-400 font-mono tracking-wider flex items-center gap-2">
                                <Globe className="w-4 h-4" /> OUTPUT_LANGUAGE
                            </label>
                            <div className="relative w-full min-w-0">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono appearance-none cursor-pointer hover:bg-white/5 transition-colors truncate pr-8"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-300">
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || !inputValue.trim()}
                            className="w-full py-5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-mono text-base tracking-wider hover:shadow-neon-emerald group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            {loading ? "GENERATING CONTENT..." : "CREATE SOCIAL BUNDLE"}
                        </button>
                    </div>
                </div>
            </div>
         </form>
      </div>

      {error && (
        <div className="glass-panel border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in font-mono text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <LoadingState message={loadingStage || 'READING_CONTENT'} type="article" />
      )}

      {/* Result Section */}
      {imageData && !loading && (
        <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* Left Column: Infographic */}
            <div className="glass-panel rounded-3xl p-1.5 h-fit">
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 mb-1.5 bg-slate-950/30 rounded-t-2xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Generated_Visual
                    </h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setFullScreenImage({src: `data:image/png;base64,${imageData}`, alt: "Article Sketch"})}
                            className="text-xs flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-mono p-1.5 rounded-lg hover:bg-white/10"
                            title="Full Screen"
                        >
                            <Maximize className="w-4 h-4" />
                        </button>
                        <a href={`data:image/png;base64,${imageData}`} download="site-sketch.png" className="text-xs flex items-center gap-2 text-emerald-300 hover:text-emerald-200 transition-colors font-mono bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 font-bold">
                            <Download className="w-4 h-4" /> PNG
                        </a>
                    </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-[#eef8fe] relative group">
                    {selectedStyle === "Dark Mode Tech" && <div className="absolute inset-0 bg-slate-950 pointer-events-none mix-blend-multiply" />}
                    <div className="absolute inset-0 bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <img src={`data:image/png;base64,${imageData}`} alt="Generated Infographic" className="w-full h-auto object-contain max-h-[600px] mx-auto relative z-10" />
                </div>
            </div>

            {/* Right Column: Social Posts */}
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl h-full">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider mb-6">
                        <Share2 className="w-5 h-5 text-emerald-400" /> Social_Drafts
                    </h3>
                    
                    <div className="space-y-4">
                        {generatedPosts.map((post, idx) => (
                            <div key={idx} className="bg-slate-950/50 border border-white/5 rounded-2xl overflow-hidden group transition-all hover:border-emerald-500/30">
                                <div className="px-4 py-3 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wider">{post.platform}</span>
                                    <button 
                                        onClick={() => copyToClipboard(post.content, idx)}
                                        className="text-slate-500 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] uppercase font-mono"
                                    >
                                        {copiedPostIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        {copiedPostIndex === idx ? 'Copied' : 'Copy Text'}
                                    </button>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                                        {post.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        
                        {generatedPosts.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-sm font-mono">No text drafts generated.</p>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Citations Compact */}
                {citations.length > 0 && (
                    <div className="glass-panel p-4 rounded-2xl">
                         <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 font-mono uppercase">
                            <BookOpen className="w-3 h-3" /> Sources
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {citations.map((cite, idx) => (
                                <a 
                                    key={idx}
                                    href={cite.uri}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-slate-400 hover:text-emerald-300 transition-colors border border-white/5 flex items-center gap-2 max-w-full truncate"
                                >
                                    <Globe className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{cite.title || "Source"}</span>
                                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
      
      {/* History Section */}
      {history.length > 0 && (
          <div className="pt-12 border-t border-white/5 animate-in fade-in">
              <div className="flex items-center gap-2 mb-6 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <h3 className="text-sm font-mono uppercase tracking-wider">Recent Creations</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="group bg-slate-900/50 border border-white/5 hover:border-emerald-500/50 rounded-xl overflow-hidden text-left transition-all hover:shadow-neon-emerald"
                      >
                          <div className="aspect-video relative overflow-hidden bg-slate-950">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-2 right-2 flex gap-1">
                                  {item.socialPosts?.length > 0 && (
                                      <span className="bg-black/60 backdrop-blur text-emerald-400 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                                          +{item.socialPosts.length} Posts
                                      </span>
                                  )}
                              </div>
                          </div>
                          <div className="p-3">
                              <p className="text-xs font-bold text-white truncate font-mono">{item.title}</p>
                              <p className="text-[10px] text-slate-500 mt-1 truncate">
                                {item.url === 'Text Prompt' ? 'Topic Mode' : new URL(item.url).hostname}
                              </p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default ArticleToInfographic;