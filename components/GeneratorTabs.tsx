import React, { useState } from 'react';
import { Character, GameEngine, FrameworkInputs, GeneratorInputs, OutlineItem } from '../types';
import { CharacterGenerator } from './CharacterGenerator';
import { SceneGenerator } from './SceneGenerator';
import { FullScriptGenerator } from './FullScriptGenerator';
import { useI18n } from '../i18n/I18nProvider';

type ActiveTab = 'character' | 'scene' | 'fullScript';

interface GeneratorTabsProps {
    onCharactersGenerated: (characters: Character[]) => void;
    onSceneGenerated: (content: string) => void;
    onScriptGenerated: (content: string) => void;
    characters: Character[];
    gameEngine: GameEngine;
    frameworkInputs: FrameworkInputs;
    generatorInputs: GeneratorInputs;
    onCharacterPromptsChange: (prompts: string[]) => void;
    onScenePromptsChange: (prompts: string[]) => void;
    onFullScriptOutlineChange: (outline: OutlineItem[]) => void;
}

export const GeneratorTabs: React.FC<GeneratorTabsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('character');
    const { t } = useI18n();

    const tabs: { id: ActiveTab; label: string }[] = [
        { id: 'character', label: t('characterTab') },
        { id: 'scene', label: t('sceneTab') },
        { id: 'fullScript', label: t('fullScriptTab') },
    ];
    
    const getTabButtonStyle = (tabId: ActiveTab) => {
        return activeTab === tabId
            ? 'bg-teal-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600';
    };

    return (
        <div>
            <div className="flex justify-stretch p-2 bg-gray-900/50 rounded-md">
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
            <div className="pt-6">
                {activeTab === 'character' && (
                    <CharacterGenerator
                        prompts={props.generatorInputs.characterPrompts}
                        onPromptsChange={props.onCharacterPromptsChange}
                        onCharactersGenerated={props.onCharactersGenerated}
                        gameEngine={props.gameEngine}
                        frameworkInputs={props.frameworkInputs}
                    />
                )}
                {activeTab === 'scene' && (
                    <SceneGenerator
                        prompts={props.generatorInputs.scenePrompts}
                        onPromptsChange={props.onScenePromptsChange}
                        onSceneGenerated={props.onSceneGenerated}
                        gameEngine={props.gameEngine}
                        frameworkInputs={props.frameworkInputs}
                    />
                )}
                {activeTab === 'fullScript' && (
                    <FullScriptGenerator
                        outline={props.generatorInputs.fullScriptOutline}
                        onOutlineChange={props.onFullScriptOutlineChange}
                        characters={props.characters}
                        onScriptGenerated={props.onScriptGenerated}
                        gameEngine={props.gameEngine}
                        frameworkInputs={props.frameworkInputs}
                    />
                )}
            </div>
        </div>
    );
};