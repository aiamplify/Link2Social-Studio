
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import PublicBlog from './components/PublicBlog';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { PublishedPost, BlogPostResult } from './types';

type PageView = 'blog' | 'login' | 'dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<PageView>('blog');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = (u: string, p: string) => {
      if (u === 'admin' && p === 'admin') {
          setIsAuthenticated(true);
          setLoginError(null);
          setView('dashboard');
      } else {
          setLoginError("Invalid credentials");
      }
  };

  const handlePublishPost = (post: BlogPostResult) => {
      const newPost: PublishedPost = {
          ...post,
          id: Date.now().toString(),
          publishDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };
      setPublishedPosts(prev => [newPost, ...prev]);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setView('blog');
  };

  // Router Logic
  if (view === 'login') {
      return <Login onLogin={handleLogin} onCancel={() => setView('blog')} error={loginError} />;
  }

  if (view === 'dashboard' && isAuthenticated) {
      return <Dashboard onPublishPost={handlePublishPost} onLogout={handleLogout} />;
  }

  // Default to Public Blog
  return <PublicBlog posts={publishedPosts} onLoginClick={() => setView('login')} />;
};

export default App;
