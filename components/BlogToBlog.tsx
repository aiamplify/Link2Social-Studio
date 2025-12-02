
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { generateBlogFromArticle, regenerateBlogVisual } from '../services/geminiService';
import { BlogPostResult, BlogVisual } from '../types';
import { RefreshCw, Loader2, AlertCircle, FileText, Download, Copy, Check, Image as ImageIcon, Sparkles, Globe, Palette, Maximize, Edit3, Code, Eye, Upload, Wand2, X, Box, Send, Search, Type } from 'lucide-react';
import ImageViewer from './ImageViewer';

const LANGUAGES = [
  { label: "English (US)", value: "English" },
  { label: "Spanish (Mexico)", value: "Spanish" },
  { label: "French (France)", value: "French" },
  { label: "German (Germany)", value: "German" },
  { label: "Portuguese (Brazil)", value: "Portuguese" },
  { label: "Japanese (Japan)", value: "Japanese" },
];

const VISUAL_STYLES = [
    "Modern Digital Art",
    "Photorealistic",
    "Minimalist Vector",
    "Tech Isometric",
    "Hand-Drawn Sketch",
    "Graphic Novel",
    "Custom"
];

const LENGTH_OPTIONS = [
    { label: "Short (~500 words)", value: "Short" },
    { label: "Medium (~1000 words)", value: "Medium" },
    { label: "Long (~2000 words)", value: "Long" },
    { label: "Extensive (~3000 words)", value: "Extensive" }
];

const FONT_OPTIONS = [
    { label: "Merriweather (Serif)", value: "Merriweather, serif" },
    { label: "Inter (Sans)", value: "Inter, sans-serif" },
    { label: "Roboto (Sans)", value: "Roboto, sans-serif" },
    { label: "Open Sans (Sans)", value: "Open Sans, sans-serif" },
    { label: "Playfair Display (Serif)", value: "Playfair Display, serif" },
    { label: "JetBrains Mono (Mono)", value: "JetBrains Mono, monospace" },
    { label: "Custom", value: "Custom" }
];

const IMAGE_COUNT_OPTIONS = [0, 1, 3, 5, 8, 10];

interface BlogToBlogProps {
    onPublish?: (post: BlogPostResult) => void;
}

const BlogToBlog: React.FC<BlogToBlogProps> = ({ onPublish }) => {
  // Input Modes
  const [inputMode, setInputMode] = useState<'url' | 'file' | 'topic'>('url');
  
  // Inputs
  const [urlInput, setUrlInput] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Config
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [selectedStyle, setSelectedStyle] = useState(VISUAL_STYLES[0]);
  const [customStyle, setCustomStyle] = useState('');
  const [selectedLength, setSelectedLength] = useState<'Short' | 'Medium' | 'Long' | 'Extensive'>('Medium');
  const [imageCount, setImageCount] = useState(3);
  
  // Font
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  const [customFont, setCustomFont] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlogPostResult | null>(null);
  
  // View Modes
  const [viewMode, setViewMode] = useState<'visual' | 'edit' | 'html'>('visual');
  const [editContent, setEditContent] = useState('');
  
  const [copiedContent, setCopiedContent] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);
  
  // Image Editing State
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // For text file upload
  const [activeImageId, setActiveImageId] = useState<string | null>(null); // Track which image is being replaced
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              setFileContent(text);
          };
          reader.readAsText(file);
      }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (inputMode === 'url' && !urlInput.trim()) {
        setError("Please provide a valid URL.");
        return;
    }
    if (inputMode === 'file' && !fileContent.trim()) {
        setError("Please upload a text file with content.");
        return;
    }
    if (inputMode === 'topic' && !instructions.trim()) {
        setError("Please provide a topic or instructions for research.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setIsPublished(false);
    setViewMode('visual');
    
    try {
        const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
        
        let source: { type: 'url' | 'text' | 'topic', content: string };
        if (inputMode === 'url') {
            source = { type: 'url', content: urlInput };
        } else if (inputMode === 'file') {
            source = { type: 'text', content: fileContent };
        } else {
            source = { type: 'topic', content: instructions }; // Instructions double as topic here
        }

        const data = await generateBlogFromArticle(
            source,
            instructions,
            selectedLength,
            imageCount,
            styleToUse, 
            selectedLanguage, 
            (stage) => setLoadingStage(stage)
        );
        setResult(data);
        setEditContent(data.content);
    } catch (err: any) {
        setError(err.message || "Failed to remix blog post.");
    } finally {
        setLoading(false);
    }
  };

  const handleRegenerateImage = async (visual: BlogVisual) => {
      setRegeneratingId(visual.id);
      try {
          const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
          const newData = await regenerateBlogVisual(visual, styleToUse);
          if (newData && result) {
              const updatedVisuals = result.visuals.map(v => 
                  v.id === visual.id ? { ...v, imageData: newData } : v
              );
              setResult({ ...result, visuals: updatedVisuals });
          }
      } catch (e) {
          console.error("Failed to regenerate", e);
      } finally {
          setRegeneratingId(null);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeImageId && result) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              const updatedVisuals = result.visuals.map(v => 
                  v.id === activeImageId ? { ...v, imageData: base64 } : v
              );
              setResult({ ...result, visuals: updatedVisuals });
              setActiveImageId(null);
          };
          reader.readAsDataURL(file);
      }
  };

  const triggerImageUpload = (id: string) => {
      setActiveImageId(id);
      setTimeout(() => imageInputRef.current?.click(), 100);
  };

  const copyHtml = () => {
      if (!result) return;
      const html = generateHtmlCode();
      navigator.clipboard.writeText(html);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
  };
  
  const handlePublish = () => {
      if (result && onPublish) {
          // Pass the edited content if modified
          const finalPost = { ...result, content: editContent };
          onPublish(finalPost);
          setIsPublished(true);
      }
  };

  const getActiveFont = () => {
      return selectedFont === 'Custom' ? customFont : selectedFont;
  };

  const generateHtmlCode = () => {
      if (!result) return "";
      const font = getActiveFont();

      // Generate clean HTML content without the full document wrapper for CMS pasting
      let html = `<!-- Blog Post: ${result.title} -->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Inter:wght@400;600;800&family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&family=Roboto:wght@400;700&display=swap');

  /* Base Typography */
  .blog-content { font-family: ${font || 'sans-serif'}; line-height: 1.8; color: #334155; max-width: 800px; margin: 0 auto; }
  .blog-content h1, .blog-content h2, .blog-content h3 { font-family: 'Inter', sans-serif; color: #0f172a; }
  .blog-content h1 { font-size: 2.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.5em; }
  .blog-content h2 { font-size: 1.75rem; font-weight: 700; margin-top: 2.5em; margin-bottom: 1em; color: #1e293b; }
  .blog-content h3 { font-size: 1.4rem; font-weight: 600; margin-top: 2em; margin-bottom: 0.75em; color: #1e293b; }
  .blog-content p { margin-bottom: 1.5em; font-size: 1.1rem; }

  /* Metadata & Subtitle */
  .blog-meta { font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 2em; letter-spacing: 0.05em; }
  .blog-subtitle { font-size: 1.25rem; color: #475569; margin-bottom: 1.5em; font-style: italic; line-height: 1.6; }

  /* Highlight Links - Blue clickable-looking text */
  .highlight-link { color: #2563eb; font-weight: 500; text-decoration: none; cursor: pointer; }
  .highlight-link:hover { text-decoration: underline; }
  .blue { color: #2563eb; font-weight: 500; }

  /* Images & Figures */
  .blog-content figure { margin: 2em 0; }
  .blog-content img { width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .blog-content figcaption { text-align: center; font-size: 0.9rem; color: #64748b; margin-top: 1em; line-height: 1.5; }
  .blog-content .prompt-note { text-align: center; font-size: 0.85rem; color: #94a3b8; font-style: italic; margin-top: 0.5em; }

  /* Image Carousel */
  .image-carousel { position: relative; margin: 2em 0; overflow: hidden; border-radius: 12px; background: #f8fafc; }
  .carousel-track { display: flex; transition: transform 0.3s ease-in-out; }
  .carousel-slide { min-width: 100%; box-sizing: border-box; padding: 1em; }
  .carousel-slide img { width: 100%; border-radius: 8px; }
  .carousel-slide figcaption { padding: 0.5em 0; }
  .carousel-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.9); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.2em; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; }
  .carousel-nav:hover { background: white; }
  .carousel-nav.prev { left: 10px; }
  .carousel-nav.next { right: 10px; }
  .carousel-dots { display: flex; justify-content: center; gap: 8px; padding: 1em 0; }
  .carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; cursor: pointer; border: none; }
  .carousel-dot.active { background: #3b82f6; }

  /* Lists */
  .blog-content ul { margin: 1em 0 1.5em 1.5em; }
  .blog-content li { margin-bottom: 0.5em; font-size: 1.1rem; }
</style>

<article class="blog-content">
  <h1>${result.title}</h1>
  ${result.subtitle ? `<p class="blog-subtitle">${result.subtitle}</p>` : ''}
  <div class="blog-meta">${result.metadata}</div>
`;

      // Header Image
      const headerImg = result.visuals.find(v => v.id === "header");
      if (headerImg?.imageData) {
          html += `  <figure>\n    <img src="data:image/png;base64,${headerImg.imageData}" alt="${headerImg.caption}" />\n    <figcaption>${headerImg.caption}</figcaption>\n  </figure>\n`;
      }

      // Body Content replacement
      let processedContent = editContent;

      // Remove carousel markers for now - we'll process them separately
      processedContent = processedContent.replace(/\[\[IMAGE_CAROUSEL_START\]\]/g, '<div class="image-carousel"><div class="carousel-track">');
      processedContent = processedContent.replace(/\[\[IMAGE_CAROUSEL_END\]\]/g, '</div><div class="carousel-dots"></div></div>');

      // Convert Markdown to HTML tags
      processedContent = processedContent
        .replace(/^# (.*$)/gim, '') // Remove H1 as we added title manually
        .replace(/^## (.*$)/gim, '  <h2>$1</h2>')
        .replace(/^### (.*$)/gim, '  <h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/^\- (.*$)/gim, '  <li>$1</li>')
        .replace(/<prompt-note>(.*?)<\/prompt-note>/gis, '<p class="prompt-note">$1</p>')
        .replace(/\n\n/gim, '</p>\n  <p>')
        .replace(/<\/li>\n  <p>/g, '</li>\n')
        .replace(/<\/p><li>/g, '<ul><li>') // Basic list start handling
        .replace(/<\/li><\/ul>/g, '</li></ul>')
        .replace(/^([^<].*)/, '  <p>$1'); // Wrap start

      // Replace image placeholders
      result.visuals.forEach((v, idx) => {
          if (v.id !== 'header') {
             const placeholder = `[[IMAGE_${v.id.split('_')[1]}]]`;
             if (processedContent.includes(placeholder) && v.imageData) {
                 // Check if inside carousel
                 const isInCarousel = processedContent.indexOf(placeholder) > processedContent.lastIndexOf('carousel-track') &&
                                      processedContent.indexOf(placeholder) < processedContent.indexOf('carousel-dots', processedContent.lastIndexOf('carousel-track'));

                 const imgTag = isInCarousel
                     ? `<div class="carousel-slide"><figure><img src="data:image/png;base64,${v.imageData}" alt="${v.caption}" /><figcaption>${v.caption}</figcaption></figure></div>`
                     : `</p>\n  <figure>\n    <img src="data:image/png;base64,${v.imageData}" alt="${v.caption}" />\n    <figcaption>${v.caption}</figcaption>\n  </figure>\n  <p>`;
                 processedContent = processedContent.replace(placeholder, imgTag);
             } else {
                 processedContent = processedContent.replace(placeholder, '');
             }
          }
      });

      html += processedContent;

      // Add carousel JavaScript if carousels exist
      if (processedContent.includes('image-carousel')) {
          html += `
<script>
document.querySelectorAll('.image-carousel').forEach((carousel, carouselIdx) => {
  const track = carousel.querySelector('.carousel-track');
  const slides = carousel.querySelectorAll('.carousel-slide');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  let currentSlide = 0;

  // Create dots
  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (idx === 0 ? ' active' : '');
    dot.onclick = () => goToSlide(idx);
    dotsContainer.appendChild(dot);
  });

  // Create nav buttons
  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-nav prev';
  prevBtn.innerHTML = '‹';
  prevBtn.onclick = () => goToSlide(currentSlide - 1);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-nav next';
  nextBtn.innerHTML = '›';
  nextBtn.onclick = () => goToSlide(currentSlide + 1);

  carousel.appendChild(prevBtn);
  carousel.appendChild(nextBtn);

  function goToSlide(idx) {
    currentSlide = (idx + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
    dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.className = 'carousel-dot' + (i === currentSlide ? ' active' : '');
    });
  }
});
</script>`;
      }

      html += `\n</article>`;
      return html;
  };

  // Helper to render content with inline interactive images
  const renderContentWithImages = () => {
      if (!result) return null;

      // Clean content - remove carousel markers and figcaption/prompt-note tags for preview parsing
      let cleanContent = editContent
          .replace(/\[\[IMAGE_CAROUSEL_START\]\]/g, '')
          .replace(/\[\[IMAGE_CAROUSEL_END\]\]/g, '');

      const parts = cleanContent.split(/(\[\[IMAGE_\d+\]\])/g);
      const fontStyle = { fontFamily: getActiveFont().split(',')[0] }; // Simple apply for preview

      // Track figcaptions and prompt notes for each image
      const extractCaptionAndPrompt = (content: string, imageIndex: number) => {
          const regex = new RegExp(`\\[\\[IMAGE_${imageIndex}\\]\\]\\s*(?:<figcaption>(.*?)<\\/figcaption>)?\\s*(?:<prompt-note>(.*?)<\\/prompt-note>)?`, 'is');
          const match = editContent.match(regex);
          return {
              figcaption: match?.[1]?.trim() || null,
              promptNote: match?.[2]?.trim() || null
          };
      };

      // We render this in "Dark Mode" for the App UI, but using the fonts requested.
      return (
          <div className="text-[1.1rem] leading-[1.8] text-slate-300" style={fontStyle}>
              {parts.map((part, idx) => {
                  const match = part.match(/\[\[IMAGE_(\d+)\]\]/);
                  if (match) {
                      const imgIndex = parseInt(match[1]);
                      const visual = result.visuals.find(v => v.id === `image_${imgIndex}`);
                      const { figcaption, promptNote } = extractCaptionAndPrompt(editContent, imgIndex);

                      if (visual) {
                          return (
                              <div key={idx} className="my-12 group relative rounded-xl overflow-hidden shadow-lg border border-white/10 bg-slate-950">
                                   {visual.imageData ? (
                                       <img src={`data:image/png;base64,${visual.imageData}`} alt={visual.caption} className="w-full h-auto object-cover" />
                                   ) : (
                                       <div className="flex items-center justify-center h-64 w-full bg-slate-900 text-slate-500 text-sm">Generating Visual...</div>
                                   )}

                                   {/* Caption & Prompt Note */}
                                   <div className="py-3 px-4 text-center bg-slate-900/80 border-t border-white/5">
                                       <div className="text-sm font-medium text-slate-400 font-sans">
                                           {figcaption || visual.caption}
                                       </div>
                                       {promptNote && (
                                           <div className="text-xs text-slate-500 mt-1 italic font-sans">
                                               {promptNote}
                                           </div>
                                       )}
                                   </div>

                                   {/* Controls Overlay */}
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-10">
                                       <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRegenerateImage(visual)}
                                                disabled={regeneratingId === visual.id}
                                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-colors font-sans"
                                            >
                                                {regeneratingId === visual.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                Re-Roll
                                            </button>
                                            <button
                                                onClick={() => triggerImageUpload(visual.id)}
                                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-colors border border-white/10 font-sans"
                                            >
                                                <Upload className="w-3 h-3" /> Replace
                                            </button>
                                       </div>
                                       <span className="text-[10px] text-slate-300 font-mono max-w-[80%] text-center px-4">{visual.prompt}</span>
                                   </div>
                              </div>
                          );
                      }
                      return null;
                  } else {
                      // Render Markdown Text - skip figcaption and prompt-note tags
                      const filteredPart = part
                          .replace(/<figcaption>.*?<\/figcaption>/gis, '')
                          .replace(/<prompt-note>.*?<\/prompt-note>/gis, '');

                      return (
                          <span key={idx} className="prose prose-invert max-w-none prose-headings:font-sans prose-headings:font-bold prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-strong:font-bold">
                             {filteredPart.split('\n').map((line, i) => {
                                 if (!line.trim()) return <br key={i}/>;
                                 if (line.startsWith('# ')) return null; // Skip title as handled elsewhere

                                 // Category headers (larger, bolder)
                                 if (line.startsWith('## ')) {
                                     return <h2 key={i} className="text-2xl font-bold mt-14 mb-6 font-sans text-white border-b border-white/10 pb-3">{line.replace('## ', '')}</h2>;
                                 }

                                 // Numbered section headers
                                 if (line.startsWith('### ')) {
                                     return <h3 key={i} className="text-xl font-semibold mt-10 mb-4 font-sans text-slate-200">{line.replace('### ', '')}</h3>;
                                 }

                                 if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc mb-3 pl-2">{line.replace('- ', '')}</li>;

                                 // Rich Text Parsing for styled elements
                                 const richText = line
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    .replace(/<span class="highlight-link">(.*?)<\/span>/g, '<span class="text-blue-400 font-medium hover:underline cursor-pointer">$1</span>')
                                    .replace(/<span class="blue">(.*?)<\/span>/g, '<span class="text-blue-400 font-medium">$1</span>')
                                    .replace(/<u>(.*?)<\/u>/g, '<span class="underline decoration-orange-500 decoration-2 underline-offset-4">$1</span>');

                                 return <p key={i} className="mb-6" dangerouslySetInnerHTML={{ __html: richText }} />;
                             })}
                          </span>
                      );
                  }
              })}
          </div>
      );
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
      
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-amber-200 to-slate-500 font-sans">
          Blog <span className="text-orange-500">Remix</span> Studio.
        </h2>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          Generate comprehensive posts from URLs, research files, or topics.
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-panel rounded-3xl p-6 md:p-10 space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4">
         <form onSubmit={handleGenerate} className="space-y-8">
            
            {/* Source Type Toggle */}
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                 <button type="button" onClick={() => setInputMode('url')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono transition-all ${inputMode === 'url' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                     <FileText className="w-4 h-4" /> Link Mode
                 </button>
                 <button type="button" onClick={() => setInputMode('file')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono transition-all ${inputMode === 'file' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                     <Upload className="w-4 h-4" /> Upload File
                 </button>
                 <button type="button" onClick={() => setInputMode('topic')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono transition-all ${inputMode === 'topic' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                     <Search className="w-4 h-4" /> Topic Research
                 </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs text-orange-400 font-mono tracking-wider flex items-center gap-2">
                            {inputMode === 'url' && <><FileText className="w-4 h-4" /> SOURCE_ARTICLE_URL</>}
                            {inputMode === 'file' && <><Upload className="w-4 h-4" /> RESEARCH_FILE (.TXT)</>}
                            {inputMode === 'topic' && <><Search className="w-4 h-4" /> RESEARCH_TOPIC</>}
                        </label>
                        
                        {inputMode === 'url' && (
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://example.com/blog/interesting-topic"
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-orange-500/50"
                            />
                        )}

                        {inputMode === 'file' && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-20 border border-dashed border-white/10 rounded-xl bg-slate-950/30 hover:bg-white/5 hover:border-orange-500/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                            >
                                <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                                {fileContent ? (
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                        <Check className="w-4 h-4" /> File Loaded ({fileContent.length} chars)
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 text-slate-500 group-hover:text-orange-400" />
                                        <span className="text-xs text-slate-500 font-mono">Click to upload .TXT</span>
                                    </>
                                )}
                            </div>
                        )}

                        {inputMode === 'topic' && (
                             <div className="px-4 py-3 bg-slate-950/30 border border-white/5 rounded-xl text-slate-400 text-sm font-mono italic">
                                 AI will research Google based on your instructions below.
                             </div>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs text-orange-400 font-mono tracking-wider flex items-center gap-2">
                            <Edit3 className="w-4 h-4" /> {inputMode === 'topic' ? 'TOPIC_AND_INSTRUCTIONS' : 'WRITING_INSTRUCTIONS'}
                        </label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={inputMode === 'topic' ? "Describe the topic you want researched and how the post should be written..." : "Describe how you want the post rewritten (e.g. 'More professional tone', 'Focus on key stats')..."}
                            className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-orange-500/50 resize-none"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-orange-400 font-mono tracking-wider flex items-center gap-2">
                                <Maximize className="w-4 h-4" /> LENGTH
                            </label>
                            <select
                                value={selectedLength}
                                onChange={(e) => setSelectedLength(e.target.value as any)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-orange-500/50"
                            >
                                {LENGTH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs text-orange-400 font-mono tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> IMG_COUNT
                            </label>
                            <select
                                value={imageCount}
                                onChange={(e) => setImageCount(parseInt(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-orange-500/50"
                            >
                                {IMAGE_COUNT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} Images</option>)}
                            </select>
                        </div>
                     </div>

                     {/* Style & Font Row */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-orange-400 font-mono tracking-wider flex items-center gap-2">
                                <Palette className="w-4 h-4" /> VISUAL_STYLE
                            </label>
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-orange-500/50"
                            >
                                {VISUAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-orange-400 font-mono tracking-wider flex items-center gap-2">
                                <Type className="w-4 h-4" /> POST_FONT
                            </label>
                            <select
                                value={selectedFont}
                                onChange={(e) => setSelectedFont(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-orange-500/50"
                            >
                                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                     </div>
                    
                    {/* Custom Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        {selectedStyle === 'Custom' && (
                            <input 
                                type="text"
                                value={customStyle}
                                onChange={(e) => setCustomStyle(e.target.value)}
                                placeholder="Describe visual style..."
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-orange-500/50 animate-in fade-in"
                            />
                        )}
                        {selectedFont === 'Custom' && (
                            <input 
                                type="text"
                                value={customFont}
                                onChange={(e) => setCustomFont(e.target.value)}
                                placeholder="Font Family (e.g. 'Lato')"
                                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-orange-500/50 animate-in fade-in ${selectedStyle !== 'Custom' ? 'col-span-2' : ''}`}
                            />
                        )}
                    </div>

                     <div className="space-y-2">
                        <label className="text-xs text-orange-400 font-mono tracking-wider flex items-center gap-2">
                            <Globe className="w-4 h-4" /> LANGUAGE
                        </label>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-1 focus:ring-orange-500/50"
                        >
                            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                     </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || (inputMode === 'url' && !urlInput) || (inputMode === 'file' && !fileContent) || (inputMode === 'topic' && !instructions)}
                className="w-full py-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 border border-orange-500/20 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-mono text-base tracking-wider hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] group shadow-lg"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                {loading ? "RESEARCHING & WRITING..." : "GENERATE POST"}
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
                <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
             </div>
             <p className="text-orange-300 font-mono animate-pulse uppercase tracking-wider">{loadingStage}</p>
        </div>
      )}

      {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between glass-panel p-2 rounded-xl sticky top-24 z-30 backdrop-blur-xl">
                  <div className="flex gap-1">
                      <button 
                        onClick={() => setViewMode('visual')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'visual' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                          <Eye className="w-4 h-4" /> Visual Preview
                      </button>
                      <button 
                        onClick={() => setViewMode('edit')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'edit' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                          <Edit3 className="w-4 h-4" /> Edit Text
                      </button>
                      <button 
                        onClick={() => setViewMode('html')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'html' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                          <Code className="w-4 h-4" /> HTML Code
                      </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {onPublish && (
                        <button 
                            onClick={handlePublish}
                            disabled={isPublished}
                            className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 text-sm font-bold border transition-all ${isPublished ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-orange-500 hover:bg-orange-600 border-orange-600'}`}
                        >
                            {isPublished ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                            {isPublished ? "Published!" : "Post to Blog"}
                        </button>
                    )}
                    {viewMode === 'html' && (
                        <button onClick={copyHtml} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 flex items-center gap-2 text-sm font-mono border border-white/10">
                            {copiedContent ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedContent ? "Copied" : "Copy Code"}
                        </button>
                    )}
                  </div>
              </div>

              {/* Visual Preview Mode - ADAPTED FOR DARK MODE (App Theme) */}
              {viewMode === 'visual' && (
                  <div className="w-full">
                       {/* Hero Section */}
                       <div className="py-10 px-6 text-center border-b border-white/5">
                           <div className="max-w-4xl mx-auto space-y-6">
                               <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                                   {result.title}
                               </h1>
                               {result.subtitle && (
                                   <p className="text-xl text-slate-400 font-normal leading-relaxed italic">
                                       {result.subtitle}
                                   </p>
                               )}
                               <div className="text-sm font-bold text-orange-400 uppercase tracking-wider pt-2 font-mono">
                                   {result.metadata}
                               </div>
                           </div>
                       </div>

                       {/* Body Container */}
                       <div className="max-w-[800px] mx-auto py-10 px-6 md:px-0">
                           {/* Header Image */}
                           {result.visuals.find(v => v.id === 'header') && (
                               <div className="mb-12">
                                    <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 group relative bg-slate-950">
                                        {result.visuals[0].imageData ? (
                                            <img src={`data:image/png;base64,${result.visuals[0].imageData}`} alt="Header" className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="h-64 bg-slate-900 flex items-center justify-center text-slate-500">Loading Visual...</div>
                                        )}
                                        {/* Controls */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                                            <button onClick={() => handleRegenerateImage(result.visuals[0])} disabled={regeneratingId === 'header'} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded flex gap-2">
                                                 {regeneratingId === 'header' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Re-Roll
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center text-sm font-medium text-slate-500 mt-3 italic">[IMAGE 1: {result.visuals[0].caption}]</div>
                               </div>
                           )}

                           {/* Rendered Body */}
                           {renderContentWithImages()}
                       </div>
                  </div>
              )}

              {/* Text Edit Mode */}
              {viewMode === 'edit' && (
                  <div className="glass-panel p-6 rounded-3xl">
                      <div className="mb-4 flex items-center justify-between text-xs font-mono text-slate-500">
                          <span>MARKDOWN EDITOR</span>
                          <span>Auto-saving locally</span>
                      </div>
                      <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-[600px] bg-slate-900/50 rounded-xl p-6 text-slate-200 font-mono text-sm leading-relaxed focus:ring-1 focus:ring-orange-500/50 border border-white/5 resize-none"
                      />
                  </div>
              )}

              {/* HTML Code Mode */}
              {viewMode === 'html' && (
                  <div className="glass-panel p-6 rounded-3xl">
                      <div className="bg-slate-950 rounded-xl p-6 overflow-x-auto border border-white/10">
                          <pre className="text-sm font-mono text-blue-300 leading-relaxed whitespace-pre-wrap">
                              {generateHtmlCode()}
                          </pre>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default BlogToBlog;
