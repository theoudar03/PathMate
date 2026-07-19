import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

/**
 * TranslateText is a premium Material Design 3 compliant utility component.
 * It automatically looks up static translations in the dictionary first.
 * If not present, it calls the Gemini API to translate the text, caching the response
 * in sessionStorage to minimize API usage.
 */
export const TranslateText = ({ text }) => {
  const { language, t } = useApp();

  // Synchronously compute initial translation to prevent 1-frame flashes of raw keys
  const [translated, setTranslated] = useState(() => {
    if (!text || typeof text !== 'string') return text;

    // Check static translation dictionary first
    const staticTranslation = t(text);
    if (staticTranslation !== text) {
      return staticTranslation;
    }

    // Check sessionStorage cache for dynamic translations
    if (language !== 'en') {
      const cacheKey = `pm_trans_${language}_${text.slice(0, 100)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return cached;
    }

    return text;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text || typeof text !== 'string') {
      setTranslated(text);
      return;
    }

    // 1. Check static localization dictionary first
    const staticTranslation = t(text);
    if (staticTranslation !== text) {
      setTranslated(staticTranslation);
      return;
    }

    if (language === 'en') {
      setTranslated(text);
      return;
    }

    // 2. Fetch dynamic translation from Gemini API
    let active = true;
    const cacheKey = `pm_trans_${language}_${text.slice(0, 100)}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      setTranslated(cached);
      return;
    }

    setLoading(true);
    const fetchTranslation = async () => {
      try {
        const token = localStorage.getItem('pm_auth_token');
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ text, targetLanguage: language })
        });
        const data = await res.json();
        if (data.success && data.translated && active) {
          sessionStorage.setItem(cacheKey, data.translated);
          setTranslated(data.translated);
        }
      } catch (err) {
        console.warn("Gemini dynamic translation failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTranslation();

    return () => {
      active = false;
    };
  }, [text, language, t]);

  if (loading) {
    return <span className="opacity-70 transition-opacity animate-pulse">{translated || text}</span>;
  }

  return <>{translated}</>;
};

export default TranslateText;

