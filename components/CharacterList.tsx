import React from 'react';
import { Character } from '../types';
import { useI18n } from '../i18n/I18nProvider';

interface CharacterListProps {
  characters: Character[];
}

const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0ZM10.5 1.5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM12.75 6.03a9.002 9.002 0 0 1 4.133 2.112 3 3 0 0 1-1.28 5.416 9.006 9.006 0 0 1-4.133-2.112 3 3 0 0 1 1.28-5.416Z" />
  </svg>
);


export const CharacterList: React.FC<CharacterListProps> = ({ characters }) => {
  const { t } = useI18n();

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <UserGroupIcon className="w-6 h-6 text-teal-400" />
        <h2 className="text-xl font-bold text-teal-400">{t('characterRosterTitle')}</h2>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {characters.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('characterRosterPlaceholder')}</p>
        ) : (
          characters.map((char, index) => (
            <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-lg text-white">{char.name}</h3>
              <div className="mt-3">
                <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider">{t('characterCardAppearance')}</h4>
                <p className="text-sm text-gray-300 mt-1">{char.appearance}</p>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider">{t('characterCardBackground')}</h4>
                <p className="text-sm text-gray-300 mt-1">{char.backstory}</p>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider">{t('characterCardRelationships')}</h4>
                <p className="text-sm text-gray-300 mt-1">{char.relationships}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};