import React, { useState } from 'react';
import { Sparkles, Mic, MicOff, CornerDownLeft, Loader2, ArrowRight } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const QuickAddBar = () => {
  const { addNewTask, parseQuickAddTask, isAiProcessing, aiActionType } = useBoard();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [previewTask, setPreviewTask] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported on this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleParseText(transcript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleParseText = async (textToParse) => {
    const query = textToParse || inputText;
    if (!query.trim()) return;

    setIsParsing(true);
    try {
      const parsed = await parseQuickAddTask(query);
      setPreviewTask(parsed);
    } catch (err) {
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleQuickSubmit = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !previewTask) return;

    if (previewTask) {
      await addNewTask(previewTask);
      setPreviewTask(null);
      setInputText('');
    } else {
      setIsParsing(true);
      try {
        const parsed = await parseQuickAddTask(inputText);
        await addNewTask(parsed);
        setInputText('');
      } catch (err) {
        await addNewTask({
          title: inputText.trim(),
          priority: 'medium',
          energyLevel: 'medium',
          estimatedMinutes: 25,
        });
        setInputText('');
      } finally {
        setIsParsing(false);
      }
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleQuickSubmit} className="relative">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-1.5 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
            <div className="pl-2.5 text-indigo-400">
              <Sparkles className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
            </div>

            <input
              id="input-quick-add"
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (previewTask) setPreviewTask(null);
              }}
              onBlur={() => {
                if (inputText.length > 5 && !previewTask) {
                  handleParseText(inputText);
                }
              }}
              placeholder="Magic Quick Add: 'Deploy auth service tomorrow high priority 45 mins' or use voice..."
              className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:outline-none px-2 py-1"
            />

            {previewTask && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded-lg text-xs animate-in fade-in zoom-in-95">
                <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                  {previewTask.title}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                  previewTask.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                  previewTask.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {previewTask.priority}
                </span>
                {previewTask.dueDate && (
                  <span className="text-slate-400 text-[10px]">
                    {previewTask.dueDate}
                  </span>
                )}
                {previewTask.estimatedMinutes && (
                  <span className="text-slate-400 text-[10px]">
                    {previewTask.estimatedMinutes}m
                  </span>
                )}
              </div>
            )}

            <button
              id="btn-voice-input"
              type="button"
              onClick={startVoiceInput}
              className={`p-2 rounded-lg border transition-all ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              id="btn-quick-add-submit"
              type="submit"
              disabled={isParsing || isAiProcessing || !inputText.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold shadow transition-all active:scale-95"
            >
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
