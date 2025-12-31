'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  Sparkles,
  Code2,
  Eye,
  FolderTree,
  Layers,
  Globe,
  Copy,
  Check,
  Github,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { type Locale, getTranslations } from '@/lib/i18n';
import { InteractiveDemo } from '@/components/InteractiveDemo';

export default function Home() {
  const [locale, setLocale] = useState<Locale>('en');
  const [copied, setCopied] = useState(false);
  const t = getTranslations(locale);

  const handleCopy = () => {
    navigator.clipboard.writeText('npx claudeship');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const featureIcons = [
    <MessageSquare key="1" className="w-6 h-6" />,
    <Eye key="2" className="w-6 h-6" />,
    <Layers key="3" className="w-6 h-6" />,
    <Code2 key="4" className="w-6 h-6" />,
    <FolderTree key="5" className="w-6 h-6" />,
    <Terminal key="6" className="w-6 h-6" />,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">ClaudeShip</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm hover:text-primary-600 transition-colors">
                {t.nav.features}
              </a>
              <a href="#demo" className="text-sm hover:text-primary-600 transition-colors">
                {t.nav.demo}
              </a>
              <a
                href="https://github.com/nicered/claudeship"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-primary-600 transition-colors flex items-center gap-1"
              >
                <Github className="w-4 h-4" />
                {t.nav.github}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {locale === 'en' ? 'KO' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              {t.hero.badge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            {t.hero.title}{' '}
            <span className="gradient-text">{t.hero.titleHighlight}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10"
          >
            {t.hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <button
              onClick={handleCopy}
              className="group flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-mono text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              {t.hero.install}
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              )}
            </button>

            <a
              href="#demo"
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t.hero.ctaSecondary}
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 blur-3xl -z-10" />
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-slate-500 ml-2">ClaudeShip</span>
              </div>
              <div className="grid grid-cols-12 min-h-[400px]">
                {/* File Explorer */}
                <div className="col-span-2 border-r border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="text-xs font-medium text-slate-500 mb-2">Files</div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1"><FolderTree className="w-3 h-3" /> src</div>
                    <div className="pl-3">app</div>
                    <div className="pl-3">components</div>
                    <div>package.json</div>
                  </div>
                </div>
                {/* Chat */}
                <div className="col-span-5 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs">U</div>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm">
                        Create a todo app with add and delete features
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs">AI</div>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm">
                        <span className="text-green-600 dark:text-green-400">Creating todo app...</span>
                        <div className="mt-2 text-xs text-slate-500">
                          <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded mr-1">Write</span>
                          src/app/page.tsx
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Preview */}
                <div className="col-span-5 bg-white dark:bg-slate-900 p-4">
                  <div className="text-xs text-slate-500 mb-2">Preview</div>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <h3 className="font-bold mb-3">My Todos</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <input type="checkbox" className="rounded" readOnly />
                        <span>Learn ClaudeShip</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <input type="checkbox" className="rounded" readOnly checked />
                        <span className="line-through text-slate-400">Setup project</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t.features.title} <span className="gradient-text">{t.features.subtitle}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white mb-4">
                  {featureIcons[index]}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.demo.title}</h2>
            <p className="text-slate-600 dark:text-slate-400">{t.demo.subtitle}</p>
          </div>

          <InteractiveDemo locale={locale} />
        </div>
      </section>

      {/* Install Section */}
      <section className="py-20 px-4 bg-slate-900 dark:bg-slate-950 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.install.title}</h2>
          <p className="text-slate-400 mb-8">{t.install.subtitle}</p>

          <div className="flex items-center justify-center gap-2 p-4 bg-slate-800 rounded-xl font-mono text-lg mb-4">
            <Terminal className="w-5 h-5 text-green-400" />
            <span>npx claudeship</span>
            <button
              onClick={handleCopy}
              className="ml-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-sm text-slate-500">{t.install.requirements}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4" />
            {t.footer.built}
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/nicered/claudeship"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t.footer.links.github}
            </a>
            <a
              href="https://www.npmjs.com/package/claudeship"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t.footer.links.npm}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
