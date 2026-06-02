import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/newlogo.png';
import { LEGAL } from '../constants/legal';

export const LegalPageLayout: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="min-h-screen bg-background text-on-surface font-body">
    <header className="sticky top-0 z-40 border-b border-outline-variant/15 bg-surface-container-lowest/95 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt={LEGAL.brandName} className="h-8 w-auto object-contain" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </header>

    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">Last updated: {LEGAL.effectiveDate}</p>
      <article className="mt-8 prose-legal space-y-6 text-on-surface text-sm md:text-base leading-relaxed">
        {children}
      </article>
      <footer className="mt-12 pt-8 border-t border-outline-variant/15 flex flex-wrap gap-4 text-sm">
        <Link to="/privacy" className="text-primary font-semibold hover:underline">
          Privacy Policy
        </Link>
        <Link to="/terms" className="text-primary font-semibold hover:underline">
          Terms of Use
        </Link>
        <a href={`mailto:${LEGAL.email}`} className="text-on-surface-variant hover:text-on-surface">
          {LEGAL.email}
        </a>
      </footer>
    </main>
  </div>
);

export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="text-lg font-headline font-bold text-on-surface mb-2">{title}</h2>
    <div className="space-y-3 text-on-surface-variant">{children}</div>
  </section>
);
