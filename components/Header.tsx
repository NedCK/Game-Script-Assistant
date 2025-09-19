import React from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { SaveStatus } from '../types';

const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.996 1.11-.996h2.593c.55 0 1.02.454 1.11.996l.38 1.951c.414.213.806.46 1.17.734l1.86-1.02a1.125 1.125 0 0 1 1.372.493l1.296 2.247a1.125 1.125 0 0 1-.22 1.472l-1.442 1.254c.03.226.048.457.048.697s-.018.471-.048.697l1.442 1.254a1.125 1.125 0 0 1 .22 1.472l-1.296 2.247a1.125 1.125 0 0 1-1.372.493l-1.86-1.02a7.942 7.942 0 0 1-1.17.734l-.38 1.951a1.125 1.125 0 0 1-1.11.996h-2.593a1.125 1.125 0 0 1-1.11-.996l-.38-1.951a7.942 7.942 0 0 1-1.17-.734l-1.86 1.02a1.125 1.125 0 0 1-1.372-.493l-1.296-2.247a1.125 1.125 0 0 1 .22-1.472l1.442-1.254a6.763 6.763 0 0 1 0-1.394l-1.442-1.254a1.125 1.125 0 0 1-.22-1.472l1.296-2.247a1.125 1.125 0 0 1 1.372.493l1.86 1.02c.364-.273.756-.521 1.17-.734l.38-1.951ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
    </svg>
);

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const FolderOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 0 1 6 7.5h12a2.25 2.25 0 0 1 2.25 2.25m-16.5 0v1.5A2.25 2.25 0 0 0 6 13.5h12a2.25 2.25 0 0 0 2.25-2.25v-1.5m-16.5 0h16.5" />
    </svg>
);

const DocumentPlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

interface HeaderProps {
  projectName: string;
  onSettingsClick: () => void;
  language: 'en' | 'zh';
  onLanguageChange: (lang: 'en' | 'zh') => void;
  onSave: () => void;
  onLoad: () => void;
  onNewProject: () => void;
  saveStatus: SaveStatus;
}

export const Header: React.FC<HeaderProps> = ({ projectName, onSettingsClick, language, onLanguageChange, onSave, onLoad, onNewProject, saveStatus }) => {
  const { t } = useI18n();
  
  const getLangButtonStyle = (lang: 'en' | 'zh') => {
    return language === lang 
      ? 'bg-teal-600 text-white' 
      : 'bg-gray-700 text-gray-300 hover:bg-gray-600';
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saved': return t('statusSaved');
      case 'saving': return t('statusSaving');
      case 'unsaved': return t('statusUnsaved');
      default: return '';
    }
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 shadow-lg border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Row: Project Title */}
        <div className="flex justify-start items-center">
          <h1 className="text-2xl font-bold text-teal-400 truncate">
            <span className="font-light text-gray-300">Gen-AI Scriptwriter /</span> {projectName}
          </h1>
        </div>
        
        {/* Bottom Row: Toolbar */}
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200"
            aria-label="New project"
          >
            <DocumentPlusIcon className="w-4 h-4" />
            {t('newProjectButton')}
          </button>
          <button
            onClick={onLoad}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200"
            aria-label="Load project"
          >
            <FolderOpenIcon className="w-4 h-4" />
            {t('loadProjectButton')}
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200"
            aria-label="Save project"
          >
            <SaveIcon className="w-4 h-4" />
            {t('saveProjectButton')}
          </button>

          <span className="text-xs text-gray-500 italic ml-2">{getStatusText()}</span>

          <div className="flex-grow"></div> {/* Spacer */}

          {/* Language Switcher */}
          <div className="flex items-center bg-gray-800 rounded-md p-1">
            <button 
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${getLangButtonStyle('en')}`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('zh')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${getLangButtonStyle('zh')}`}
            >
              中文
            </button>
          </div>
          
          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 w-9 h-9 rounded-md font-semibold transition-colors duration-200"
            aria-label="Open settings"
          >
            <CogIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};