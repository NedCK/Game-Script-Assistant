
import React, { useState } from 'react';
import { WorldConcept, WorldConceptCategory } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { generateConceptDescription } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface WorldConceptManagerProps {
  concepts: WorldConcept[];
  onConceptsChange: (concepts: WorldConcept[]) => void;
}

const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
);

export const WorldConceptManager: React.FC<WorldConceptManagerProps> = ({ concepts, onConceptsChange }) => {
  const { t } = useI18n();
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<WorldConceptCategory>('Location');
  const [newDescription, setNewDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newConcept: WorldConcept = {
      id: crypto.randomUUID(),
      name: newName,
      category: newCategory,
      description: newDescription,
    };
    onConceptsChange([...concepts, newConcept]);
    setNewName('');
    setNewDescription('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmConceptDelete'))) {
      onConceptsChange(concepts.filter(c => c.id !== id));
    }
  };

  const handleGenerateDescription = async () => {
    if (!newName.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
        const desc = await generateConceptDescription(newName, newCategory, concepts);
        setNewDescription(desc);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const categories: WorldConceptCategory[] = ['Location', 'Faction', 'Item', 'Lore', 'History', 'Other'];

  const getCategoryColor = (cat: WorldConceptCategory) => {
    switch(cat) {
        case 'Location': return 'bg-emerald-900/50 text-emerald-200 border-emerald-700';
        case 'Faction': return 'bg-indigo-900/50 text-indigo-200 border-indigo-700';
        case 'Item': return 'bg-amber-900/50 text-amber-200 border-amber-700';
        case 'Lore': return 'bg-purple-900/50 text-purple-200 border-purple-700';
        case 'History': return 'bg-red-900/50 text-red-200 border-red-700';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col max-h-[500px]">
      <div className="flex items-center gap-3 mb-4">
        <GlobeIcon className="w-6 h-6 text-teal-400" />
        <h2 className="text-xl font-bold text-teal-400">{t('worldManagerTitle')}</h2>
      </div>

      {/* Add New Section */}
      <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
          <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                placeholder={t('conceptNamePlaceholder')}
                className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
              <select 
                value={newCategory} 
                onChange={e => setNewCategory(e.target.value as WorldConceptCategory)}
                className="w-1/3 min-w-[100px] bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              >
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {t(`conceptCategory${c}`)}
                    </option>
                  ))}
              </select>
          </div>
          <div className="relative">
            <textarea 
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder={t('conceptDescPlaceholder')}
                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white h-20 resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
            <button 
                onClick={handleGenerateDescription}
                disabled={!newName.trim() || isGenerating}
                className="absolute bottom-2 right-2 text-xs bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50 transition-colors"
                title="Generate Description"
            >
                {isGenerating ? <LoadingSpinner /> : <SparklesIcon className="w-3 h-3" />}
                AI
            </button>
          </div>
          <button 
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white py-1 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('addConceptButton')}
          </button>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {concepts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center italic py-4">{t('worldConceptsPlaceholder')}</p>
        ) : (
            concepts.map(c => (
                <div key={c.id} className="bg-gray-700/30 rounded-md p-3 border border-gray-700 group relative hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-200 text-sm">{c.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getCategoryColor(c.category)}`}>
                                {t(`conceptCategory${c.category}`)}
                            </span>
                        </div>
                        <button onClick={() => handleDelete(c.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
