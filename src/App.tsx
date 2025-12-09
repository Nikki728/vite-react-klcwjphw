import React, { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, AlertCircle, BookOpen, GraduationCap, X, Plus, Trash2, Save, Loader2, Sparkles, Clock, FileText, Download, LogOut, User, LogIn, ExternalLink, Filter, KeyRound, Settings, Check, Zap, Activity, PenLine, ChevronDown, ChevronUp, StickyNote, Search, Pencil, Edit3, NotebookPen, Library, ListChecks, Database, Square, CheckSquare, Sun, Moon, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';

// ==========================================
// 🔴 設定區：已填入您的 Firebase Keys
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDVqPF-W_z4lvkuVMfllRLW2fVBji4uzp0",
  authDomain: "german-words-5587e.firebaseapp.com",
  projectId: "german-words-5587e",
  storageBucket: "german-words-5587e.firebasestorage.app",
  messagingSenderId: "828187409950",
  appId: "1:828187409950:web:16a712b992f6965abbb80f"
};

// Gemini API Key (已填入您的 Key)
const GEMINI_API_KEY = "AIzaSyAtoBHF5-axdlUEGQvW4Ch1GJxIOIF7fos"; 

// ==========================================
// 📚 內建單字庫 (預設標記為 builtin)
// ==========================================
const BUILT_IN_WORDS = [
  { word: 'Termin', article: 'der', plural: '-e', meaning: '預約；約會', englishMeaning: 'appointment', level: 'A1', type: 'noun', example: 'Ich habe einen Termin beim Arzt.', exampleMeaning: '我跟醫生有一個預約。' },
  { word: 'Arbeit', article: 'die', plural: '-en', meaning: '工作', englishMeaning: 'work', level: 'A1', type: 'noun', example: 'Die Arbeit macht mir Spaß.', exampleMeaning: '這份工作讓我很開心。' },
  // ... 您可以在這裡貼上更多單字
];
// ==========================================

// 初始化 Firebase
let app, auth, db;
try {
  if (firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase 初始化失敗", e);
}

// --- 統一取得 API Key 的邏輯 ---
const getEffectiveApiKey = () => {
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey && localKey.length > 10) return localKey;
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) return GEMINI_API_KEY.trim();
  return "";
};

// --- 全域變數：快取可用的模型名稱 ---
let cachedModelName = localStorage.getItem('gemini_preferred_model');

// --- 核心 AI 呼叫函式 ---
const callGeminiAI = async (prompt) => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("API Key 未設定");

  if (!cachedModelName) {
    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listResponse.json();
      
      if (!listResponse.ok) {
        cachedModelName = 'gemini-1.5-flash';
      } else {
        const availableModels = listData.models
          ?.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
          ?.map(m => m.name.replace('models/', ''));
        
        if (availableModels?.length > 0) {
          cachedModelName = availableModels.find(m => m.includes('2.5-flash')) || 
                            availableModels.find(m => m.includes('2.0-flash')) || 
                            availableModels.find(m => m.includes('flash')) || 
                            availableModels[0];
          localStorage.setItem('gemini_preferred_model', cachedModelName);
        } else {
          cachedModelName = 'gemini-1.5-flash';
        }
      }
    } catch (e) {
      cachedModelName = 'gemini-1.5-flash';
    }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cachedModelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: cachedModelName.includes('flash') || cachedModelName.includes('1.5') 
          ? { responseMimeType: "application/json" } 
          : undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || response.statusText;
      if (errorMsg.includes("responseMimeType") || response.status === 400) {
        return await callGeminiAI_TextMode(prompt, cachedModelName, apiKey);
      }
      if (response.status === 404) {
        cachedModelName = null; 
        localStorage.removeItem('gemini_preferred_model');
      }
      throw new Error(`模型 ${cachedModelName} 錯誤: ${errorMsg}`);
    }
    return data;
  } catch (e) {
    throw e;
  }
};

const callGeminiAI_TextMode = async (prompt, model, apiKey) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || response.statusText);
  return data;
};

// --- 設定 Modal ---
const SettingsModal = ({ isOpen, onClose }) => {
  const [key, setKey] = useState('');
  const [diagStatus, setDiagStatus] = useState('idle');
  const [diagResult, setDiagResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setKey(localStorage.getItem('gemini_api_key') || (GEMINI_API_KEY || ''));
      setDiagStatus('idle');
      setDiagResult(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    const cleanKey = key.trim();
    if (cleanKey) {
      localStorage.setItem('gemini_api_key', cleanKey);
      cachedModelName = null;
      localStorage.removeItem('gemini_preferred_model');
      setDiagStatus('success');
      setDiagResult({ message: "設定已儲存，下次操作將重新偵測最佳模型。" });
      setTimeout(() => { onClose(); }, 1500);
    } else {
      localStorage.removeItem('gemini_api_key');
      onClose();
    }
  };

  const runDiagnosis = async () => {
    setDiagStatus('loading');
    setDiagResult(null);
    const testKey = key.trim();
    if (!testKey) { setDiagStatus('error'); setDiagResult({ error: "請先輸入 API Key" }); return; }

    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
      const listData = await listResponse.json();
      if (!listResponse.ok) throw new Error(listData.error?.message || `無法取得模型清單: ${listResponse.status}`);

      const models = listData.models?.filter(m => m.name.includes('gemini'))?.map(m => m.name.replace('models/', ''));
      let testModel = 'gemini-1.5-flash';
      if (models?.length > 0) testModel = models.find(m => m.includes('2.5-flash')) || models.find(m => m.includes('flash')) || models[0];
      
      const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${testKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
      });
      const genData = await genResponse.json();
      if (!genResponse.ok) throw new Error(`模型 ${testModel} 生成失敗: ${genData.error?.message}`);

      setDiagStatus('success');
      setDiagResult({ message: "診斷成功！", availableModels: models, testedModel: testModel });
    } catch (e) {
      setDiagStatus('error');
      setDiagResult({ error: e.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={20}/> 系統設定與診斷</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Google Gemini API Key</label>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="AIza..." className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            
            {diagResult && (
              <div className={`mt-2 p-2 rounded text-xs flex items-start gap-2 ${diagStatus === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-200' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-200'}`}>
                {diagStatus === 'testing' && <Loader2 size={14} className="animate-spin mt-0.5"/>}
                <span className="break-all">{diagResult?.message || diagResult?.error}</span>
              </div>
            )}
            {diagStatus === 'success' && diagResult?.availableModels && (
               <div className="max-h-24 overflow-y-auto bg-white dark:bg-slate-700 border border-green-200 dark:border-green-800 p-1.5 rounded font-mono text-[10px] leading-tight mt-2 dark:text-slate-300">
                  {diagResult.availableModels.map(m => <div key={m} className={m === diagResult.testedModel ? 'text-purple-600 dark:text-purple-300 font-bold' : ''}>{m} {m === diagResult.testedModel && '(自動選用)'}</div>)}
               </div>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={runDiagnosis} disabled={diagStatus === 'loading'} className="px-3 py-2 rounded text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex items-center gap-2"><Zap size={16}/> 測試連線</button>
            <button onClick={handleSave} className="px-4 py-2 rounded text-white flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"><Save size={18}/> 儲存設定</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- LoginScreen, FilterChip ---
const LoginScreen = ({ onLogin, onRedirectLogin, error, errorCode }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-700">
      <div className="bg-yellow-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-200 dark:shadow-yellow-900/20 transform -rotate-6"><BookOpen size={40} className="text-slate-900" /></div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Deutsch Lernen</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">您的雲端德語單字本</p>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-lg text-sm mb-6 text-left border border-red-100 dark:border-red-800">
          <div className="flex items-center gap-2 font-bold mb-1"><AlertCircle size={16}/><span>登入遇到問題</span></div>
          <p>{error}</p>
          {errorCode === 'auth/popup-blocked' && <div className="mt-2"><button onClick={onRedirectLogin} className="w-full bg-purple-600 text-white text-xs py-2 rounded flex justify-center gap-2"><LogIn size={14}/> 改用跳轉登入</button></div>}
        </div>
      )}
      <button onClick={onLogin} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-3 px-4 rounded-xl flex justify-center gap-3 shadow-sm transition-colors"><span className="font-bold text-blue-600 dark:text-blue-400 mr-2">G</span> 使用 Google 帳號登入</button>
    </div>
  </div>
);

const FilterChip = ({ label, isSelected, onClick, colorClass = "bg-slate-900 text-white" }) => (
  <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all h-8 flex items-center ${isSelected ? `${colorClass} border-transparent shadow` : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"}`}>{label}</button>
);

// --- 筆記編輯 Modal ---
const NoteModal = ({ isOpen, onClose, note, onSave }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) setContent(note || '');
  }, [isOpen, note]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><NotebookPen size={20}/> 編輯筆記</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在這裡輸入筆記..."
            className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-slate-700 dark:text-slate-200 dark:bg-slate-700 dark:border-slate-600"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">取消</button>
            <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 flex items-center gap-2"><Save size={18}/> 儲存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 單字卡元件 ---
const VocabularyCard = ({ item, onToggleStatus, onDelete, onEditNote, onEditCard, isBatchMode, isSelected, onSelect }) => {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const handleSpeak = (text, e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'de-DE'; utterance.rate = 0.9; window.speechSynthesis.speak(utterance); }
  };
  const getCardStyle = () => { 
    if (item.status === 'learned') return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'; 
    if (item.status === 'review') return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'; 
    return 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'; 
  };
  const getTypeBadgeColor = () => { 
    if (item.type === 'noun') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'; 
    if (item.type === 'verb') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'; 
    if (item.type === 'adj') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200'; 
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'; 
  };
  
  const isBuiltIn = item.source === 'builtin';
  const SourceIcon = isBuiltIn ? Database : User;
  const sourceColor = isBuiltIn ? "text-purple-400 dark:text-purple-300" : "text-orange-400 dark:text-orange-300";

  return (
    <div 
      className={`relative p-6 rounded-xl border-2 transition-all shadow-sm hover:shadow-md flex flex-col h-full 
        ${getCardStyle()} 
        ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900 border-purple-500' : ''}
        ${isBatchMode ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''}
      `}
      onClick={isBatchMode ? onSelect : undefined}
    >
      <div className="flex justify-between items-center mb-4">
        {/* 左上角：標籤區 (含來源圖示) */}
        <div className="flex gap-2 items-center">
          <div className={`flex items-center justify-center p-1 rounded-full bg-slate-50 dark:bg-slate-700 ${sourceColor}`} title={isBuiltIn ? "內建單字" : "自行新增"}>
            <SourceIcon size={14} strokeWidth={2.5}/>
          </div>
          <span className="h-6 flex items-center justify-center px-2 text-xs font-bold rounded bg-slate-800 dark:bg-slate-950 text-white">{item.level}</span>
          <span className={`h-6 flex items-center justify-center px-2 text-xs font-bold rounded uppercase ${getTypeBadgeColor()}`}>{item.type}</span>
        </div>

        {/* 右上角：操作區 (或選取框) */}
        <div className="flex gap-1 items-center">
           {isBatchMode ? (
             <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300 dark:border-slate-600'}`}>
                {isSelected && <Check size={16} className="text-white"/>}
             </div>
           ) : (
             <>
                <button onClick={(e) => {e.stopPropagation(); onToggleStatus(item.id, item.status, 'review')}} className={`p-1.5 rounded-full ${item.status==='review'?'bg-amber-500 text-white':'text-gray-300 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400'}`} title="需加強"><AlertCircle size={18}/></button>
                <button onClick={(e) => {e.stopPropagation(); onToggleStatus(item.id, item.status, 'learned')}} className={`p-1.5 rounded-full ${item.status==='learned'?'bg-emerald-500 text-white':'text-gray-300 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400'}`} title="已學會"><CheckCircle size={18}/></button>
                <button onClick={(e) => {e.stopPropagation(); onEditCard(item)}} className="p-1.5 rounded-full text-gray-300 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 ml-1" title="編輯卡片"><Edit3 size={16}/></button>
                <button onClick={(e) => {e.stopPropagation(); onDelete(item.id)}} className="p-1.5 rounded-full text-gray-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400" title="刪除"><Trash2 size={16}/></button>
             </>
           )}
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          {item.type === 'noun' && <span className={`text-lg font-bold ${item.article==='der'?'text-blue-600 dark:text-blue-400':item.article==='die'?'text-red-500 dark:text-red-400':item.article==='das'?'text-green-600 dark:text-green-400':'text-gray-500 dark:text-gray-400'}`}>{item.article}</span>}
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{item.word}</h2>
          <button onClick={(e) => handleSpeak(item.type==='noun'?`${item.article} ${item.word}`:item.word, e)} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1"><Volume2 size={20}/></button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-mono">{item.type==='noun'&&item.plural?`Pl. ${item.word}${item.plural}`:''}</div>
        
        {/* 翻譯區域 */}
        <div className="border-l-4 border-slate-200 dark:border-slate-600 pl-3">
          <p className="text-lg text-slate-700 dark:text-slate-200 font-medium">{item.meaning}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {item.englishMeaning ? `(${item.englishMeaning})` : <span className="opacity-50 italic">(點擊上方編輯按鈕新增英文)</span>}
          </p>
        </div>

        {item.type==='verb'&&item.conjugation&&<div className="mt-3 bg-slate-100 dark:bg-slate-700/50 p-2 rounded text-sm text-slate-600 dark:text-slate-300 flex gap-2 border border-slate-200 dark:border-slate-600"><Clock size={16} className="mt-0.5 text-purple-500 dark:text-purple-400 shrink-0"/><div className="font-mono">{item.conjugation}</div></div>}
      </div>
      <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10">
        <div className="flex gap-2 mb-1"><p className="text-sm text-slate-600 dark:text-slate-400 italic flex-1">"{item.example}"</p><button onClick={(e)=>handleSpeak(item.example,e)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><Volume2 size={16}/></button></div>
        <p className="text-xs text-slate-400 dark:text-slate-500 pl-1">{item.exampleMeaning}</p>
      </div>

      <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-slate-600 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          {item.note ? (
            <button 
              onClick={(e) => {e.stopPropagation(); setIsNoteExpanded(!isNoteExpanded)}}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              {isNoteExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              {isNoteExpanded ? '收起筆記' : '查看筆記'}
            </button>
          ) : <span className="text-xs text-transparent">.</span>}
          
          <button 
            onClick={(e) => {e.stopPropagation(); onEditNote(item)}}
            className="text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-1 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30"
            title="編輯筆記"
          >
            <NotebookPen size={16} />
          </button>
        </div>
        
        {item.note && isNoteExpanded && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-200 border border-yellow-100 dark:border-yellow-900/50 relative">
            <StickyNote size={14} className="text-yellow-400 absolute top-2 right-2 opacity-50"/>
            <p className="whitespace-pre-wrap">{item.note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- AI 批量匯入 Modal ---
const BatchImportModal = ({ isOpen, onClose, onBatchAdd }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => { setHasKey(!!getEffectiveApiKey()); }, [isOpen]);

  if (!isOpen) return null;

  const processBatch = async () => {
    if (!inputText.trim()) { alert("請輸入單字"); return; }
    try {
        const json = JSON.parse(inputText);
        if (Array.isArray(json)) {
            setIsProcessing(true); setStatusMsg('還原備份...');
            await onBatchAdd(json);
            setStatusMsg('成功！'); setTimeout(() => { onClose(); setInputText(''); setStatusMsg(''); setIsProcessing(false); }, 1000);
            return;
        }
    } catch (e) {}

    if (!getEffectiveApiKey()) { alert("請先點擊右上角設定 API Key"); return; }

    const words = inputText.split(/[\n,;]+/).map(w => w.trim()).filter(w => w.length > 0);
    if (!words.length) return;

    setIsProcessing(true); setProgress(0);
    const BATCH = 5; 
    const total = Math.ceil(words.length / BATCH);
    let successCount = 0; 
    let skippedCount = 0;

    for (let i = 0; i < total; i++) {
      setStatusMsg(`AI 分析中... (${i+1}/${total})`);
      try {
        const chunk = words.slice(i * BATCH, (i + 1) * BATCH);
        // Prompt 更新：要求英文翻譯，並明確例句翻譯為繁體中文
        const prompt = `Translate German words: ${JSON.stringify(chunk)} to Traditional Chinese and English. 
        Return a valid JSON ARRAY. Each object: 
        - word
        - meaning (Chinese)
        - englishMeaning (English)
        - type (noun/verb/adj/adv)
        - level (A1/A2/B1)
        - article (der/die/das)
        - plural
        - conjugation (string, if verb: 3rd Pers. Sg. Indikativ for Präsens, Präteritum, Perfekt. e.g., "er geht, ging, ist gegangen")
        - example (German)
        - exampleMeaning (Traditional Chinese translation ONLY).`;
        
        const data = await callGeminiAI(prompt);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const res = JSON.parse(text.replace(/```json|```/g, '').trim());
          if (Array.isArray(res)) { 
            const result = await onBatchAdd(res, 'custom'); // 自訂來源
            if (result) {
              successCount += result.added;
              skippedCount += result.skipped;
            }
          }
        }
      } catch (e) { 
        console.error("Batch Error:", e);
        setStatusMsg(`錯誤: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
      setProgress(Math.round(((i+1)/total)*100));
    }
    setIsProcessing(false);
    
    if (successCount > 0 || skippedCount > 0) {
      alert(`批量新增完成！\n\n✅ 成功新增: ${successCount} 個\n⚠️ 略過重複: ${skippedCount} 個`);
      setStatusMsg(`完成！新增 ${successCount} 個`);
      setTimeout(() => { onClose(); setInputText(''); setStatusMsg(''); setProgress(0); }, 2000);
    } else {
       setStatusMsg('未新增任何單字');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-purple-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3"><Sparkles size={20} className="text-yellow-400"/><h3 className="font-bold">AI 批量匯入</h3>
          {!hasKey && <span className="bg-red-500/20 text-red-200 text-xs px-2 py-1 rounded border border-red-500/50">未設定 API Key</span>}</div>
          {!isProcessing && <button onClick={onClose}><X size={20}/></button>}
        </div>
        <div className="p-6 space-y-4 overflow-y-auto text-slate-800 dark:text-white">
          <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} disabled={isProcessing} placeholder="貼上單字列表 (一行一個)..." className="w-full h-48 p-4 border rounded font-mono text-sm dark:bg-slate-700 dark:border-slate-600"/>
          {isProcessing && <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded overflow-hidden"><div className="bg-purple-600 h-2 transition-all" style={{width: `${progress}%`}}></div></div>}
          <div className="flex justify-between items-center">
             <span className="text-sm text-slate-500 dark:text-slate-400">{statusMsg}</span>
             {!isProcessing && <button onClick={processBatch} className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">開始分析</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 單字編輯 Modal (通用：新增/編輯) ---
const WordFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({ 
    word: '', article: '', plural: '', meaning: '', englishMeaning: '', 
    level: 'A2', type: 'noun', example: '', exampleMeaning: '', conjugation: '' 
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => { 
    setHasKey(!!getEffectiveApiKey()); 
    if (initialData) {
      setFormData(initialData); 
    } else {
      setFormData({ word: '', article: '', plural: '', meaning: '', englishMeaning: '', level: 'A2', type: 'noun', example: '', exampleMeaning: '', conjugation: '' });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAutoFill = async () => {
    if (!formData.word) { alert("請輸入單字"); return; }
    if (!getEffectiveApiKey()) { alert("請先點擊右上角設定 API Key"); return; }

    setIsGenerating(true);
    try {
      // Prompt 更新：針對動詞變化要求精確的 3 態
      const prompt = `Analyze German word "${formData.word}". Return valid JSON object: meaning (Chinese), englishMeaning (English), article, plural, type (noun/verb/adj/adv), level, example, exampleMeaning (Traditional Chinese translation ONLY), conjugation (string, if verb: 3rd Pers. Sg. Indikativ for Präsens, Präteritum, Perfekt. e.g., "er geht, ging, ist gegangen").`;
      const data = await callGeminiAI(prompt);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setFormData(prev => ({ ...prev, ...JSON.parse(text.replace(/```json|```/g, '').trim()) }));
      }
    } catch (e) { alert(`AI 錯誤: ${e.message}`); }
    setIsGenerating(false);
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg">{initialData ? '編輯單字' : '新增單字'}</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-slate-800 dark:text-white">
          <div className="flex gap-2">
            <input required value={formData.word} onChange={e=>setFormData({...formData, word: e.target.value})} className="flex-1 p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="單字"/>
            <button type="button" onClick={handleAutoFill} disabled={isGenerating || !hasKey} className={`px-3 py-2 rounded text-white flex gap-2 items-center ${hasKey?'bg-purple-600':'bg-slate-400'}`}>{isGenerating?<Loader2 className="animate-spin" size={18}/>:<Sparkles size={18}/>} AI 填寫</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required value={formData.meaning} onChange={e=>setFormData({...formData, meaning: e.target.value})} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="中文意思"/>
            <input value={formData.englishMeaning} onChange={e=>setFormData({...formData, englishMeaning: e.target.value})} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="英文意思"/>
          </div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600"><option value="noun">名詞</option><option value="verb">動詞</option><option value="adj">形容詞</option><option value="adv">副詞</option></select><select value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600"><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option></select></div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.article} onChange={e=>setFormData({...formData, article: e.target.value})} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600" disabled={formData.type!=='noun'}><option value="">-</option><option value="der">der</option><option value="die">die</option><option value="das">das</option></select><input value={formData.plural} onChange={e=>setFormData({...formData, plural: e.target.value})} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="複數" disabled={formData.type!=='noun'}/></div>
          {formData.type==='verb'&&<input value={formData.conjugation} onChange={e=>setFormData({...formData, conjugation: e.target.value})} className="w-full p-2 border border-purple-200 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-800 rounded" placeholder="動詞變化"/>}
          <input value={formData.example} onChange={e=>setFormData({...formData, example: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="例句"/>
          <input value={formData.exampleMeaning} onChange={e=>setFormData({...formData, exampleMeaning: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="例句翻譯"/>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded">取消</button>
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 flex items-center gap-2"><Save size={18}/> 儲存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 主程式 App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [vocabList, setVocabList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false); 
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentEditNoteItem, setCurrentEditNoteItem] = useState(null);
  const [currentEditItem, setCurrentEditItem] = useState(null); 
  const [authError, setAuthError] = useState(null);
  const [authErrorCode, setAuthErrorCode] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 

  // 1. 深色模式狀態與切換 (預設讀取系統或本地設定)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // 切換模式並存入 LocalStorage
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    
    // 直接操作 DOM，確保 class 切換
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 初始載入時套用
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 2. 滾動偵測與篩選器收合 (預設收起)
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 新增：批次管理模式
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // 3. 處理滾動邏輯 (修復版：加入 Hysteresis 緩衝區)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      // 往下捲動超過 100px 才判定為捲動
      if (currentY > 100 && !isScrolled) {
        setIsScrolled(true);
        setIsFilterExpanded(false); // 觸發收起
      } 
      // 往回捲到小於 20px 才判定為回到頂部
      else if (currentY < 20 && isScrolled) {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]);

  // 4. 監聽 isScrolled 變化來自動收合 (只執行一次)
  useEffect(() => {
    if (isScrolled && isFilterExpanded) {
      setIsFilterExpanded(false); // 往下捲 -> 自動收起
    }
  }, [isScrolled]);

  // 5. 注入 Tailwind Config (強制 class 模式 - 修正版)
  useEffect(() => {
    // 這裡我們建立一個 script 標籤來定義設定，這比直接設 window 變數更穩
    if (!document.getElementById('tailwind-config')) {
      const configScript = document.createElement('script');
      configScript.id = 'tailwind-config';
      configScript.innerHTML = "tailwind = { config: { darkMode: 'class' } };";
      document.head.insertBefore(configScript, document.head.firstChild);
    }
    
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      // 確保 config 先執行
      setTimeout(() => {
          document.head.appendChild(script);
      }, 10);
    }
  }, []);

  useEffect(() => {
    if (!auth) { setIsLoading(false); return; }
    getRedirectResult(auth).then((result) => { if (result) setUser(result.user); }).catch((error) => { console.error("Redirect Login Error:", error); setAuthErrorCode(error.code); setAuthError(`重新導向登入失敗: ${error.message}`); });
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setIsLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => { setAuthError(null); setAuthErrorCode(null); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (error) { setAuthErrorCode(error.code); setAuthError(error.code === 'auth/popup-blocked' ? "彈出視窗被阻擋" : "登入失敗"); } };
  const handleRedirectLogin = async () => { setAuthError(null); try { await signInWithRedirect(auth, new GoogleAuthProvider()); } catch (error) { setAuthError(error.message); } };
  const handleLogout = async () => { try { await signOut(auth); setVocabList([]); } catch (error) { console.error("Logout Failed", error); } };

  // Data Fetching
  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'vocab_users', user.uid, 'items');
    const unsubscribe = onSnapshot(q, (snapshot) => { 
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.seconds : 0;
            const timeB = b.createdAt ? b.createdAt.seconds : 0;
            return timeB - timeA;
        });
        setVocabList(data);
    }, (err) => { if (err.code === 'permission-denied') setAuthError("資料庫權限不足"); });
    return () => unsubscribe();
  }, [user]);

  const seedData = async () => { if (!user || !db) return; const batch = writeBatch(db); SEED_VOCAB_DATA.forEach((word) => { const docRef = doc(collection(db, 'vocab_users', user.uid, 'items')); batch.set(docRef, { ...word, status: 'new', source: 'builtin', createdAt: serverTimestamp() }); }); await batch.commit(); };
  
  // 處理新增或更新
  const handleSaveWord = async (wordData) => {
    if (!user) return;
    if (!currentEditItem) {
        const isDuplicate = vocabList.some(item => item.word.toLowerCase() === wordData.word.trim().toLowerCase());
        if (isDuplicate) {
            alert(`單字 "${wordData.word}" 已經存在了！無法重複新增。`);
            return; 
        }
    }
    if (currentEditItem) {
      await updateDoc(doc(db, 'vocab_users', user.uid, 'items', currentEditItem.id), wordData);
    } else {
      await addDoc(collection(db, 'vocab_users', user.uid, 'items'), { ...wordData, status: 'new', source: 'custom', createdAt: serverTimestamp() });
    }
    setShowWordModal(false);
  };

  const handleToggleStatus = async (id, currentStatus, targetStatus) => { const newStatus = currentStatus === targetStatus ? 'new' : targetStatus; await updateDoc(doc(db, 'vocab_users', user.uid, 'items', id), { status: newStatus }); };
  const handleDeleteWord = async (id) => { if (window.confirm('確定刪除？')) await deleteDoc(doc(db, 'vocab_users', user.uid, 'items', id)); };
  
  // 批量新增 (含防呆檢查)
  const handleBatchAdd = async (words, source = 'custom') => { 
    const CHUNK_SIZE = 400;
    const chunks = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
        chunks.push(words.slice(i, i + CHUNK_SIZE));
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        let batchCount = 0;

        chunk.forEach(w => {
            const isDuplicate = vocabList.some(item => item.word.toLowerCase() === w.word.trim().toLowerCase());
            if (isDuplicate) {
                totalSkipped++;
            } else {
                const docRef = doc(collection(db, 'vocab_users', user.uid, 'items')); 
                const newWord = {
                    word: w.word || '',
                    meaning: w.meaning || '',
                    englishMeaning: w.englishMeaning || '',
                    article: w.article || '',
                    plural: w.plural || '',
                    type: w.type || 'noun',
                    level: w.level || 'A1',
                    example: w.example || '',
                    exampleMeaning: w.exampleMeaning || '',
                    conjugation: w.conjugation || '',
                    status: 'new',
                    source: source, 
                    createdAt: serverTimestamp()
                };
                batch.set(docRef, newWord); 
                batchCount++;
                totalAdded++;
            }
        });

        if (batchCount > 0) {
            await batch.commit();
        }
    }
    return { added: totalAdded, skipped: totalSkipped };
  };

  // 匯入內建單字庫
  const handleImportBuiltIn = async () => {
    if (!user) return;
    if (!confirm(`確定要匯入 ${BUILT_IN_WORDS.length} 個內建單字嗎？\n系統會自動跳過重複的單字。`)) return;

    setIsImporting(true);
    try {
        const result = await handleBatchAdd(BUILT_IN_WORDS, 'builtin');
        alert(`匯入完成！\n\n✅ 成功新增: ${result.added} 個\n⚠️ 略過重複: ${result.skipped} 個`);
    } catch (e) {
        console.error("Import Error", e);
        alert("匯入發生錯誤，請稍後再試。");
    } finally {
        setIsImporting(false);
    }
  };

  // 批次選取邏輯
  const toggleSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  // 批次刪除
  const handleBatchDelete = async () => {
    if (!confirm(`確定要刪除選取的 ${selectedItems.size} 張卡片嗎？此動作無法復原。`)) return;
    
    const batch = writeBatch(db);
    selectedItems.forEach(id => {
      const docRef = doc(db, 'vocab_users', user.uid, 'items', id);
      batch.delete(docRef);
    });
    
    try {
      await batch.commit();
      setSelectedItems(new Set());
      setIsBatchMode(false);
    } catch (e) {
      alert("刪除失敗");
    }
  };
  
  const downloadData = () => { const blob = new Blob([JSON.stringify(vocabList, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "german_backup.json"; link.click(); };

  const openEditNote = (item) => {
    setCurrentEditNoteItem(item);
    setShowNoteModal(true);
  };

  const handleSaveNote = async (newContent) => {
    if (currentEditNoteItem) {
      await updateDoc(doc(db, 'vocab_users', user.uid, 'items', currentEditNoteItem.id), { note: newContent });
    }
  };

  const openAddModal = () => {
    setCurrentEditItem(null); 
    setShowWordModal(true);
  };

  const openEditCardModal = (item) => {
    setCurrentEditItem(item); 
    setShowWordModal(true);
  };

  const toggleFilter = (setter, value) => { setter(prev => prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]); };
  
  const filtered = vocabList.filter(item => {
    const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(item.level);
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(item.type);
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.some(s => s === 'new' ? (item.status === 'new' || !item.status) : item.status === s);
    const sourceMatch = selectedSources.length === 0 || selectedSources.includes(item.source || 'custom');
    const searchMatch = searchTerm === '' || item.word.toLowerCase().includes(searchTerm.toLowerCase());
    return levelMatch && typeMatch && statusMatch && sourceMatch && searchMatch;
  });

  const activeFiltersCount = selectedLevels.length + selectedTypes.length + selectedStatuses.length + selectedSources.length;

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500"><Loader2 className="animate-spin mb-4" size={32} /><p>載入中...</p></div>;
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("apiKey")) return <div className="min-h-screen flex items-center justify-center bg-slate-100 p-8 font-sans"><div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center"><AlertCircle size={32} className="mx-auto text-red-500 mb-4"/><h2 className="text-2xl font-bold text-slate-800 mb-2">尚未設定資料庫</h2><p className="text-slate-500">請打開 <code>App.jsx</code> 填入您的 Firebase Keys。</p></div></div>;
  if (!user) return <LoginScreen onLogin={handleLogin} onRedirectLogin={handleRedirectLogin} error={authError} errorCode={authErrorCode} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-20 shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2"><div className="bg-yellow-400 p-1.5 rounded text-slate-900"><BookOpen size={20} /></div><span className="font-bold text-lg hidden sm:inline">Deutsch App</span></div>
        <div className="flex gap-2 items-center">
            <button 
              onClick={toggleTheme} 
              className="p-2 border rounded-lg transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              title={isDarkMode ? "切換亮色模式" : "切換深色模式"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* 批次選取開關 */}
            <button 
              onClick={() => { setIsBatchMode(!isBatchMode); setSelectedItems(new Set()); }}
              className={`p-2 border rounded-lg transition-colors ${isBatchMode ? 'bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/40 dark:border-purple-500 dark:text-purple-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
              title="批次管理"
            >
              <ListChecks size={18} />
            </button>

            <div className="flex items-center gap-2 mr-2 border-r pr-4 border-slate-200 dark:border-slate-700">
               {user.photoURL ? <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full"/> : <User size={20} />}
               <button onClick={handleLogout} className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1"><LogOut size={16} /> <span className="hidden sm:inline">登出</span></button>
            </div>
            {/* 新增：匯入內建單字庫按鈕 */}
            <button 
              onClick={handleImportBuiltIn} 
              disabled={isImporting}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 disabled:opacity-50" 
              title="匯入題庫"
            >
              {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Library size={18} />}
            </button>
            
            <button onClick={() => setShowSettingsModal(true)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400" title="API 設定"><Settings size={18} /></button>
            <button onClick={downloadData} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"><Download size={18} /></button>
            <button onClick={() => setShowBatchModal(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 shadow-sm"><FileText size={18} /> <span className="hidden sm:inline">批量</span></button>
            <button onClick={openAddModal} className="px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 flex items-center gap-1 shadow-sm"><Plus size={18} /> <span className="hidden sm:inline">新增</span></button>
        </div>
      </header>

      {/* 2. 主畫面使用全寬版面 (max-w-full + 適當 padding) */}
      <main className="w-full max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex-grow">
        {vocabList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl mt-8 mx-auto max-w-4xl">
             <GraduationCap size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4"/>
             <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">單字本是空的</h3>
             <p className="text-slate-500 dark:text-slate-400 mb-6">點擊右上角的「新增」按鈕開始建立單字庫，或匯入內建題庫。</p>
             <div className="flex justify-center gap-4">
                <button onClick={seedData} className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">匯入範例單字</button>
                <button onClick={handleImportBuiltIn} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"><Library size={18}/> 匯入內建題庫</button>
             </div>
          </div>
         ) : (
          <>
             {/* 1. 智慧收折篩選器 */}
             <div className={`mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-20 z-10 transition-all duration-300 ease-in-out ${isScrolled && !isFilterExpanded ? 'p-2' : 'p-5'}`}>
                {/* 篩選器 Header (點擊可展開/收起) */}
                <div 
                  className="flex items-center justify-between"
                >
                  {/* 搜尋框區塊 */}
                  <div className="flex-1 max-w-md mr-4">
                    <div className="relative group">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500" size={16} />
                       <input 
                         type="text" 
                         placeholder="搜尋德文單字..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all dark:text-white"
                       />
                    </div>
                  </div>

                  <div 
                    className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  >
                    <Filter size={14} />
                    <span>篩選 ({filtered.length}/{vocabList.length})</span>
                    {isScrolled && !isFilterExpanded && activeFiltersCount > 0 && (
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full normal-case">
                        {activeFiltersCount} 個條件
                      </span>
                    )}
                    {isScrolled && (
                      <div className="text-slate-400 hover:text-slate-600">
                        {isFilterExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 篩選內容區 (根據狀態顯示/隱藏) */}
                {isFilterExpanded && (
                  <div className={`space-y-3 ${isScrolled ? 'mt-4 animate-in fade-in slide-in-from-top-2 duration-200' : 'mt-4'}`}>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">等級:</span>{['A1', 'A2', 'B1'].map(l => (<FilterChip key={l} label={l} isSelected={selectedLevels.includes(l)} onClick={() => toggleFilter(setSelectedLevels, l)} colorClass="bg-slate-700 text-white" />))}</div>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">詞性:</span><FilterChip label="名詞" isSelected={selectedTypes.includes('noun')} onClick={() => toggleFilter(setSelectedTypes, 'noun')} colorClass="bg-blue-600 text-white" /><FilterChip label="動詞" isSelected={selectedTypes.includes('verb')} onClick={() => toggleFilter(setSelectedTypes, 'verb')} colorClass="bg-purple-600 text-white" /><FilterChip label="形容詞" isSelected={selectedTypes.includes('adj')} onClick={() => toggleFilter(setSelectedTypes, 'adj')} colorClass="bg-yellow-500 text-white" /><FilterChip label="副詞" isSelected={selectedTypes.includes('adv')} onClick={() => toggleFilter(setSelectedTypes, 'adv')} colorClass="bg-orange-500 text-white" /></div>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">狀態:</span><FilterChip label="未標記" isSelected={selectedStatuses.includes('new')} onClick={() => toggleFilter(setSelectedStatuses, 'new')} colorClass="bg-slate-400 text-white" /><FilterChip label="需加強" isSelected={selectedStatuses.includes('review')} onClick={() => toggleFilter(setSelectedStatuses, 'review')} colorClass="bg-amber-500 text-white" /><FilterChip label="已學會" isSelected={selectedStatuses.includes('learned')} onClick={() => toggleFilter(setSelectedStatuses, 'learned')} colorClass="bg-emerald-600 text-white" /></div>
                    {/* 新增：來源篩選 */}
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">來源:</span><FilterChip label="自訂" isSelected={selectedSources.includes('custom')} onClick={() => toggleFilter(setSelectedSources, 'custom')} colorClass="bg-orange-500 text-white" /><FilterChip label="內建" isSelected={selectedSources.includes('builtin')} onClick={() => toggleFilter(setSelectedSources, 'builtin')} colorClass="bg-purple-500 text-white" /></div>
                  </div>
                )}
             </div>
             
             {/* 3. 四欄式排版 (lg:grid-cols-4) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
               {filtered.map(item => <VocabularyCard key={item.id} item={item} onToggleStatus={handleToggleStatus} onDelete={handleDeleteWord} onEditNote={openEditNote} onEditCard={openEditCardModal} isBatchMode={isBatchMode} isSelected={selectedItems.has(item.id)} onSelect={() => toggleSelect(item.id)} />)}
             </div>

             {/* 批次操作浮動選單 */}
             {isBatchMode && selectedItems.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                  <span className="text-slate-700 dark:text-white font-bold">{selectedItems.size} 張已選取</span>
                  <button onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                    <Trash2 size={16}/> 刪除
                  </button>
                  <button onClick={() => setSelectedItems(new Set())} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">取消選取</button>
                </div>
             )}
          </>
         )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 German Vocabulary Tool. 
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>Developed by</span>
            <a 
              href="https://nikkistudiotw.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Nikki Yu <Globe size={12} />
            </a>
          </div>
        </div>
      </footer>

      <BatchImportModal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} onBatchAdd={handleBatchAdd} />
      <WordFormModal isOpen={showWordModal} onClose={() => setShowWordModal(false)} onSave={handleSaveWord} initialData={currentEditItem} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <NoteModal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} note={currentEditNoteItem?.note} onSave={handleSaveNote} />
    </div>
  );
}