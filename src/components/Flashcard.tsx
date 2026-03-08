import { useState } from 'react';
import { motion } from 'motion/react';
import { FlashcardData } from '../types';
import { Trash2 } from 'lucide-react';

interface FlashcardProps {
  data: FlashcardData;
  mode: 'review' | 'saved';
  onDelete?: (id: string) => void;
}

export function Flashcard({ data, mode, onDelete }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full h-full perspective-1000 font-roboto">
      <motion.div
        className="w-full h-full relative preserve-3d cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'tween', ease: 'easeInOut' }}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-[#2B2930] rounded-[24px] shadow-lg flex flex-col p-6 border border-[#49454F]">
          {mode === 'saved' && onDelete && (
            <div className="flex justify-end w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(data.id);
                }}
                className="p-3 rounded-full hover:bg-[#49454F] transition-colors text-[#CAC4D0]"
                aria-label="Delete flashcard"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
            <h3 className="text-4xl font-medium text-[#E6E0E9] tracking-tight">{data.word}</h3>
            {data.phonetic && (
              <p className="text-[#CAC4D0] mt-3 font-mono text-base">{data.phonetic}</p>
            )}
          </div>
          {mode === 'review' && (
            <div className="absolute bottom-6 w-full left-0 text-center text-[#938F99] text-sm animate-pulse">
              Tap to flip
            </div>
          )}
        </div>

        {/* Back */}
        <div 
          className="absolute w-full h-full backface-hidden bg-[#4F378B] rounded-[24px] shadow-lg flex flex-col p-6 overflow-y-auto border border-[#4F378B]"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-center justify-between mb-4 border-b border-[#6750A4] pb-3">
            <h3 className="text-2xl font-medium text-[#EADDFF]">{data.word}</h3>
            <span className="text-[#EADDFF] text-sm italic opacity-80">
              {data.partOfSpeech}
            </span>
          </div>
          
          <div className="flex-1">
            <p className="text-[#EADDFF] text-lg leading-relaxed mb-6">
              {data.definition}
            </p>
            
            {data.example && (
              <div className="bg-[#381E72] p-4 rounded-[12px] border-l-4 border-[#D0BCFF]">
                <p className="text-[#EADDFF] text-sm italic">
                  "{data.example}"
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
