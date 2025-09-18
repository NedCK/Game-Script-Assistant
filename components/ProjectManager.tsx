import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

interface ProjectManagerProps {
    projectName: string;
    onProjectNameChange: (name: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ projectName, onProjectNameChange }) => {
    const { t } = useI18n();
    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('projectManagerTitle')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t('projectManagerSubtitle')}</p>
            <input 
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                placeholder={t('projectManagerPlaceholder')}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
        </div>
    );
};
