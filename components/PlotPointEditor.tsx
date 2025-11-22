
import React, { useState, useEffect } from 'react';
import { PlotPoint, Character, GameEngine, WorldConcept } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { generateScriptForPlotPoint } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface PlotPointEditorProps {
  point: PlotPoint;
  allCharacters: Character[];
  worldConcepts: WorldConcept[];
  gameEngine: GameEngine;
  onSave: (point: PlotPoint) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  isNew: boolean;
}

const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);

export const PlotPointEditor: React.FC<PlotPointEditorProps> = ({ point, allCharacters, worldConcepts, gameEngine, onSave, onDelete, onCancel, isNew }) => {
  const { t } = useI18n();
  const [editedPoint, setEditedPoint] = useState<PlotPoint>(point);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditedPoint(point);
  }, [point]);

  const handleChange = (field: keyof Omit<PlotPoint, 'id' | 'characters'>, value: string) => {
    setEditedPoint(p => ({ ...p, [field]: value }));
  };

  const handleCharacterToggle = (characterId: string) => {
    const characters = editedPoint.characters.includes(characterId)
      ? editedPoint.characters.filter(id => id !== characterId)
      : [...editedPoint.characters, characterId];
    setEditedPoint(p => ({ ...p, characters }));
  };

  const handleGenerateScript = async () => {
    if (!editedPoint.summary.trim()) {
      setError(t('summaryRequiredError'));
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const charactersInScene = allCharacters.filter(c => editedPoint.characters.includes(c.id));
      const generatedScript = await generateScriptForPlotPoint(editedPoint, charactersInScene, gameEngine, worldConcepts);
      setEditedPoint(p => ({ ...p, script: generatedScript }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onCancel}>
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-teal-400">{isNew ? t('newPlotPointTitle') : t('editPlotPointTitle')}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Left: Context Form */}
          <div className="w-1/2 p-6 overflow-y-auto space-y-4 border-r border-gray-700">
            <div>
              <label className="text-sm font-medium text-gray-300">{t('plotPointTitleLabel')}</label>
              <input type="text" value={editedPoint.title} onChange={e => handleChange('title', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">{t('plotPointSettingLabel')}</label>
              <input type="text" value={editedPoint.setting} onChange={e => handleChange('setting', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">{t('plotPointMoodLabel')}</label>
              <input type="text" value={editedPoint.mood} onChange={e => handleChange('mood', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">{t('plotPointSummaryLabel')}</label>
              <textarea value={editedPoint.summary} onChange={e => handleChange('summary', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1 h-32 resize-y" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">{t('plotPointCharactersLabel')}</label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-gray-900/50 p-2 rounded-md">
                {allCharacters.length > 0 ? allCharacters.map(char => (
                  <label key={char.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editedPoint.characters.includes(char.id)} onChange={() => handleCharacterToggle(char.id)} className="accent-teal-500" />
                    <span>{char.name}</span>
                  </label>
                )) : <p className="text-xs text-gray-500">{t('noCharactersToAssign')}</p>}
              </div>
            </div>
          </div>

          {/* Right: Script Generation */}
          <div className="w-1/2 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('scriptGenerationTitle')}</h3>
              <button onClick={handleGenerateScript} disabled={isGenerating} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center disabled:bg-gray-500">
                {isGenerating ? <LoadingSpinner/> : '✨ ' + t('generateScriptButton')}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            <textarea
              readOnly
              value={editedPoint.script}
              placeholder={t('scriptPlaceholder')}
              className="w-full flex-grow bg-gray-900/50 rounded-md p-4 text-sm whitespace-pre-wrap font-mono resize-none"
            />
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-700">
          <button onClick={() => onDelete(editedPoint.id)} className="bg-red-800/60 hover:bg-red-700 text-red-300 font-semibold py-2 px-4 rounded-md text-sm transition-colors">
            {t('deleteButton')}
          </button>
          <div className="flex gap-2">
            <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">{t('cancelButton')}</button>
            <button onClick={() => onSave(editedPoint)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md">{t('saveButton')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
