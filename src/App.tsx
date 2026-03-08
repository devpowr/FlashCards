import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Sparkles, X, Heart, Layers, Settings, Bookmark, ArrowLeft, Trash2, User, Compass, Plus, Search, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard } from './components/Flashcard';
import { FlashcardData } from './types';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EXPLORE_DATA: { category: string, description: string, words: Omit<FlashcardData, 'id'>[] }[] = [
  {
    category: "Office & Professionalism",
    description: "Corporate jargon and professional vocabulary.",
    words: [
      { word: "Synergy", phonetic: "/ˈsɪnərdʒi/", partOfSpeech: "noun", definition: "The interaction of elements that when combined produce a total effect that is greater than the sum of the individual elements.", example: "We need to create synergy between the marketing and sales teams." },
      { word: "Paradigm", phonetic: "/ˈpærədaɪm/", partOfSpeech: "noun", definition: "A typical example or pattern of something; a model.", example: "The discovery of DNA created a new paradigm in biology." },
      { word: "Leverage", phonetic: "/ˈlɛvərɪdʒ/", partOfSpeech: "verb", definition: "Use (something) to maximum advantage.", example: "We must leverage our existing resources to complete the project." },
      { word: "Bandwidth", phonetic: "/ˈbændwɪdθ/", partOfSpeech: "noun", definition: "The energy or mental capacity required to deal with a situation.", example: "I don't have the bandwidth to take on another project right now." }
    ]
  },
  {
    category: "Gen Z Slang",
    description: "Modern internet slang and cultural terms.",
    words: [
      { word: "Rizz", phonetic: "/rɪz/", partOfSpeech: "noun", definition: "Style, charm, or attractiveness; the ability to attract a romantic partner.", example: "He has unspoken rizz." },
      { word: "No cap", phonetic: "/noʊ kæp/", partOfSpeech: "phrase", definition: "Used to emphasize that a statement is not a lie; for real.", example: "That was the best movie I have ever seen, no cap." },
      { word: "Bet", phonetic: "/bɛt/", partOfSpeech: "exclamation", definition: "An expression of agreement, approval, or confirmation.", example: "'We are leaving at 8.' 'Bet.'" },
      { word: "Bussin", phonetic: "/ˈbʌsɪn/", partOfSpeech: "adjective", definition: "Extremely good, especially regarding food.", example: "This pizza is bussin." }
    ]
  },
  {
    category: "Communication",
    description: "Words to express yourself clearly and effectively.",
    words: [
      { word: "Articulate", phonetic: "/ɑːrˈtɪkjʊlət/", partOfSpeech: "adjective", definition: "Having or showing the ability to speak fluently and coherently.", example: "She is an articulate and engaging speaker." },
      { word: "Eloquent", phonetic: "/ˈɛləkwənt/", partOfSpeech: "adjective", definition: "Fluent or persuasive in speaking or writing.", example: "He gave an eloquent speech at the wedding." },
      { word: "Concise", phonetic: "/kənˈsaɪs/", partOfSpeech: "adjective", definition: "Giving a lot of information clearly and in a few words.", example: "Please keep your summary concise." },
      { word: "Lucid", phonetic: "/ˈluːsɪd/", partOfSpeech: "adjective", definition: "Expressed clearly; easy to understand.", example: "The author provided a lucid explanation of the complex theory." }
    ]
  },
  {
    category: "General & Academic",
    description: "Sophisticated words for everyday use.",
    words: [
      { word: "Ubiquitous", phonetic: "/juːˈbɪkwɪtəs/", partOfSpeech: "adjective", definition: "Present, appearing, or found everywhere.", example: "Smartphones have become ubiquitous in modern society." },
      { word: "Ephemeral", phonetic: "/ɪˈfɛmərəl/", partOfSpeech: "adjective", definition: "Lasting for a very short time.", example: "Fashions are ephemeral." },
      { word: "Mellifluous", phonetic: "/mɛˈlɪfluəs/", partOfSpeech: "adjective", definition: "(of a voice or words) sweet or musical; pleasant to hear.", example: "The singer had a mellifluous voice." },
      { word: "Serendipity", phonetic: "/ˌsɛrənˈdɪpɪti/", partOfSpeech: "noun", definition: "The occurrence and development of events by chance in a happy or beneficial way.", example: "Finding the exact book I needed at the thrift store was pure serendipity." }
    ]
  }
];

export default function App() {
  const [theme, setTheme] = useState('');
  const [reviewStack, setReviewStack] = useState<FlashcardData[]>(() => {
    const saved = localStorage.getItem('reviewStack');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedCards, setSavedCards] = useState<FlashcardData[]>(() => {
    const saved = localStorage.getItem('savedCards');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'review' | 'saved' | 'settings' | 'profile' | 'explore'>('review');
  const [exploreTab, setExploreTab] = useState<'themes' | 'dictionary'>('themes');
  const [exploreSearch, setExploreSearch] = useState('');
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('reviewStack', JSON.stringify(reviewStack));
    localStorage.setItem('savedCards', JSON.stringify(savedCards));
  }, [reviewStack, savedCards]);

  const generateFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const existingWords = [...reviewStack, ...savedCards].map(fc => fc.word);
      const prompt = `Generate 5 advanced, interesting, or highly relevant words related to the theme: "${theme.trim()}". 
      Do not include any of these words: ${existingWords.join(', ')}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                phonetic: { type: Type.STRING, description: "Phonetic spelling, e.g., /həˈləʊ/" },
                partOfSpeech: { type: Type.STRING },
                definition: { type: Type.STRING },
                example: { type: Type.STRING }
              },
              required: ["word", "partOfSpeech", "definition", "example"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      const newWords: Omit<FlashcardData, 'id'>[] = JSON.parse(text);
      
      const newFlashcards: FlashcardData[] = newWords.map(word => ({
        ...word,
        id: crypto.randomUUID(),
      }));

      setReviewStack(prev => [...newFlashcards, ...prev]);
      setTheme('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right', card: FlashcardData) => {
    setExitDirection(direction);
    setReviewStack(prev => prev.slice(1));
    if (direction === 'right') {
      setSavedCards(prev => [card, ...prev]);
    }
  };

  const deleteSavedCard = (id: string) => {
    setSavedCards(prev => prev.filter(card => card.id !== id));
  };

  const clearAllData = () => {
    setReviewStack([]);
    setSavedCards([]);
    setShowClearConfirm(false);
  };

  return (
    <div className="h-screen w-screen bg-[#141218] text-[#E6E0E9] font-roboto overflow-hidden relative flex flex-col">
      {/* Floating Toolbar (Top Left) */}
      <div className="absolute top-6 left-6 z-50">
        {view === 'review' ? (
          <div className="flex flex-col bg-[#2B2930] rounded-full border border-[#49454F] shadow-lg overflow-hidden">
            <button 
              onClick={() => setView('saved')} 
              className="w-12 h-12 flex items-center justify-center hover:bg-[#49454F] transition-colors relative"
              aria-label="Saved Cards"
            >
              <Bookmark className="w-5 h-5 text-[#D0BCFF]" />
              {savedCards.length > 0 && (
                <span className="absolute top-1 right-1 bg-[#D0BCFF] text-[#381E72] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {savedCards.length}
                </span>
              )}
            </button>
            <div className="h-[1px] w-full bg-[#49454F]" />
            <button 
              onClick={() => setView('profile')} 
              className="w-12 h-12 flex items-center justify-center hover:bg-[#49454F] transition-colors"
              aria-label="Profile"
            >
              <User className="w-5 h-5 text-[#CAC4D0]" />
            </button>
            <div className="h-[1px] w-full bg-[#49454F]" />
            <button 
              onClick={() => setView('settings')} 
              className="w-12 h-12 flex items-center justify-center hover:bg-[#49454F] transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-[#CAC4D0]" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setView('review')} 
            className="w-12 h-12 rounded-full bg-[#2B2930] border border-[#49454F] flex items-center justify-center hover:bg-[#49454F] transition-colors shadow-lg"
            aria-label="Back to Review"
          >
            <ArrowLeft className="w-5 h-5 text-[#E6E0E9]" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {view === 'review' && (
        <div className="flex-1 flex flex-col relative w-full h-full">
          {/* Center: Cards */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32 pt-20 w-full">
            {reviewStack.length > 0 ? (
              <div className="w-full max-w-sm flex flex-col items-center">
                <div className="relative w-full h-[420px]">
                  <AnimatePresence custom={exitDirection}>
                    {reviewStack.slice(0, 3).map((card, index) => {
                      const isTop = index === 0;
                      return (
                        <motion.div
                          key={card.id}
                          custom={exitDirection}
                          className="absolute w-full h-full origin-bottom"
                          style={{ zIndex: 10 - index }}
                          initial={{ scale: 0.8, opacity: 0, y: 50 }}
                          animate={{ 
                            scale: 1 - index * 0.05, 
                            y: index * 15,
                            opacity: 1 - index * 0.2
                          }}
                          exit={(dir) => ({
                            x: dir === 'right' ? 500 : dir === 'left' ? -500 : 0,
                            opacity: 0,
                            rotate: dir === 'right' ? 15 : dir === 'left' ? -15 : 0,
                            transition: { duration: 0.3 }
                          })}
                          drag={isTop ? "x" : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          onDragEnd={(e, info) => {
                            if (info.offset.x > 100) handleSwipe('right', card);
                            else if (info.offset.x < -100) handleSwipe('left', card);
                          }}
                          whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                        >
                          <Flashcard data={card} mode="review" />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                
                {/* Swipe Controls */}
                <div className="flex justify-center gap-8 mt-12 w-full">
                  <button 
                    onClick={() => handleSwipe('left', reviewStack[0])}
                    className="w-16 h-16 rounded-full bg-[#1D1B20] border border-[#49454F] flex items-center justify-center text-[#F2B8B5] hover:bg-[#49454F] transition-colors shadow-lg"
                    aria-label="Skip card"
                  >
                    <X size={32} />
                  </button>
                  <button 
                    onClick={() => handleSwipe('right', reviewStack[0])}
                    className="w-16 h-16 rounded-full bg-[#4F378B] flex items-center justify-center text-[#EADDFF] hover:bg-[#6750A4] transition-colors shadow-lg"
                    aria-label="Save card"
                  >
                    <Heart size={32} fill="currentColor" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center h-full">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#1D1B20] mb-6 text-[#CAC4D0] shadow-lg border border-[#49454F]">
                  <Layers className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-normal text-[#E6E0E9] mb-3">
                  You're all caught up!
                </h3>
                <p className="text-[#CAC4D0] max-w-xs text-center">
                  Enter a new theme below to generate more flashcards.
                </p>
              </div>
            )}
          </div>

          {/* Bottom: Search/Generate */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#141218] via-[#141218] to-transparent z-40 flex flex-col items-center">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mb-4 text-[#F2B8B5] flex items-center gap-2 text-sm bg-[#601410] px-4 py-3 rounded-xl shadow-lg border border-[#8C1D18]"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 w-full max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setView('explore')}
                className="w-14 h-14 rounded-full bg-[#2B2930] border border-[#49454F] flex items-center justify-center hover:bg-[#49454F] transition-colors shadow-xl flex-shrink-0"
                aria-label="Explore"
              >
                <Compass className="w-6 h-6 text-[#D0BCFF]" />
              </button>
              <form onSubmit={generateFlashcards} className="relative flex-1">
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Enter a theme (e.g., Biology)..."
                  className="w-full bg-[#2B2930] text-[#E6E0E9] placeholder-[#938F99] px-6 py-4 rounded-full border border-[#49454F] focus:border-[#D0BCFF] outline-none shadow-xl transition-colors pr-16 text-lg"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !theme.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-[#D0BCFF] text-[#381E72] flex items-center justify-center disabled:opacity-50 hover:bg-[#EADDFF] transition-colors shadow-md"
                  aria-label="Generate"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Explore View */}
      {view === 'explore' && (
        <div className="h-full overflow-y-auto pt-24 px-6 pb-6 w-full max-w-4xl mx-auto relative flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-normal mb-2 text-[#E6E0E9] text-center sm:text-left">Explore</h2>
              <p className="text-[#CAC4D0] text-center sm:text-left">Discover curated collections or search the dictionary.</p>
            </div>
            
            <div className="flex bg-[#1D1B20] rounded-full p-1 border border-[#49454F]">
              <button
                onClick={() => setExploreTab('themes')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${exploreTab === 'themes' ? 'bg-[#4F378B] text-[#EADDFF]' : 'text-[#CAC4D0] hover:text-[#E6E0E9]'}`}
              >
                <Layers className="w-4 h-4" />
                Themes
              </button>
              <button
                onClick={() => setExploreTab('dictionary')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${exploreTab === 'dictionary' ? 'bg-[#4F378B] text-[#EADDFF]' : 'text-[#CAC4D0] hover:text-[#E6E0E9]'}`}
              >
                <Book className="w-4 h-4" />
                Dictionary
              </button>
            </div>
          </div>
          
          {exploreTab === 'themes' ? (
            <div className="flex flex-col gap-8">
              {EXPLORE_DATA.map((category, idx) => (
                <div key={idx} className="bg-[#1D1B20] rounded-[24px] p-6 border border-[#49454F]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-2xl font-medium text-[#E6E0E9] mb-1">{category.category}</h3>
                      <p className="text-[#CAC4D0]">{category.description}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newCards = category.words.map(w => ({ ...w, id: crypto.randomUUID() }));
                        setReviewStack(prev => [...newCards, ...prev]);
                        setView('review');
                      }}
                      className="px-4 py-2 bg-[#4F378B] text-[#EADDFF] rounded-full font-medium hover:bg-[#6750A4] transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Stack
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {category.words.map((word, wordIdx) => (
                      <div key={wordIdx} className="bg-[#2B2930] p-4 rounded-[16px] border border-[#49454F]">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-medium text-[#D0BCFF]">{word.word}</h4>
                          <span className="text-xs px-2 py-1 bg-[#49454F] rounded-md text-[#CAC4D0]">{word.partOfSpeech}</span>
                        </div>
                        <p className="text-[#E6E0E9] text-sm mb-2">{word.definition}</p>
                        <p className="text-[#CAC4D0] text-xs italic">"{word.example}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#938F99]" />
                <input
                  type="text"
                  value={exploreSearch}
                  onChange={(e) => setExploreSearch(e.target.value)}
                  placeholder="Search dictionary..."
                  className="w-full bg-[#1D1B20] text-[#E6E0E9] placeholder-[#938F99] pl-12 pr-6 py-4 rounded-full border border-[#49454F] focus:border-[#D0BCFF] outline-none transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EXPLORE_DATA.flatMap(c => c.words)
                  .filter(w => w.word.toLowerCase().includes(exploreSearch.toLowerCase()) || w.definition.toLowerCase().includes(exploreSearch.toLowerCase()))
                  .sort((a, b) => a.word.localeCompare(b.word))
                  .map((word, idx) => (
                    <div key={idx} className="bg-[#1D1B20] p-5 rounded-[20px] border border-[#49454F] flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-xl font-medium text-[#D0BCFF] mb-1">{word.word}</h4>
                          <span className="text-sm text-[#938F99]">{word.phonetic}</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-[#2B2930] border border-[#49454F] rounded-md text-[#CAC4D0]">{word.partOfSpeech}</span>
                      </div>
                      <p className="text-[#E6E0E9] text-sm mb-3 flex-1">{word.definition}</p>
                      <p className="text-[#CAC4D0] text-sm italic border-l-2 border-[#4F378B] pl-3">"{word.example}"</p>
                      <div className="mt-4 pt-4 border-t border-[#49454F] flex justify-end">
                        <button 
                          onClick={() => {
                            setReviewStack(prev => [{ ...word, id: crypto.randomUUID() }, ...prev]);
                            setView('review');
                          }}
                          className="text-sm px-4 py-2 bg-[#2B2930] text-[#D0BCFF] rounded-full font-medium hover:bg-[#49454F] transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Stack
                        </button>
                      </div>
                    </div>
                  ))}
                {EXPLORE_DATA.flatMap(c => c.words).filter(w => w.word.toLowerCase().includes(exploreSearch.toLowerCase()) || w.definition.toLowerCase().includes(exploreSearch.toLowerCase())).length === 0 && (
                  <div className="col-span-full text-center py-12 text-[#938F99]">
                    No words found matching "{exploreSearch}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved View */}
      {view === 'saved' && (
        <div className="h-full overflow-y-auto pt-24 px-6 pb-6 w-full max-w-6xl mx-auto">
          <h2 className="text-3xl font-normal mb-8 text-[#E6E0E9] text-center sm:text-left">Saved Cards</h2>
          {savedCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {savedCards.map((card) => (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="h-[400px]"
                  >
                    <Flashcard 
                      data={card} 
                      mode="saved"
                      onDelete={deleteSavedCard} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#1D1B20] mb-6 text-[#CAC4D0] border border-[#49454F]">
                <Heart className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-normal text-[#E6E0E9] mb-2">
                No saved cards yet
              </h3>
              <p className="text-[#CAC4D0] max-w-sm">
                Swipe right on cards in the Review tab to save them here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Profile View */}
      {view === 'profile' && (
        <div className="h-full overflow-y-auto pt-24 px-6 pb-6 w-full max-w-2xl mx-auto relative">
          <h2 className="text-3xl font-normal mb-8 text-[#E6E0E9] text-center sm:text-left">Profile</h2>
          
          <div className="bg-[#1D1B20] rounded-[24px] p-6 border border-[#49454F] flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#4F378B] flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-[#EADDFF]" />
            </div>
            <h3 className="text-2xl font-medium text-[#E6E0E9] mb-1">Guest User</h3>
            <p className="text-[#CAC4D0] mb-6">Learning new words every day.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
              <div className="bg-[#2B2930] p-4 rounded-[16px] border border-[#49454F]">
                <p className="text-[#CAC4D0] text-sm mb-1">Cards Saved</p>
                <p className="text-2xl font-medium text-[#D0BCFF]">{savedCards.length}</p>
              </div>
              <div className="bg-[#2B2930] p-4 rounded-[16px] border border-[#49454F]">
                <p className="text-[#CAC4D0] text-sm mb-1">Stack Size</p>
                <p className="text-2xl font-medium text-[#D0BCFF]">{reviewStack.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings View */}
      {view === 'settings' && (
        <div className="h-full overflow-y-auto pt-24 px-6 pb-6 w-full max-w-2xl mx-auto relative">
          <h2 className="text-3xl font-normal mb-8 text-[#E6E0E9] text-center sm:text-left">Settings</h2>
          
          <div className="bg-[#1D1B20] rounded-[24px] p-6 border border-[#49454F]">
            <h3 className="text-xl font-medium text-[#E6E0E9] mb-4">Data Management</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-[#49454F] gap-4">
              <div>
                <p className="text-[#E6E0E9] font-medium">Clear all data</p>
                <p className="text-[#CAC4D0] text-sm">Permanently delete all saved cards and review stack.</p>
              </div>
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 bg-[#601410] text-[#F2B8B5] rounded-full font-medium hover:bg-[#8C1D18] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-[#E6E0E9] font-medium">Storage Usage</p>
                <p className="text-[#CAC4D0] text-sm mt-1">Review Stack: {reviewStack.length} cards</p>
                <p className="text-[#CAC4D0] text-sm">Saved: {savedCards.length} cards</p>
              </div>
            </div>
          </div>

          {/* Custom Confirm Modal */}
          <AnimatePresence>
            {showClearConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-[#2B2930] rounded-[24px] p-6 max-w-sm w-full border border-[#49454F] shadow-2xl"
                >
                  <h3 className="text-xl font-medium text-[#E6E0E9] mb-2">Clear all data?</h3>
                  <p className="text-[#CAC4D0] mb-6">This action cannot be undone. All your saved flashcards and review stack will be permanently deleted.</p>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      className="px-5 py-2 rounded-full text-[#D0BCFF] hover:bg-[#D0BCFF]/10 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={clearAllData}
                      className="px-5 py-2 rounded-full bg-[#F2B8B5] text-[#601410] hover:bg-[#F9DEDC] transition-colors font-medium"
                    >
                      Clear Data
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
