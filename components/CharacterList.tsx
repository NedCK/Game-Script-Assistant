import React, { useState } from 'react';
import { Character } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { generateCharacters } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface CharacterManagerProps {
  characters: Character[];
  onCharactersChange: (characters: Character[]) => void;
}

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (/* SVG unchanged */ <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0ZM10.5 1.5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM12.75 6.03a9.002 9.002 0 0 1 4.133 2.112 3 3 0 0 1-1.28 5.416 9.006 9.006 0 0 1-4.133-2.112 3 3 0 0 1 1.28-5.416Z" /></svg>);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (/* SVG unchanged */ <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (/* SVG unchanged */ <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);

export const CharacterManager: React.FC<CharacterManagerProps> = ({ characters, onCharactersChange }) => {
  const { t } = useI18n();
  const [prompts, setPrompts] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCharacterId, setOpenCharacterId] = useState<string | null>(null);

  const handleAddPrompt = () => setPrompts([...prompts, '']);
  const handleRemovePrompt = (index: number) => setPrompts(prompts.filter((_, i) => i !== index));
  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPrompts = prompts.filter(p => p.trim());
    if (validPrompts.length === 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const newCharacterData = await generateCharacters(validPrompts, characters);
      const newFullCharacters = newCharacterData.map(c => ({ ...c, id: crypto.randomUUID() }));
      onCharactersChange([...characters, ...newFullCharacters]);
      setPrompts(['']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCharacter = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(t('confirmCharacterDelete'))) {
      onCharactersChange(characters.filter(c => c.id !== id));
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col flex-grow">
      <div className="flex items-center gap-3 mb-4">
        <UserGroupIcon className="w-6 h-6 text-teal-400" />
        <h2 className="text-xl font-bold text-teal-400">{t('characterRosterTitle')}</h2>
      </div>

      <div className="space-y-4 mb-6 flex-grow overflow-y-auto pr-2">
        {characters.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">{t('characterRosterPlaceholder')}</p>
        ) : (
          characters.map((char) => (
             <div key={char.id} className="bg-gray-900/50 rounded-lg">
                <button
                    type="button"
                    className="w-full flex justify-between items-center text-left p-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 rounded-t-lg"
                    onClick={() => setOpenCharacterId(openCharacterId === char.id ? null : char.id)}
                >
                    <span className="font-bold text-gray-100">{char.name}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${openCharacterId === char.id ? 'rotate-180' : ''}`} />
                </button>
                {openCharacterId === char.id && (
                     <div className="px-3 pb-3 space-y-3 border-t border-gray-700 pt-3">
                        <div>
                            <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider">{t('characterCardAppearance')}</h4>
                            <p className="text-sm text-gray-300 mt-1">{char.appearance}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider">{t('characterCardBackground')}</h4>
                            <p className="text-sm text-gray-300 mt-1">{char.backstory}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider">{t('characterCardRelationships')}</h4>
                            <p className="text-sm text-gray-300 mt-1">{char.relationships}</p>
                        </div>
                        <div className="text-right">
                           <button 
                                type="button"
                                onClick={(e) => handleDeleteCharacter(e, char.id)} 
                                className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-end gap-1 ml-auto"
                            >
                                <TrashIcon className="w-4 h-4" />
                                {t('deleteButton')}
                           </button>
                        </div>
                    </div>
                )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('characterGeneratorTitle')}</h3>
        <p className="text-sm text-gray-400 mb-4">{t('characterGeneratorSubtitle')}</p>
        <form onSubmit={handleGenerate}>
          <div className="space-y-2">
            {prompts.map((prompt, index) => (
              <div key={index} className="flex items-center gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => handlePromptChange(index, e.target.value)}
                  placeholder={t('characterGeneratorPlaceholder')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-teal-500 transition h-16 resize-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePrompt(index)}
                  className="bg-red-800/60 hover:bg-red-700 text-red-300 p-2 rounded-md transition-colors disabled:opacity-50"
                  disabled={prompts.length <= 1}><TrashIcon className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddPrompt} className="flex items-center justify-center gap-2 w-full mt-3 text-sm text-teal-300 hover:text-teal-200 bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-md transition-colors">
            <PlusIcon className="w-4 h-4" /> {t('addCharacterConcept')}
          </button>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors mt-4 flex items-center justify-center disabled:bg-gray-500" disabled={isLoading || prompts.every(p => !p.trim())}>
            {isLoading ? <LoadingSpinner /> : t('generateCharacterButton')}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};
