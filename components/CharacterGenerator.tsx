import React, { useState } from 'react';
// FIX: Correctly import generateCharacters.
import { generateCharacters } from '../services/geminiService';
// FIX: The FrameworkInputs type will be available once types.ts is updated.
import { Character, GameEngine, FrameworkInputs } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { useI18n } from '../i18n/I18nProvider';

interface CharacterGeneratorProps {
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
  onCharactersGenerated: (characters: Character[]) => void;
  gameEngine: GameEngine;
  frameworkInputs: FrameworkInputs;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const MinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);


export const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({ prompts, onPromptsChange, onCharactersGenerated, gameEngine, frameworkInputs }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    onPromptsChange(newPrompts);
  };

  const handleAddPrompt = () => {
    onPromptsChange([...prompts, '']);
  };

  const handleRemovePrompt = (index: number) => {
    onPromptsChange(prompts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPrompts = prompts.filter(p => p.trim());
    if (validPrompts.length === 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      // FIX: Use generateCharacters with correct arguments and add IDs to the result.
      const newCharacterData = await generateCharacters(validPrompts, []);
      const newCharacters = newCharacterData.map(c => ({ ...c, id: crypto.randomUUID() }));
      onCharactersGenerated(newCharacters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('characterGeneratorTitle')}</h3>
      <p className="text-sm text-gray-400 mb-4">{t('characterGeneratorSubtitle')}</p>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {prompts.map((prompt, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-gray-400 font-mono text-sm pt-2">{index + 1}.</span>
              <div className="flex-grow">
                <textarea
                  value={prompt}
                  onChange={(e) => handlePromptChange(index, e.target.value)}
                  placeholder={t('characterGeneratorPlaceholder')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition h-20 resize-none"
                  disabled={isLoading}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemovePrompt(index)}
                className="bg-red-800/60 hover:bg-red-700 text-red-300 p-2 rounded-md transition-colors mt-1 disabled:opacity-50"
                disabled={prompts.length <= 1}
                aria-label="Remove concept"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddPrompt}
          className="flex items-center justify-center gap-2 w-full mt-4 text-sm text-teal-300 hover:text-teal-200 bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-md transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('addCharacterConcept')}
        </button>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:bg-gray-500 mt-6"
          disabled={isLoading || prompts.every(p => !p.trim())}
        >
          {isLoading ? <LoadingSpinner /> : t('generateCharacterButton')}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};
