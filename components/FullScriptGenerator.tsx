import React, { useState } from 'react';
import { generateFullScript } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { Character, GameEngine } from '../types';
import { useI18n } from '../i18n/I18nProvider';


interface FullScriptGeneratorProps {
  characters: Character[];
  onScriptGenerated: (content: string) => void;
  gameEngine: GameEngine;
}

export const FullScriptGenerator: React.FC<FullScriptGeneratorProps> = ({ characters, onScriptGenerated, gameEngine }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const scriptContent = await generateFullScript(prompt, characters, gameEngine);
      onScriptGenerated(scriptContent);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('fullScriptGeneratorTitle')}</h3>
      <p className="text-sm text-gray-400 mb-4">{t('fullScriptGeneratorSubtitle')}</p>
      {characters.length === 0 && (
          <p className="text-xs text-yellow-400 bg-yellow-900/50 p-2 rounded-md mb-4">
              {t('fullScriptGeneratorTip')}
          </p>
      )}
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('fullScriptGeneratorPlaceholder')}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition mb-4 h-24 resize-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:bg-gray-500"
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? <LoadingSpinner /> : t('generateFullScriptButton')}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};