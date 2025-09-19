import React, { useState } from 'react';
import { ScriptPiece } from '../types';
import { useI18n } from '../i18n/I18nProvider';

interface ScriptEditorProps {
  scriptPieces: ScriptPiece[];
  onClear: () => void;
  onTranslate: (pieceId: number) => Promise<void>;
}

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

const LanguageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3.75h.008v.008H12v-.008ZM8.25 7.5l3 3m0 0l3-3m-3 3v-3m-3.375 9.75L3 12m0 0l3.375-3.75M3 12h18" />
  </svg>
);


export const ScriptEditor: React.FC<ScriptEditorProps> = ({ scriptPieces, onClear, onTranslate }) => {
  const [copied, setCopied] = useState(false);
  const [translatingPieceId, setTranslatingPieceId] = useState<number | null>(null);
  const { t } = useI18n();

  const handleCopy = () => {
    const fullScript = scriptPieces.map(p => p.content).join('\n\n---\n\n');
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTranslate = async (pieceId: number) => {
    if (translatingPieceId) return;
    setTranslatingPieceId(pieceId);
    try {
      await onTranslate(pieceId);
    } finally {
      setTranslatingPieceId(null);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-teal-400">{t('scriptCanvasTitle')}</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
            disabled={scriptPieces.length === 0}
          >
            {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            {copied ? t('copiedButton') : t('copyButton')}
          </button>
          <button 
            onClick={onClear}
            className="flex items-center gap-2 bg-red-800/50 hover:bg-red-800/80 text-red-300 px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
            disabled={scriptPieces.length === 0}
          >
            <TrashIcon className="w-4 h-4" />
            {t('clearAllButton')}
          </button>
        </div>
      </div>
      <div className="p-6 flex-grow overflow-y-auto h-[60vh] lg:h-auto">
        {scriptPieces.length === 0 ? (
          <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <p className="text-lg">{t('scriptCanvasPlaceholderTitle')}</p>
            <p>{t('scriptCanvasPlaceholderSubtitle')}</p>
          </div>
        ) : (
          <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-gray-100 max-w-none space-y-4">
            {scriptPieces.map(piece => (
              <div key={piece.id} className="group relative">
                <div className="whitespace-pre-wrap p-4 bg-gray-900/50 rounded-lg">
                  {piece.content}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleTranslate(piece.id)}
                    className="bg-gray-700 hover:bg-sky-600 text-gray-300 hover:text-white p-2 rounded-md transition-colors flex items-center justify-center h-8 w-8"
                    title={t('translatePieceButton')}
                    disabled={translatingPieceId !== null}
                  >
                    {translatingPieceId === piece.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <LanguageIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};