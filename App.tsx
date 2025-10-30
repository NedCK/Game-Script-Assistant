import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ProjectManager } from './components/ProjectManager';
import { I18nProvider } from './i18n/I18nProvider';
import { Character, GameEngine, SavedProject, SaveStatus, PlotPoint } from './types';
import { CharacterManager } from './components/CharacterList';
import { Storyboard } from './components/ScriptEditor';

const getInitialState = (): SavedProject => ({
  version: 2,
  projectName: 'My Awesome Game',
  characters: [],
  plotPoints: [],
  gameEngine: 'unity',
  language: 'en',
});

const APP_VERSION = 2;
const LOCAL_STORAGE_KEY = 'gameScriptProject_v2';

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [gameEngine, setGameEngine] = useState<GameEngine>('unity');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [projectName, setProjectName] = useState('My Awesome Game');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

  const loadProjectData = (data: SavedProject) => {
      if (!data.version || data.version < APP_VERSION) {
        throw new Error("This project file is from an older version of the app and cannot be loaded. Please start a new project.");
      }
      if (data.version > APP_VERSION) {
        throw new Error("This project file was created with a newer version of the app and cannot be loaded.");
      }

      setProjectName(data.projectName);
      setCharacters(data.characters || []);
      setPlotPoints(data.plotPoints || []);
      setGameEngine(data.gameEngine || 'unity');
      setLanguage(data.language || 'en');
  };

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
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

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
            characters,
            plotPoints,
            gameEngine,
            language,
        };
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projectData));
            setTimeout(() => setSaveStatus('saved'), 500);
        } catch (error) {
            console.error("Failed to save project to local storage:", error);
            setSaveStatus('unsaved');
        }
    }, 1500);

    return () => clearTimeout(handler);
  }, [projectName, characters, plotPoints, gameEngine, language]);

  const handleSaveProject = useCallback(() => {
    const projectData: SavedProject = {
      version: APP_VERSION,
      projectName,
      characters,
      plotPoints,
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
    
    localStorage.setItem(LOCAL_STORAGE_KEY, jsonString);
    setSaveStatus('saved');
  }, [projectName, characters, plotPoints, gameEngine, language]);

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
        localStorage.setItem(LOCAL_STORAGE_KEY, text);
        setSaveStatus('saved');
        alert('Project loaded successfully!');
      } catch (error) {
        console.error("Failed to load project:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred while loading the project.");
      } finally {
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

  return (
    <I18nProvider language={language}>
      <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
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

        <main className="p-4 sm:p-6 lg:p-8 flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-full">
            
            <div className="lg:col-span-1 flex flex-col gap-6 h-full">
              <ProjectManager projectName={projectName} onProjectNameChange={setProjectName} />
              <CharacterManager 
                characters={characters} 
                onCharactersChange={setCharacters} 
              />
            </div>

            <div className="lg:col-span-2 h-full">
              <Storyboard 
                plotPoints={plotPoints}
                onPlotPointsChange={setPlotPoints}
                characters={characters}
                gameEngine={gameEngine}
              />
            </div>
          </div>
        </main>

        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          gameEngine={gameEngine}
          onGameEngineChange={setGameEngine}
          appVersion={APP_VERSION.toString()}
        />
      </div>
    </I18nProvider>
  );
}

export default App;