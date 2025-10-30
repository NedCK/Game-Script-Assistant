import React from 'react';
import { PlotPoint } from '../types';
import { useI18n } from '../i18n/I18nProvider';

interface PlotPointCardProps {
  point: PlotPoint;
  onEdit: () => void;
}

const ScriptIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.15v-1.215a2.25 2.25 0 0 1 2.25-2.25h1.5a2.25 2.25 0 0 1 2.25 2.25v1.215m0 0a2.25 2.25 0 0 0 2.25 2.25h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.215m-10.5 0a2.25 2.25 0 0 0-2.25 2.25v1.215a2.25 2.25 0 0 0 2.25 2.25h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.215m-10.5 0a2.25 2.25 0 0 1-2.25-2.25H5.625a2.25 2.25 0 0 1-2.25-2.25V7.875c0-.621.504-1.125 1.125-1.125H9.375c.621 0 1.125.504 1.125 1.125v9.375Z" /></svg>);


export const PlotPointCard: React.FC<PlotPointCardProps> = ({ point, onEdit }) => {
  const { t } = useI18n();
  const hasScript = point.script && point.script.trim().length > 0;

  return (
    <div 
      className="bg-gray-700/50 rounded-lg p-4 flex flex-col justify-between h-48 border border-transparent hover:border-teal-500 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <div>
        <h3 className="font-bold text-white truncate">{point.title}</h3>
        <p className="text-sm text-gray-400 mt-2 line-clamp-3">{point.summary || t('noSummaryPlaceholder')}</p>
      </div>
      <div className="flex justify-end items-center mt-4">
        {hasScript && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <ScriptIcon className="w-4 h-4" />
            <span>{t('scriptGeneratedStatus')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
