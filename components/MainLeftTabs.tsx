import React, { useState } from 'react';
import { GameDesignFramework } from './GameDesignFramework';
import { GeneratorTabs } from './GeneratorTabs';
import { useI18n } from '../i18n/I18nProvider';
import { Character, GameEngine, FrameworkInputs } from '../types';

type ActiveTab = 'design' | 'content';

interface MainLeftTabsProps {
    frameworkInputs: FrameworkInputs;
    onFrameworkChange: (section: keyof FrameworkInputs, value: string) => void;
    onTranslateFrameworkSection: (section: keyof FrameworkInputs) => Promise<void>;
    onCharacterGenerated: (character: Character) => void;
    onSceneGenerated: (content: string) => void;
    onScriptGenerated: (content: string) => void;
    characters: Character[];
    gameEngine: GameEngine;
}

export const MainLeftTabs: React.FC<MainLeftTabsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('design');
    const { t } = useI18n();

    const tabs: { id: ActiveTab; label: string }[] = [
        { id: 'design', label: t('mainTabDesign') },
        { id: 'content', label: t('mainTabContent') },
    ];

    const getTabButtonStyle = (tabId: ActiveTab) => {
        return activeTab === tabId
            ? 'bg-teal-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600';
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg">
            <div className="flex justify-stretch p-2 bg-gray-900/50 rounded-t-xl border-b border-gray-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-colors duration-200 ${getTabButtonStyle(tab.id)}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {activeTab === 'design' && (
                    <GameDesignFramework
                        inputs={props.frameworkInputs}
                        onInputChange={props.onFrameworkChange}
                        onTranslateSection={props.onTranslateFrameworkSection}
                    />
                )}
                {activeTab === 'content' && (
                     <div className="p-6">
                        <GeneratorTabs
                            onCharacterGenerated={props.onCharacterGenerated}
                            onSceneGenerated={props.onSceneGenerated}
                            onScriptGenerated={props.onScriptGenerated}
                            characters={props.characters}
                            gameEngine={props.gameEngine}
                            frameworkInputs={props.frameworkInputs}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};