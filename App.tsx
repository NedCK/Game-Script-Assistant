import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CharacterList } from './components/CharacterList';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ProjectManager } from './components/ProjectManager';
import { I18nProvider } from './i18n/I18nProvider';
import { Character, ScriptPiece, GameEngine, FrameworkInputs, SavedProject, SaveStatus } from './types';
import { ScriptEditor } from './components/ScriptEditor';
import { MainLeftTabs } from './components/MainLeftTabs';
import { translateToChinese, updateApiKey } from './services/geminiService';

const initialFrameworkInputs: FrameworkInputs = {
  theme: '',
  narrative: '',
  art: '',
  interaction: '',
  systems: '',
  audio: '',
  experience: '',
};

const APP_VERSION = 1;
const LOCAL_STORAGE_KEY = 'gameScriptProject';

const getInitialState = (): SavedProject => ({
  version: APP_VERSION,
  projectName: 'My Awesome Game',
  frameworkInputs: initialFrameworkInputs,
  characters: [],
  scriptPieces: [],
  gameEngine: 'unity',
  language: 'en',
});


function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scriptPieces, setScriptPieces] = useState<ScriptPiece[]>([]);
  const [gameEngine, setGameEngine] = useState<GameEngine>('unity');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [projectName, setProjectName] = useState('我的超棒游戏');
  const [frameworkInputs, setFrameworkInputs] = useState<FrameworkInputs>(initialFrameworkInputs);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customApiKey, setCustomApiKey] = useState<string>(() => sessionStorage.getItem('customApiKey') || '');


  const isInitialLoad = useRef(true);

  // Effect to update the API key in the service when it changes
  useEffect(() => {
    updateApiKey(customApiKey);
    if (customApiKey) {
      sessionStorage.setItem('customApiKey', customApiKey);
    } else {
      sessionStorage.removeItem('customApiKey');
    }
  }, [customApiKey]);


  const loadProjectData = (data: SavedProject) => {
      if (data.version > APP_VERSION) {
        throw new Error("This project file was created with a newer version of the app and cannot be loaded.");
      }

      // Future: Add migration logic here if data.version < APP_VERSION

      setProjectName(data.projectName);
      setFrameworkInputs(data.frameworkInputs);
      setCharacters(data.characters || []);
      setScriptPieces(data.scriptPieces || []);
      setGameEngine(data.gameEngine || 'unity');
      setLanguage(data.language || 'en');
  };

  // Auto-load from localStorage on initial mount
  useEffect(() => {
    try {
      const savedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDataString) {
        const savedData: SavedProject = JSON.parse(savedDataString);
        loadProjectData(savedData);
        console.log('Project loaded from local storage.');
      }
    } catch (error) {
      console.error("Failed to load project from local storage:", error);
      // Clear corrupted data
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Auto-save to localStorage on state change (with debounce)
  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }

    setSaveStatus('unsaved');
    
    const handler = setTimeout(() => {
        setSaveStatus('saving');
        const projectData: SavedProject = {
            version: APP_VERSION,
            projectName,
            frameworkInputs,
            characters,
            scriptPieces,
            gameEngine,
            language,
        };
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projectData));
            setTimeout(() => setSaveStatus('saved'), 500); // Give feedback
        } catch (error) {
            console.error("Failed to save project to local storage:", error);
            setSaveStatus('unsaved'); // Revert status on failure
        }
    }, 1500);

    return () => {
        clearTimeout(handler);
    };
  }, [projectName, frameworkInputs, characters, scriptPieces, gameEngine, language]);

  const handleCharactersGenerated = useCallback((newCharacters: Character[]) => {
    setCharacters(prev => [...prev, ...newCharacters]);
    const newScriptPieces = newCharacters.map((character, index) => {
      const content = `角色简介\n姓名: ${character.name}\n背景故事: ${character.backstory}\n性格: ${character.personality.join(', ')}\n外貌: ${character.appearance}\n核心动机: ${character.key_motivation}`;
      // Add index to ensure unique ID if generated in the same millisecond
      return { id: Date.now() + index, type: 'scene' as const, content };
    });
    setScriptPieces(prev => [...prev, ...newScriptPieces]);
  }, []);

  const handleSceneGenerated = useCallback((content: string) => {
    setScriptPieces(prev => [...prev, { id: Date.now(), type: 'scene', content }]);
  }, []);

  const handleScriptGenerated = useCallback((content: string) => {
    setScriptPieces(prev => [...prev, { id: Date.now(), type: 'full', content }]);
  }, []);
  
  const handleClearScript = useCallback(() => {
    setScriptPieces([]);
  }, []);

  const handleFrameworkChange = useCallback((section: keyof FrameworkInputs, value: string) => {
    setFrameworkInputs(prev => ({ ...prev, [section]: value }));
  }, []);

  const handleSaveProject = useCallback(() => {
    const projectData: SavedProject = {
      version: APP_VERSION,
      projectName,
      frameworkInputs,
      characters,
      scriptPieces,
      gameEngine,
      language,
    };
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/ /g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also ensure local storage is up-to-date and status is saved
    localStorage.setItem(LOCAL_STORAGE_KEY, jsonString);
    setSaveStatus('saved');

  }, [projectName, frameworkInputs, characters, scriptPieces, gameEngine, language]);

  const handleLoadProjectTrigger = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read.");
        
        const data: SavedProject = JSON.parse(text);

        loadProjectData(data);
        
        // Also save the newly loaded project to local storage
        localStorage.setItem(LOCAL_STORAGE_KEY, text);
        setSaveStatus('saved');

        alert('Project loaded successfully!');

      } catch (error) {
        console.error("Failed to load project:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred while loading the project.");
      } finally {
        // Reset file input to allow loading the same file again
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleNewProject = useCallback(() => {
    if (window.confirm("Are you sure you want to start a new project? Any unsaved changes will be lost.")) {
      const initialState = getInitialState();
      loadProjectData(initialState);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSaveStatus('saved');
    }
  }, []);

  const handleTranslateScriptPiece = useCallback(async (pieceId: number) => {
    const pieceToTranslate = scriptPieces.find(p => p.id === pieceId);
    if (!pieceToTranslate) return;

    try {
      const translatedContent = await translateToChinese(pieceToTranslate.content);
      setScriptPieces(prevPieces => 
        prevPieces.map(p => 
          p.id === pieceId ? { ...p, content: translatedContent } : p
        )
      );
    } catch (error) {
      console.error("Failed to translate script piece:", error);
      alert(error instanceof Error ? error.message : "An unknown translation error occurred.");
      throw error;
    }
  }, [scriptPieces]);

  const handleTranslateFrameworkSection = useCallback(async (section: keyof FrameworkInputs) => {
    const textToTranslate = frameworkInputs[section];
    if (!textToTranslate.trim()) return;

    try {
        const translatedText = await translateToChinese(textToTranslate);
        setFrameworkInputs(prev => ({ ...prev, [section]: translatedText }));
    } catch (error) {
        console.error(`Failed to translate framework section ${section}:`, error);
        // Re-throw to allow the child component to handle its own UI state and error display
        throw error;
    }
  }, [frameworkInputs]);


  return (
    <I18nProvider language={language}>
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        <Header 
          projectName={projectName} 
          onSettingsClick={() => setIsSettingsOpen(true)}
          language={language}
          onLanguageChange={setLanguage}
          onSave={handleSaveProject}
          onLoad={handleLoadProjectTrigger}
          onNewProject={handleNewProject}
          saveStatus={saveStatus}
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelected} 
          style={{ display: 'none' }} 
          accept=".json,application/json"
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Generators & Characters */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <ProjectManager projectName={projectName} onProjectNameChange={setProjectName} />
              <MainLeftTabs
                frameworkInputs={frameworkInputs}
                onFrameworkChange={handleFrameworkChange}
                onTranslateFrameworkSection={handleTranslateFrameworkSection}
                onCharactersGenerated={handleCharactersGenerated}
                onSceneGenerated={handleSceneGenerated}
                onScriptGenerated={handleScriptGenerated}
                characters={characters}
                gameEngine={gameEngine}
              />
              <CharacterList characters={characters} />
            </div>

            {/* Right Column: Script Editor */}
            <div className="lg:col-span-2 lg:sticky lg:top-8">
              <ScriptEditor 
                scriptPieces={scriptPieces} 
                onClear={handleClearScript}
                onTranslate={handleTranslateScriptPiece}
              />
            </div>

          </div>
        </main>

        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          gameEngine={gameEngine}
          onGameEngineChange={setGameEngine}
          customApiKey={customApiKey}
          onCustomApiKeyChange={setCustomApiKey}
          appVersion={APP_VERSION.toString()}
        />
      </div>
    </I18nProvider>
  );
}

export default App;
