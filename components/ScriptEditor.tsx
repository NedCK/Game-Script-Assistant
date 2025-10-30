import React, { useState } from 'react';
import { PlotPoint, Character, GameEngine } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { PlotPointCard } from './PlotPointCard';
import { PlotPointEditor } from './PlotPointEditor';

interface StoryboardProps {
  plotPoints: PlotPoint[];
  onPlotPointsChange: (points: PlotPoint[]) => void;
  characters: Character[];
  gameEngine: GameEngine;
}

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);

export const Storyboard: React.FC<StoryboardProps> = ({ plotPoints, onPlotPointsChange, characters, gameEngine }) => {
  const { t } = useI18n();
  const [editingPoint, setEditingPoint] = useState<PlotPoint | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleAddPlotPoint = () => {
    const newPoint: PlotPoint = {
      id: crypto.randomUUID(),
      title: t('newPlotPointTitle'),
      setting: '',
      characters: [],
      summary: '',
      mood: '',
      script: '',
    };
    setIsCreatingNew(true);
    setEditingPoint(newPoint);
  };

  const handleEditPlotPoint = (point: PlotPoint) => {
    setIsCreatingNew(false);
    setEditingPoint({ ...point });
  };
  
  const handleSavePlotPoint = (pointToSave: PlotPoint) => {
    if (isCreatingNew) {
      onPlotPointsChange([...plotPoints, pointToSave]);
    } else {
      onPlotPointsChange(plotPoints.map(p => p.id === pointToSave.id ? pointToSave : p));
    }
    setEditingPoint(null);
  };

  const handleDeletePlotPoint = (id: string) => {
    if (window.confirm(t('confirmPlotPointDelete'))) {
        onPlotPointsChange(plotPoints.filter(p => p.id !== id));
        setEditingPoint(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-teal-400">{t('storyboardTitle')}</h2>
        <button 
          onClick={handleAddPlotPoint}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
        >
          <PlusIcon className="w-4 h-4" />
          {t('addPlotPointButton')}
        </button>
      </div>

      <div className="p-6 flex-grow overflow-y-auto">
        {plotPoints.length === 0 ? (
          <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-700 rounded-lg">
            <p className="text-lg">{t('storyboardPlaceholderTitle')}</p>
            <p>{t('storyboardPlaceholderSubtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {plotPoints.map(point => (
              <PlotPointCard 
                key={point.id} 
                point={point} 
                onEdit={() => handleEditPlotPoint(point)} 
              />
            ))}
          </div>
        )}
      </div>

      {editingPoint && (
        <PlotPointEditor
          point={editingPoint}
          allCharacters={characters}
          gameEngine={gameEngine}
          onSave={handleSavePlotPoint}
          onDelete={handleDeletePlotPoint}
          onCancel={() => setEditingPoint(null)}
          isNew={isCreatingNew}
        />
      )}
    </div>
  );
};
