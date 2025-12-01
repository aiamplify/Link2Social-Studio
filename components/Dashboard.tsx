
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import ArticleToInfographic from './ArticleToInfographic';
import ArticleToCarousel from './ArticleToCarousel';
import BlogToBlog from './BlogToBlog';
import YouTubeThumbnail from './YouTubeThumbnail';
import BrollCreator from './BrollCreator';
import ScriptVisualizer from './ScriptVisualizer';
import Home from './Home';
import IntroAnimation from './IntroAnimation';
import ApiKeyModal from './ApiKeyModal';
import { ViewMode, ArticleHistoryItem, BlogPostResult } from '../types';
import { Github, PenTool, FileText, Home as HomeIcon, CreditCard, Share2, Layout, Youtube, Video, LogOut, Clapperboard } from 'lucide-react';

interface DashboardProps {
    onPublishPost: (post: BlogPostResult) => void;
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPublishPost, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.HOME);
  const [showIntro, setShowIntro] = useState(true);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  
  // Lifted History State for Persistence
  const [articleHistory, setArticleHistory] = useState<ArticleHistoryItem[]>([]);

  useEffect(() => {
    const checkKey = async () => {
      // Check if we're in AI Studio environment
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        // For local development, check if API key exists in environment
        // Vite injects process.env.API_KEY at build time as a string literal
        // @ts-ignore - process.env is injected by Vite
        const apiKey = process.env.API_KEY;
        const hasLocalKey = apiKey && apiKey !== 'undefined' && apiKey.length > 0;
        console.log('API Key check:', hasLocalKey ? 'Found' : 'Not found');
        setHasApiKey(hasLocalKey);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleNavigate = (mode: ViewMode) => {
    setCurrentView(mode);
  };

  const handleAddArticleHistory = (item: ArticleHistoryItem) => {
    setArticleHistory(prev => [item, ...prev]);
  };

  if (checkingKey) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Enforce API Key Modal */}
      {!hasApiKey && <ApiKeyModal onKeySelected={() => setHasApiKey(true)} />}

      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <header className="sticky top-4 z-50 mx-auto w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] max-w-[1400px]">
        <div className="glass-panel rounded-2xl px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <button 
            onClick={() => setCurrentView(ViewMode.HOME)}
            className="flex items-center gap-3 md:gap-4 group transition-opacity hover:opacity-80"
          >
            <div className="relative flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-slate-900/50 border border-white/10 shadow-inner group-hover:border-emerald-500/50 transition-colors">
               <Share2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
                Link2Social <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-400 border border-white/5 hidden sm:inline-block">Studio</span>
              </h1>
              <p className="text-xs font-mono text-slate-400 tracking-wider uppercase hidden sm:block">Visual Intelligence Platform</p>
            </div>
          </button>
          <div className="flex items-center gap-4">
            {hasApiKey && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-widest cursor-help" title="API Key Active">
                    <CreditCard className="w-3 h-3" /> Paid Tier
                </div>
            )}
            <button 
                onClick={onLogout}
                className="p-2 md:p-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-red-300 hover:border-red-500/30 transition-all"
                title="Logout"
            >
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Navigation Tabs (Hidden on Home, visible on tools) */}
        {currentView !== ViewMode.HOME && (
            <div className="flex justify-center mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 sticky top-24 z-40">
            <div className="glass-panel p-1 md:p-1.5 rounded-full flex relative shadow-2xl bg-black/20 backdrop-blur-xl max-w-full overflow-x-auto no-scrollbar">
                <button
                onClick={() => setCurrentView(ViewMode.HOME)}
                className="relative flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono text-slate-500 hover:text-slate-300 hover:bg-white/5 flex-shrink-0"
                title="Home"
                >
                <HomeIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-white/10 my-auto mx-1 flex-shrink-0"></div>
                
                <button
                onClick={() => setCurrentView(ViewMode.ARTICLE_INFOGRAPHIC)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono flex-shrink-0 ${
                    currentView === ViewMode.ARTICLE_INFOGRAPHIC
                    ? 'text-emerald-100 bg-emerald-500/10 shadow-glass-inset border border-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Bundle</span>
                </button>

                <button
                onClick={() => setCurrentView(ViewMode.CAROUSEL_GENERATOR)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono flex-shrink-0 ${
                    currentView === ViewMode.CAROUSEL_GENERATOR
                    ? 'text-sky-100 bg-sky-500/10 shadow-glass-inset border border-sky-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                >
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">Carousel</span>
                </button>

                <button
                onClick={() => setCurrentView(ViewMode.BLOG_TO_BLOG)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono flex-shrink-0 ${
                    currentView === ViewMode.BLOG_TO_BLOG
                    ? 'text-orange-100 bg-orange-500/10 shadow-glass-inset border border-orange-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Remix</span>
                </button>

                <button
                onClick={() => setCurrentView(ViewMode.YOUTUBE_THUMBNAIL)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono flex-shrink-0 ${
                    currentView === ViewMode.YOUTUBE_THUMBNAIL
                    ? 'text-red-100 bg-red-500/10 shadow-glass-inset border border-red-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                >
                <Youtube className="w-4 h-4" />
                <span className="hidden sm:inline">Thumbnail</span>
                </button>

                 <button
                onClick={() => setCurrentView(ViewMode.VIDEO_BROLL)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono flex-shrink-0 ${
                    currentView === ViewMode.VIDEO_BROLL
                    ? 'text-indigo-100 bg-indigo-500/10 shadow-glass-inset border border-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Veo B-Roll</span>
                </button>

                <button
                onClick={() => setCurrentView(ViewMode.VIDEO_SCRIPT_VISUALIZER)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono flex-shrink-0 ${
                    currentView === ViewMode.VIDEO_SCRIPT_VISUALIZER
                    ? 'text-teal-100 bg-teal-500/10 shadow-glass-inset border border-teal-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                >
                <Clapperboard className="w-4 h-4" />
                <span className="hidden sm:inline">Script Viz</span>
                </button>
            </div>
            </div>
        )}

        <div className="flex-1">
            {currentView === ViewMode.HOME && (
                <Home onNavigate={handleNavigate} />
            )}
            {currentView === ViewMode.ARTICLE_INFOGRAPHIC && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <ArticleToInfographic 
                        history={articleHistory} 
                        onAddToHistory={handleAddArticleHistory}
                    />
                </div>
            )}
            {currentView === ViewMode.CAROUSEL_GENERATOR && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <ArticleToCarousel />
                </div>
            )}
            {currentView === ViewMode.BLOG_TO_BLOG && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <BlogToBlog onPublish={onPublishPost} />
                </div>
            )}
            {currentView === ViewMode.YOUTUBE_THUMBNAIL && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <YouTubeThumbnail />
                </div>
            )}
            {currentView === ViewMode.VIDEO_BROLL && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <BrollCreator />
                </div>
            )}
            {currentView === ViewMode.VIDEO_SCRIPT_VISUALIZER && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <ScriptVisualizer />
                </div>
            )}
        </div>
      </main>

      <footer className="py-6 mt-auto border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center px-4">
          <p className="text-xs font-mono text-slate-600">
            <span className="text-emerald-500/70">link</span>:<span className="text-emerald-500/70">social</span>$ Powered by Nano Banana Pro & Veo
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
