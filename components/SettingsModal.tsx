import React from 'react';
import { GameEngine } from '../types';
import { useI18n } from '../i18n/I18nProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameEngine: GameEngine;
  onGameEngineChange: (engine: GameEngine) => void;
  customApiKey: string;
  onCustomApiKeyChange: (key: string) => void;
  customApiEndpoint: string;
  onCustomApiEndpointChange: (endpoint: string) => void;
  appVersion: string;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  gameEngine,
  onGameEngineChange,
  customApiKey,
  onCustomApiKeyChange,
  customApiEndpoint,
  onCustomApiEndpointChange,
  appVersion,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-teal-400">{t('settingsTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close settings">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Game Engine Setting */}
          <div>
            <label htmlFor="gameEngine" className="block text-sm font-medium text-gray-300 mb-2">
              {t('settingsGameEngineLabel')}
            </label>
            <select
              id="gameEngine"
              value={gameEngine}
              onChange={(e) => onGameEngineChange(e.target.value as GameEngine)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            >
              <option value="unity">Unity</option>
              <option value="unreal">Unreal Engine</option>
              <option value="godot">Godot</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('settingsGameEngineDescription')}</p>
          </div>
          
          {/* API Configuration Setting */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('settingsApiKeyTitle')}</h3>
            
            {/* API Key */}
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              {t('settingsApiKeyLabel')}
            </label>
            <input
              id="apiKey"
              type="password"
              value={customApiKey}
              onChange={(e) => onCustomApiKeyChange(e.target.value)}
              placeholder={t('settingsApiKeyPlaceholder')}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
            <p className="text-xs text-gray-500 mt-1 mb-4">{t('settingsApiKeyDescription')}</p>

            {/* API Endpoint */}
            <label htmlFor="apiEndpoint" className="block text-sm font-medium text-gray-300 mb-2">
              {t('settingsApiEndpointLabel')}
            </label>
            <input
              id="apiEndpoint"
              type="text"
              value={customApiEndpoint}
              onChange={(e) => onCustomApiEndpointChange(e.target.value)}
              placeholder={t('settingsApiEndpointPlaceholder')}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              aria-describedby="apiEndpoint-description"
            />
            <p id="apiEndpoint-description" className="text-xs text-gray-500 mt-1">{t('settingsApiEndpointDescription')}</p>
          </div>

          {/* About this App Section */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">{t('settingsAboutTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-400">
               <p>{t('settingsAboutDesc')}</p>
               <p>
                   {t('settingsAboutVersion')}: {appVersion} —{' '}
                   <a 
                       href="https://ai.google.dev/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-teal-400 hover:text-teal-300 underline"
                   >
                       {t('settingsAboutLink')}
                   </a>
               </p>
            </div>
          </div>

          {/* How to Use Section */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">{t('settingsHowToUseTitle')}</h3>
            <div className="space-y-4 text-sm text-gray-400">
              <div>
                <h4 className="font-semibold text-gray-300">{t('settingsHowToUseStep1Title')}</h4>
                <p>{t('settingsHowToUseStep1Desc')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-300">{t('settingsHowToUseStep2Title')}</h4>
                <p>{t('settingsHowToUseStep2Desc')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-300">{t('settingsHowToUseStep3Title')}</h4>
                <p>{t('settingsHowToUseStep3Desc')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-300">{t('settingsHowToUseStep4Title')}</h4>
                <p>{t('settingsHowToUseStep4Desc')}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 px-4 py-3 text-right rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
          >
            {t('closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
