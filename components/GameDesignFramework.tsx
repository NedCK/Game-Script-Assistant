import React, { useState, useCallback } from 'react';
import { FrameworkInputs } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { brainstormFrameworkIdea } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface GameDesignFrameworkProps {
    inputs: FrameworkInputs;
    onInputChange: (section: keyof FrameworkInputs, value: string) => void;
    onTranslateSection: (section: keyof FrameworkInputs) => Promise<void>;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

type FrameworkSection = keyof FrameworkInputs;

export const GameDesignFramework: React.FC<GameDesignFrameworkProps> = ({ inputs, onInputChange, onTranslateSection }) => {
    const { t } = useI18n();
    const [openSection, setOpenSection] = useState<FrameworkSection>('theme');
    const [loadingSection, setLoadingSection] = useState<FrameworkSection | null>(null);
    const [translatingSection, setTranslatingSection] = useState<FrameworkSection | null>(null);
    const [error, setError] = useState<string | null>(null);

    const frameworkSections: { id: FrameworkSection; title: string; desc: string }[] = [
        { id: 'theme', title: t('frameworkThemeTitle'), desc: t('frameworkThemeDesc') },
        { id: 'narrative', title: t('frameworkNarrativeTitle'), desc: t('frameworkNarrativeDesc') },
        { id: 'art', title: t('frameworkArtTitle'), desc: t('frameworkArtDesc') },
        { id: 'interaction', title: t('frameworkInteractionTitle'), desc: t('frameworkInteractionDesc') },
        { id: 'systems', title: t('frameworkSystemsTitle'), desc: t('frameworkSystemsDesc') },
        { id: 'audio', title: t('frameworkAudioTitle'), desc: t('frameworkAudioDesc') },
        { id: 'experience', title: t('frameworkExperienceTitle'), desc: t('frameworkExperienceDesc') },
    ];

    const handleBrainstorm = useCallback(async (section: FrameworkSection) => {
        setLoadingSection(section);
        setError(null);
        try {
            const ideas = await brainstormFrameworkIdea(section, inputs[section], inputs);
            const newValue = inputs[section] ? `${inputs[section]}\n\n${ideas}` : ideas;
            onInputChange(section, newValue);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoadingSection(null);
        }
    }, [inputs, onInputChange]);

    const handleTranslate = useCallback(async (section: FrameworkSection) => {
        if (loadingSection || translatingSection) return;
        setTranslatingSection(section);
        setError(null);
        try {
            await onTranslateSection(section);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during translation.');
        } finally {
            setTranslatingSection(null);
        }
    }, [onTranslateSection, loadingSection, translatingSection]);


    return (
        <div className="p-6 space-y-2">
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm mb-4">{error}</p>}
            {frameworkSections.map(({ id, title, desc }) => (
                <div key={id} className="bg-gray-900/50 rounded-lg">
                    <button
                        className="w-full flex justify-between items-center text-left p-4"
                        onClick={() => setOpenSection(openSection === id ? '' as FrameworkSection : id)}
                        aria-expanded={openSection === id}
                    >
                        <div>
                            <h3 className="font-bold text-gray-100">{title}</h3>
                            <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${openSection === id ? 'rotate-180' : ''}`} />
                    </button>
                    {openSection === id && (
                        <div className="px-4 pb-4">
                            <textarea
                                value={inputs[id]}
                                onChange={(e) => onInputChange(id, e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition mb-2 h-36 resize-y"
                                placeholder={`Outline your ideas for ${id}...`}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBrainstorm(id)}
                                    className="flex-1 bg-teal-800/80 hover:bg-teal-700/80 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:bg-gray-600 text-sm"
                                    disabled={loadingSection !== null || translatingSection !== null}
                                >
                                    {loadingSection === id ? <LoadingSpinner /> : '✨ ' + t('brainstormButton')}
                                </button>
                                <button
                                    onClick={() => handleTranslate(id)}
                                    className="flex-1 bg-sky-800/80 hover:bg-sky-700/80 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:bg-gray-600 text-sm"
                                    disabled={loadingSection !== null || translatingSection !== null || !inputs[id].trim()}
                                >
                                    {translatingSection === id ? <LoadingSpinner /> : t('translateButton')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};