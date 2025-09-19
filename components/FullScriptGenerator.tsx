import React, { useState } from 'react';
import { generateScriptOutline, generateScriptSection, translateToChinese } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { Character, GameEngine, FrameworkInputs } from '../types';
import { useI18n } from '../i18n/I18nProvider';


interface FullScriptGeneratorProps {
  characters: Character[];
  onScriptGenerated: (content: string) => void;
  gameEngine: GameEngine;
  frameworkInputs: FrameworkInputs;
}

interface OutlineItem {
    id: number;
    description: string;
}

export const FullScriptGenerator: React.FC<FullScriptGeneratorProps> = ({ characters, onScriptGenerated, gameEngine, frameworkInputs }) => {
  const [prompt, setPrompt] = useState('');
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [isLoadingOutline, setIsLoadingOutline] = useState(false);
  const [isTranslatingOutline, setIsTranslatingOutline] = useState(false);
  const [generatingSectionId, setGeneratingSectionId] = useState<number | null>(null);
  const [generatedSectionIds, setGeneratedSectionIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoadingOutline) return;

    setIsLoadingOutline(true);
    setError(null);
    try {
      const outlineResult = await generateScriptOutline(prompt, characters, frameworkInputs);
      setOutline(outlineResult.map((desc, index) => ({ id: index, description: desc })));
      setGeneratedSectionIds(new Set()); // Clear previously generated sections
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoadingOutline(false);
    }
  };
  
  const handleGenerateSection = async (section: OutlineItem) => {
      if (generatingSectionId !== null) return;
      
      setGeneratingSectionId(section.id);
      setError(null);
      try {
          const fullOutlineDescriptions = outline.map(item => item.description);
          const scriptContent = await generateScriptSection(section.description, fullOutlineDescriptions, characters, gameEngine, frameworkInputs);
          onScriptGenerated(`--- ${t('scriptSectionHeader')} ${section.id + 1}: ${section.description} ---\n\n${scriptContent}`);
          setGeneratedSectionIds(prev => new Set(prev).add(section.id));
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
          setGeneratingSectionId(null);
      }
  };
  
  const handleOutlineChange = (id: number, newDescription: string) => {
      setOutline(prev => prev.map(item => item.id === id ? { ...item, description: newDescription } : item));
      // If user edits a generated section, mark it as not-generated so they can generate again
      if (generatedSectionIds.has(id)) {
          setGeneratedSectionIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
          });
      }
  };

  const handleClearOutline = () => {
    setOutline([]);
    setPrompt('');
    setError(null);
    setGeneratedSectionIds(new Set());
  };

  const handleTranslateOutline = async () => {
    if (outline.length === 0 || isTranslatingOutline) return;

    setIsTranslatingOutline(true);
    setError(null);
    const separator = '\n|||TRANSLATION_SEPARATOR|||\n';
    
    try {
        const descriptions = outline.map(item => item.description);
        const joinedText = descriptions.join(separator);
        const translatedJoinedText = await translateToChinese(joinedText);
        const translatedDescriptions = translatedJoinedText.split(separator);

        if (translatedDescriptions.length === descriptions.length) {
            setOutline(prev => prev.map((item, index) => ({
                ...item,
                description: translatedDescriptions[index] || item.description
            })));
        } else {
            throw new Error("Translation returned a different number of sections. Please try again.");
        }

    } catch (err) {
         setError(err instanceof Error ? err.message : 'An unknown error occurred during translation.');
    } finally {
        setIsTranslatingOutline(false);
    }
  };

  if (outline.length > 0) {
      return (
          <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">{t('scriptOutlineTitle')}</h3>
                  <p className="text-sm text-gray-400">{t('scriptOutlineSubtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleTranslateOutline}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md text-xs transition-colors flex items-center justify-center disabled:bg-gray-500 w-28"
                        disabled={isTranslatingOutline}
                    >
                        {isTranslatingOutline ? <LoadingSpinner /> : t('translateOutlineButton')}
                    </button>
                    <button 
                    onClick={handleClearOutline}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md text-xs transition-colors"
                    >
                    {t('clearOutlineButton')}
                    </button>
                </div>
              </div>

              <div className="space-y-4">
                  {outline.map(item => {
                      const isGenerating = generatingSectionId === item.id;
                      const isGenerated = generatedSectionIds.has(item.id);
                      return (
                          <div key={item.id} className="bg-gray-700/50 p-3 rounded-md">
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                  {t('scriptSectionHeader')} {item.id + 1}
                              </label>
                              <textarea
                                value={item.description}
                                onChange={(e) => handleOutlineChange(item.id, e.target.value)}
                                className="w-full bg-gray-600 border border-gray-500 rounded-md p-2 text-gray-200 text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition mb-2 h-20 resize-y"
                              />
                              <button
                                onClick={() => handleGenerateSection(item)}
                                disabled={isGenerating || (generatingSectionId !== null && !isGenerating)}
                                className={`w-full text-sm font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center ${
                                  isGenerated 
                                    ? 'bg-green-800/60 text-green-300 cursor-default' 
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                } disabled:bg-gray-500 disabled:cursor-not-allowed`}
                              >
                                  {isGenerating ? <LoadingSpinner /> : (isGenerated ? `✅ ${t('sectionGeneratedButton')}` : t('generateSectionButton'))}
                              </button>
                          </div>
                      );
                  })}
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          </div>
      )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('fullScriptGeneratorTitle')}</h3>
      <p className="text-sm text-gray-400 mb-4">{t('fullScriptGeneratorSubtitle')}</p>
      {characters.length === 0 && (
          <p className="text-xs text-yellow-400 bg-yellow-900/50 p-2 rounded-md mb-4">
              {t('fullScriptGeneratorTip')}
          </p>
      )}
      <form onSubmit={handleGenerateOutline}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('fullScriptGeneratorPlaceholder')}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition mb-4 h-24 resize-none"
          disabled={isLoadingOutline}
        />
        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:bg-gray-500"
          disabled={isLoadingOutline || !prompt.trim()}
        >
          {isLoadingOutline ? <LoadingSpinner /> : t('generateOutlineButton')}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};