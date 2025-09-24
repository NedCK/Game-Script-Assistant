import React, { useState } from 'react';
import { generateScriptSection } from '../services/geminiService';
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

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

export const FullScriptGenerator: React.FC<FullScriptGeneratorProps> = ({ characters, onScriptGenerated, gameEngine, frameworkInputs }) => {
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [generatingSectionId, setGeneratingSectionId] = useState<number | null>(null);
  const [generatedSectionIds, setGeneratedSectionIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  
  const handleAddSection = () => {
    const newSection: OutlineItem = {
      id: Date.now(), // Use timestamp for a simple unique ID
      description: ''
    };
    setOutline(prev => [...prev, newSection]);
  };

  const handleRemoveSection = (idToRemove: number) => {
    setOutline(prev => prev.filter(item => item.id !== idToRemove));
    setGeneratedSectionIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(idToRemove);
      return newSet;
    });
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all script sections?")) {
      setOutline([]);
      setGeneratedSectionIds(new Set());
      setError(null);
    }
  };

  const handleGenerateSection = async (section: OutlineItem) => {
      if (generatingSectionId !== null || !section.description.trim()) return;
      
      setGeneratingSectionId(section.id);
      setError(null);
      try {
          const fullOutlineDescriptions = outline.map(item => item.description);
          const scriptContent = await generateScriptSection(section.description, fullOutlineDescriptions, characters, gameEngine, frameworkInputs);
          onScriptGenerated(`--- ${t('scriptSectionHeader')} ${outline.findIndex(item => item.id === section.id) + 1}: ${section.description} ---\n\n${scriptContent}`);
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

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('fullScriptGeneratorTitle')}</h3>
      <p className="text-sm text-gray-400 mb-4">{t('fullScriptGeneratorNewSubtitle')}</p>
      {characters.length === 0 && (
          <p className="text-xs text-yellow-400 bg-yellow-900/50 p-2 rounded-md mb-4">
              {t('fullScriptGeneratorTip')}
          </p>
      )}

      <div className="space-y-4 mt-6">
        {outline.map((item, index) => {
            const isGenerating = generatingSectionId === item.id;
            const isGenerated = generatedSectionIds.has(item.id);
            return (
                <div key={item.id} className="bg-gray-700/50 p-3 rounded-md transition-all">
                    <label className="flex justify-between items-center text-xs font-medium text-gray-400 mb-1">
                        <span>{t('scriptSectionHeader')} {index + 1}</span>
                        <button 
                          onClick={() => handleRemoveSection(item.id)}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                          aria-label={t('removeSectionButton')}
                          title={t('removeSectionButton')}
                          disabled={generatingSectionId !== null}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleOutlineChange(item.id, e.target.value)}
                      placeholder={t('sectionDescriptionPlaceholder')}
                      className="w-full bg-gray-600 border border-gray-500 rounded-md p-2 text-gray-200 text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition mb-2 h-20 resize-y"
                    />
                    <button
                      onClick={() => handleGenerateSection(item)}
                      disabled={isGenerating || (generatingSectionId !== null && !isGenerating) || !item.description.trim()}
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

      {outline.length === 0 && (
        <div className="text-center text-gray-500 border-2 border-dashed border-gray-600 rounded-lg p-8 mt-6">
            <p>{t('fullScriptGeneratorPlaceholder')}</p>
        </div>
      )}

      <div className="flex gap-4 mt-6">
          <button
              onClick={handleAddSection}
              className="flex-grow flex items-center justify-center gap-2 text-sm text-teal-300 hover:text-teal-200 bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-md transition-colors"
          >
              <PlusIcon className="w-4 h-4" />
              {t('addSectionButton')}
          </button>
          {outline.length > 0 && (
              <button
                  onClick={handleClearAll}
                  className="bg-red-800/60 hover:bg-red-700 text-red-300 font-semibold py-2 px-3 rounded-md text-xs transition-colors"
              >
                  {t('clearAllSectionsButton')}
              </button>
          )}
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </div>
  );
};