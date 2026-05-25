import React, { useState, useEffect, useRef } from 'react';
// 新增引入 Eye, EyeOff
import { Volume2, CheckCircle, AlertCircle, BookOpen, GraduationCap, X, Plus, Trash2, Save, Loader2, Sparkles, Clock, FileText, Download, LogOut, User, LogIn, ExternalLink, Filter, KeyRound, Settings, Check, Zap, Activity, PenLine, ChevronDown, ChevronUp, StickyNote, Search, Pencil, Edit3, NotebookPen, Library, ListChecks, Database, Square, CheckSquare, Globe, ArrowRight, Mail, Key, KeyIcon, RefreshCcw, Lock, UserX, Eye, EyeOff } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore'; 

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

// Gemini API Key (請通過右上角設定貼入最新金鑰)
const GEMINI_API_KEY = ""; 

// ==========================================
// 📚 內建單字庫：A1, A2, B1 等級 (省略部分內容以保持檔案長度)
// ==========================================
const BUILT_IN_WORDS_A1 = [{ word: 'Termin', article: 'der', plural: '-e', meaning: '預約；約會', englishMeaning: 'appointment', level: 'A1', type: 'noun', example: 'Ich habe einen Termin beim Arzt.', exampleMeaning: '我跟醫生有一個預約。' }];
const BUILT_IN_WORDS_A2 = [{ word: 'anmelden', article: '', plural: '', meaning: '報名；註冊', englishMeaning: 'to register', level: 'A2', type: 'verb', conjugation: 'er meldet an, meldete an, hat angemeldet', example: 'Wo kann ich mich anmelden?', exampleMeaning: '我可以在哪裡報名？' }];
const BUILT_IN_WORDS_B1 = [{ word: 'Umwelt', article: 'die', plural: '', meaning: '環境', englishMeaning: 'environment', level: 'B1', type: 'noun', example: 'Wir müssen die Umwelt schützen.', exampleMeaning: '我們必須保護環境。' }];

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
const callGeminiAI = async (prompt, failedModels = []) => { 
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("API Key 未設定");

  // 1. 如果沒有快取模型，執行偵測並選擇最佳模型
  if (!cachedModelName || failedModels.length > 0) {
    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listResponse.json();
      
      if (!listResponse.ok) {
        cachedModelName = 'gemini-1.5-flash';
      } else {
        const availableModels = listData.models
          ?.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
          ?.map(m => m.name.replace('models/', ''))
          .filter(m => !failedModels.includes(m)); 
        
        if (availableModels?.length > 0) {
          
          cachedModelName = availableModels.find(m => m.includes('2.5-flash-live')) ||
                            availableModels.find(m => m.includes('2.5-flash-lite')) ||
                            availableModels.find(m => m.includes('2.5-flash')) || 
                            availableModels.find(m => m.includes('2.5-pro')) ||
                            availableModels[0]; 
          
          localStorage.setItem('gemini_preferred_model', cachedModelName);
        } else {
          throw new Error("所有可用模型皆已嘗試過或額度耗盡。"); 
        }
      }
    } catch (e) {
        if (failedModels.length > 0) throw e; 
        cachedModelName = 'gemini-1.5-flash';
    }
  }
  
  // 2. 執行 API 請求
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
      
      if (response.status === 429 || errorMsg.includes('quota') || errorMsg.includes('limit')) {
        console.warn(`[AI] 模型 ${cachedModelName} 額度耗盡或頻率過高，嘗試切換模型...`);
        
        failedModels.push(cachedModelName); 
        localStorage.removeItem('gemini_preferred_model'); 
        
        return await callGeminiAI(prompt, failedModels); 
      }

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

// --- Email/Password 登入/註冊表單元件 ---
const EmailPasswordForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('註冊成功！您已自動登入。');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (e) {
      console.error(e);
      let errorMsg = '登入/註冊失敗。';
      if (e.code === 'auth/invalid-email') errorMsg = '電子郵件格式無效。';
      else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') errorMsg = '電子郵件或密碼錯誤。';
      else if (e.code === 'auth/email-already-in-use') errorMsg = '此電子郵件已被註冊。';
      else if (e.code === 'auth/weak-password') errorMsg = '密碼強度不足，請使用至少 6 個字元。';
      else if (e.code === 'auth/operation-not-allowed') errorMsg = '請確認 Firebase Console 中已啟用 Email/Password 登入方式。';
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 忘記密碼功能
  const handleResetPassword = async () => {
    if (!email) {
      setError('請先輸入您的電子郵件地址。');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`密碼重設連結已發送到 ${email}。請檢查您的信箱！`);
      setError('');
    } catch (e) {
      setError(`密碼重設失敗: ${e.message}`);
    }
  };

  return (
    <div className="w-full mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800 mb-4">{isRegisterMode ? '註冊新帳號' : '使用 Email 登入'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">電子郵件</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="w-full p-2 border rounded-lg focus:ring-purple-500" 
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">密碼 (至少 6 個字元)</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full p-2 border rounded-lg focus:ring-purple-500" 
            placeholder="••••••••"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-xl transition-colors hover:bg-purple-700 flex items-center justify-center gap-2 shadow-md"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
            isRegisterMode ? '註冊並登入' : '登入帳號'
          )}
        </button>
      </form>
      
      <div className="flex justify-between mt-3 text-sm">
        <button 
          onClick={handleResetPassword}
          className="text-slate-500 hover:text-purple-600 underline"
        >
          忘記密碼？
        </button>
        <button 
          onClick={() => setIsRegisterMode(!isRegisterMode)}
          className="text-purple-600 hover:text-purple-800 underline"
        >
          {isRegisterMode ? '已經有帳號？' : '還沒有帳號？點此註冊'}
        </button>
      </div>
    </div>
  );
};

// --- 帳號設定 Modal ---
const AccountSettingsModal = ({ isOpen, onClose, user, onDeleteAccount }) => {
  if (!isOpen) return null;

  // 密碼重設
  const handlePasswordReset = () => {
    if (!user.email) return; 
    sendPasswordResetEmail(auth, user.email)
      .then(() => alert(`密碼重設連結已發送到 ${user.email}。請檢查您的信箱！`))
      .catch(e => alert(`重設密碼失敗: ${e.message}`));
  };
  
  // 註銷
  const handleDeleteAttempt = () => {
    onDeleteAccount();
    onClose();
  };
  
  // 判斷是否為 Email/Password 登入 (Google 帳號不需要密碼重設)
  const isEmailProvider = user.providerData.some(p => p.providerId === 'password');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><User size={20}/> 帳號設定</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="border p-4 rounded-lg bg-slate-50">
            <h4 className="font-bold text-slate-800 mb-2">登入資訊</h4>
            <p className="text-sm text-slate-600">Email: <span className="font-mono">{user.email || "Google 登入"}</span></p>
            <p className="text-sm text-slate-600">提供者: <span className="font-mono text-xs truncate">{isEmailProvider ? 'Email/Password' : 'Google'}</span></p>
          </div>

          {/* 密碼重設區 */}
          <div className="border border-slate-200 p-4 rounded-lg">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Lock size={16}/> 修改密碼</h4>
            {isEmailProvider ? (
              <button 
                onClick={handlePasswordReset}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCcw size={16}/> 發送密碼重設信件
              </button>
            ) : (
              <p className="text-sm text-slate-500">Google/社交登入帳號請直接透過 Google 服務重設密碼。</p>
            )}
          </div>

          {/* 註銷帳號區 */}
          <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
            <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2"><UserX size={16}/> 註銷帳號</h4>
            <p className="text-sm text-red-600 mb-4">
              此操作會**永久刪除**您的帳號以及所有儲存在雲端的單字卡紀錄。
            </p>
            <button 
              onClick={handleDeleteAttempt}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold"
            >
              確認刪除帳號及資料
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 設定 Modal ---
const SettingsModal = ({ isOpen, onClose }) => {
  const [key, setKey] = useState('');
  const [diagStatus, setDiagStatus] = useState('idle');
  const [diagResult, setDiagResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setKey(localStorage.getItem('gemini_api_key') || ("" || ''));
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

      const models = listData.models?.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))?.map(m => m.name.replace('models/', ''));
      
      const selectedModel = models.find(m => m.includes('2.5-flash-live')) ||
                            models.find(m => m.includes('2.5-flash-lite')) ||
                            models.find(m => m.includes('2.5-flash')) || 
                            models.find(m => m.includes('2.5-pro')) ||
                            models[0]; 
      
      if (!selectedModel) throw new Error("未找到任何可用的 Gemini 模型。");

      const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${testKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
      });
      const genData = await genResponse.json();
      if (!genResponse.ok) throw new Error(`模型 ${selectedModel} 生成失敗: ${genData.error?.message}`);

      setDiagStatus('success');
      const modelListOutput = models.map(m => {
          let isSelected = m === selectedModel;
          return `${m}${isSelected ? ' (自動選用)' : ''}`;
      }).join('\n');

      setDiagResult({ 
          message: "診斷成功！", 
          availableModels: modelListOutput, 
          testedModel: selectedModel 
      });
    } catch (e) {
      setDiagStatus('error');
      setDiagResult({ error: e.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={20}/> API 設定與診斷</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Google Gemini API Key</label>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="AIza..." className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm" />
            
            {diagResult && (
              <div className={`mt-2 p-2 rounded text-xs flex items-start gap-2 ${diagStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {diagStatus === 'testing' && <Loader2 size={14} className="animate-spin mt-0.5"/>}
                <span className="break-all">{diagResult?.message || diagResult?.error}</span>
              </div>
            )}
            {diagStatus === 'success' && diagResult?.availableModels && (
               <div className="text-xs text-slate-700 mt-2">
                    <p className="font-bold mb-1">您的帳號可用模型清單：</p>
                    <pre className="p-2 bg-slate-100 rounded overflow-x-auto whitespace-pre-wrap font-mono text-[10px] max-h-48 overflow-y-auto">{diagResult.availableModels}</pre>
                </div>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={runDiagnosis} disabled={diagStatus === 'loading'} className="px-3 py-2 rounded text-slate-600 border border-slate-300 hover:bg-slate-50 text-sm flex items-center gap-2"><Zap size={16}/> 測試連線</button>
            <button onClick={handleSave} className="px-4 py-2 rounded text-white flex items-center gap-2 bg-slate-900 hover:bg-slate-800"><Save size={18}/> 儲存設定</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 使用者下拉選單元件 ---
const UserMenu = ({ user, onLogout, onImportLibrary, onDownload, onSettings, onAccount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-200"/>
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <User size={18} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <p className="text-xs text-slate-500 font-medium">已登入為</p>
             <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || user.email}</p>
          </div>
          
          <div className="p-1">
            <button onClick={() => { onAccount(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
              <User size={16} className="text-slate-500" /> 帳號設定
            </button>
            <div className="border-t border-slate-100 my-1"></div>
            <button onClick={() => { onImportLibrary(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
              <Library size={16} className="text-purple-500" /> 匯入內建題庫
            </button>
            <button onClick={() => { onDownload(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
              <Download size={16} className="text-blue-500" /> 匯出備份
            </button>
            <button onClick={() => { onSettings(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
              <Settings size={16} className="text-slate-500" /> API 設定
            </button>
          </div>

          <div className="border-t border-slate-100 p-1">
            <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
              <LogOut size={16} className="text-red-500"/> 登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- LoginScreen ---
const LoginScreen = ({ onLogin, onRedirectLogin, error, errorCode }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
        <div className="bg-yellow-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-200 transform -rotate-6"><BookOpen size={40} className="text-slate-900" /></div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">DeVoca App</h1>
        <p className="text-slate-500 mb-8">您的雲端德語單字本</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 text-left border border-red-100">
            <div className="flex items-center gap-2 font-bold mb-1"><AlertCircle size={16}/><span>登入遇到問題</span></div>
            <p>{error}</p>
            {errorCode === 'auth/popup-blocked' && <div className="mt-2"><button onClick={onRedirectLogin} className="w-full bg-purple-600 text-white text-xs py-2 rounded flex justify-center gap-2"><LogIn size={14}/> 改用跳轉登入</button></div>}
          </div>
        )}
        
        {!showEmailForm ? (
          <div className="space-y-4">
            <button 
              onClick={onLogin}
              className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl flex justify-center gap-3 shadow-sm transition-colors"
            >
              <svg viewBox="0 0 24 24" className="mr-3 w-5 h-5 inline-block"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              使用 Google 帳號登入
            </button>
            <div className="flex items-center justify-center">
              <div className="w-full border-t border-slate-200"></div>
              <span className="px-3 text-sm text-slate-400 whitespace-nowrap">或</span>
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <button 
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl flex justify-center gap-3 shadow-sm transition-colors"
            >
              <Mail size={20} className="text-slate-600" />
              使用 Email 登入/註冊
            </button>
          </div>
        ) : (
          <EmailPasswordForm onLoginSuccess={() => { /* nothing, onAuthStateChanged handles it */ }} />
        )}
      </div>
    </div>
  );
};

const FilterChip = ({ label, isSelected, onClick, colorClass = "bg-slate-900 text-white" }) => (
  <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all h-8 flex items-center ${isSelected ? `${colorClass} border-transparent shadow` : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>{label}</button>
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><NotebookPen size={20}/> 編輯筆記</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在這裡輸入筆記..."
            className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-slate-700"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">取消</button>
            <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-2"><Save size={18}/> 儲存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 內建題庫匯入 Modal ---
const LibraryModal = ({ isOpen, onClose, onImport }) => {
  if (!isOpen) return null;

  const libraries = [
    { level: 'A1', name: '初級單字庫', data: BUILT_IN_WORDS_A1, color: 'bg-emerald-100 text-emerald-800' },
    { level: 'A2', name: '基礎單字庫', data: BUILT_IN_WORDS_A2, color: 'bg-blue-100 text-blue-800' },
    { level: 'B1', name: '進階單字庫', data: BUILT_IN_WORDS_B1, color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Library size={20}/> 內建題庫中心</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">請選擇您想要匯入的單字等級：</p>
          <div className="space-y-3">
            {libraries.map((lib) => (
              <button 
                key={lib.level}
                onClick={() => { onImport(lib.data); onClose(); }}
                disabled={lib.data.length === 0}
                className={`w-full p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group ${lib.data.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${lib.color}`}>
                    {lib.level}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 group-hover:text-purple-700">{lib.name}</h4>
                    <p className="text-xs text-slate-500">{lib.data.length} 個單字</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-purple-500" />
              </button>
            ))}
          </div>
          <div className="text-xs text-center text-slate-400 mt-4 border-t pt-4">
            匯入時系統會自動略過您已經擁有的單字。
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 單字卡元件 ---
// 🔑 新增傳入 isMemoMode 屬性
const VocabularyCard = ({ item, onToggleStatus, onDelete, onEditNote, onEditCard, isBatchMode, isSelected, onSelect, isMemoMode }) => {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  // 🔑 新增：卡片在背單字模式下是否被翻開
  const [isRevealed, setIsRevealed] = useState(false);

  // 當切換背單字模式時，將所有卡片狀態重置為「蓋上」
  useEffect(() => {
    setIsRevealed(false);
  }, [isMemoMode]);

  const handleSpeak = (text, e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'de-DE'; utterance.rate = 0.9; window.speechSynthesis.speak(utterance); }
  };
  const getCardStyle = () => { 
    if (item.status === 'learned') return 'bg-emerald-50 border-emerald-200'; 
    if (item.status === 'review') return 'bg-amber-50 border-amber-200'; 
    return 'bg-white border-gray-200'; 
  };
  const getTypeBadgeColor = () => { 
    if (item.type === 'noun') return 'bg-blue-100 text-blue-700'; 
    if (item.type === 'verb') return 'bg-purple-100 text-purple-700'; 
    if (item.type === 'adj') return 'bg-yellow-100 text-yellow-700'; 
    return 'bg-gray-100 text-gray-700'; 
  };
  
  const isBuiltIn = item.source === 'builtin';
  const SourceIcon = isBuiltIn ? Database : User;
  const sourceColor = isBuiltIn ? "text-purple-400" : "text-orange-400";

  return (
    <div 
      className={`relative p-6 rounded-xl border-2 transition-all shadow-sm hover:shadow-md flex flex-col h-full 
        ${getCardStyle()} 
        ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 border-purple-500' : ''}
        ${isBatchMode ? 'cursor-pointer hover:bg-slate-50' : ''}
        ${isMemoMode && !isRevealed && !isBatchMode ? 'cursor-pointer hover:bg-indigo-50 ring-2 ring-indigo-300 ring-offset-1' : ''}
      `}
      onClick={() => {
        // 🔑 處理卡片點擊邏輯
        if (isBatchMode) {
          onSelect();
        } else if (isMemoMode) {
          setIsRevealed(!isRevealed);
        }
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <div className={`flex items-center justify-center p-1 rounded-full bg-slate-50 ${sourceColor}`} title={isBuiltIn ? "內建單字" : "自行新增"}>
            <SourceIcon size={14} strokeWidth={2.5}/>
          </div>
          <span className="h-6 flex items-center justify-center px-2 text-xs font-bold rounded bg-slate-800 text-white">{item.level}</span>
          <span className={`h-6 flex items-center justify-center px-2 text-xs font-bold rounded uppercase ${getTypeBadgeColor()}`}>{item.type}</span>
        </div>

        <div className="flex gap-1 items-center">
           {isBatchMode ? (
             <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                {isSelected && <Check size={16} className="text-white"/>}
             </div>
           ) : (
             <>
                <button onClick={(e) => {e.stopPropagation(); onToggleStatus(item.id, item.status, 'review')}} className={`p-1.5 rounded-full ${item.status==='review'?'bg-amber-500 text-white':'text-gray-300 hover:text-amber-500'}`} title="需加強"><AlertCircle size={18}/></button>
                <button onClick={(e) => {e.stopPropagation(); onToggleStatus(item.id, item.status, 'learned')}} className={`p-1.5 rounded-full ${item.status==='learned'?'bg-emerald-500 text-white':'text-gray-300 hover:text-emerald-500'}`} title="已學會"><CheckCircle size={18}/></button>
                <button onClick={(e) => {e.stopPropagation(); onEditCard(item)}} className="p-1.5 rounded-full text-gray-300 hover:text-blue-500 ml-1" title="編輯卡片"><Edit3 size={16}/></button>
                <button onClick={(e) => {e.stopPropagation(); onDelete(item.id)}} className="p-1.5 rounded-full text-gray-300 hover:text-red-500" title="刪除"><Trash2 size={16}/></button>
             </>
           )}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          {item.type === 'noun' && <span className={`text-lg font-bold ${item.article==='der'?'text-blue-600':item.article==='die'?'text-red-500':item.article==='das'?'text-green-600':'text-gray-500'}`}>{item.article}</span>}
          <h2 className="text-3xl font-bold text-slate-800">{item.word}</h2>
          <button onClick={(e) => handleSpeak(item.type==='noun'?`${item.article} ${item.word}`:item.word, e)} className="text-slate-400 hover:text-slate-800 p-1"><Volume2 size={20}/></button>
        </div>
        
        {/* 🔑 條件渲染：不是背單字模式，或是卡片已經被翻開，才顯示下方內容 */}
        {(!isMemoMode || isRevealed) ? (
          <>
            <div className="text-sm text-slate-500 mb-2 font-mono">{item.type==='noun'&&item.plural?`Pl. ${item.plural}`:''}</div>
            
            <div className="border-l-4 border-slate-200 pl-3">
              <p className="text-lg text-slate-700 font-medium">{item.meaning}</p>
              <p className="text-sm text-slate-400 mt-0.5">
                {item.englishMeaning ? `(${item.englishMeaning})` : <span className="opacity-50 italic">(點擊上方編輯按鈕新增英文)</span>}
              </p>
            </div>

            {item.type==='verb'&&item.conjugation&&<div className="mt-3 bg-slate-100 p-2 rounded text-sm text-slate-600 flex gap-2 border border-slate-200"><Clock size={16} className="mt-0.5 text-purple-500 shrink-0"/><div className="font-mono">{item.conjugation}</div></div>}
          </>
        ) : (
          <div className="mt-4 py-3 bg-slate-50/50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Eye size={16} className="text-slate-300" /> 點擊卡片顯示翻譯與說明
          </div>
        )}
      </div>
      
      {/* 🔑 例句與筆記也一併加入條件判斷 */}
      {(!isMemoMode || isRevealed) && (
        <>
          <div className="mt-auto pt-4 border-t border-black/5">
            <div className="flex gap-2 mb-1"><p className="text-sm text-slate-600 italic flex-1">"{item.example}"</p><button onClick={(e)=>handleSpeak(item.example,e)} className="text-slate-400 hover:text-slate-600"><Volume2 size={16}/></button></div>
            <p className="text-xs text-slate-400 pl-1">{item.exampleMeaning}</p>
          </div>

          <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              {item.note ? (
                <button 
                  onClick={(e) => {e.stopPropagation(); setIsNoteExpanded(!isNoteExpanded)}}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  {isNoteExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  {isNoteExpanded ? '收起筆記' : '查看筆記'}
                </button>
              ) : <span className="text-xs text-transparent">.</span>}
              
              <button 
                onClick={(e) => {e.stopPropagation(); onEditNote(item)}}
                className="text-slate-400 hover:text-purple-600 transition-colors p-1 rounded-full hover:bg-purple-50"
                title="編輯筆記"
              >
                <NotebookPen size={16} />
              </button>
            </div>
            
            {item.note && isNoteExpanded && (
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-slate-700 border border-yellow-100 relative">
                <StickyNote size={14} className="text-yellow-400 absolute top-2 right-2 opacity-50"/>
                <p className="whitespace-pre-wrap">{item.note}</p>
              </div>
            )}  
          </div>
        </>
      )}
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
            const result = await onBatchAdd(res, 'custom'); 
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-purple-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3"><Sparkles size={20} className="text-yellow-400"/><h3 className="font-bold">AI 批量匯入</h3>
          {!hasKey && <span className="bg-red-500/20 text-red-200 text-xs px-2 py-1 rounded border border-red-500/50">未設定 API Key</span>}</div>
          {!isProcessing && <button onClick={onClose}><X size={20}/></button>}
        </div>
        <div className="p-6 space-y-4 overflow-y-auto text-slate-800">
          <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} disabled={isProcessing} placeholder="貼上單字列表 (一行一個)..." className="w-full h-48 p-4 border rounded font-mono text-sm"/>
          {isProcessing && <div className="w-full bg-slate-100 h-2 rounded overflow-hidden"><div className="bg-purple-600 h-2 transition-all" style={{width: `${progress}%`}}></div></div>}
          <div className="flex justify-between items-center">
             <span className="text-sm text-slate-500">{statusMsg}</span>
             {!isProcessing && <button onClick={processBatch} className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">開始分析</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 單字編輯 Modal ---
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg">{initialData ? '編輯單字' : '新增單字'}</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-slate-800">
          <div className="flex gap-2">
            <input required value={formData.word} onChange={e=>setFormData({...formData, word: e.target.value})} className="flex-1 p-2 border rounded" placeholder="單字"/>
            <button type="button" onClick={handleAutoFill} disabled={isGenerating || !hasKey} className={`px-3 py-2 rounded text-white flex gap-2 items-center ${hasKey?'bg-purple-600':'bg-slate-400'}`}>{isGenerating?<Loader2 className="animate-spin" size={18}/>:<Sparkles size={18}/>} AI 填寫</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required value={formData.meaning} onChange={e=>setFormData({...formData, meaning: e.target.value})} className="p-2 border rounded" placeholder="中文意思"/>
            <input value={formData.englishMeaning} onChange={e=>setFormData({...formData, englishMeaning: e.target.value})} className="p-2 border rounded" placeholder="英文意思"/>
          </div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="p-2 border rounded"><option value="noun">名詞</option><option value="verb">動詞</option><option value="adj">形容詞</option><option value="adv">副詞</option></select><select value={formData.level} onChange={e=>setFormData({...formData.level, level: e.target.value})} className="p-2 border rounded"><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option></select></div>
          <div className="grid grid-cols-2 gap-4"><select value={formData.article} onChange={e=>setFormData({...formData.article, article: e.target.value})} className="p-2 border rounded" disabled={formData.type!=='noun'}><option value="">-</option><option value="der">der</option><option value="die">die</option><option value="das">das</option></select><input value={formData.plural} onChange={e=>setFormData({...formData.plural, plural: e.target.value})} className="p-2 border rounded" placeholder="複數" disabled={formData.type!=='noun'}/></div>
          {formData.type==='verb'&&<input value={formData.conjugation} onChange={e=>setFormData({...formData.conjugation, conjugation: e.target.value})} className="w-full p-2 border border-purple-200 bg-purple-50 rounded" placeholder="動詞變化"/>}
          <input value={formData.example} onChange={e=>setFormData({...formData.example, example: e.target.value})} className="w-full p-2 border rounded" placeholder="例句"/>
          <input value={formData.exampleMeaning} onChange={e=>setFormData({...formData.exampleMeaning, exampleMeaning: e.target.value})} className="w-full p-2 border rounded" placeholder="例句翻譯"/>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">取消</button>
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-2"><Save size={18}/> 儲存</button>
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
  const [showLibraryModal, setShowLibraryModal] = useState(false); 
  const [showAccountModal, setShowAccountModal] = useState(false); 
  
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

  const [isScrolled, setIsScrolled] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set()); 
  
  // 🔑 新增：控制是否開啟背單字模式的全域狀態
  const [isMemoMode, setIsMemoMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 100 && !isScrolled) {
        setIsScrolled(true);
        setIsFilterExpanded(false);
      } 
      else if (currentY < 20 && isScrolled) {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]);

  useEffect(() => {
    if (isScrolled && isFilterExpanded) {
      setIsFilterExpanded(false); 
    }
  }, [isScrolled]);

  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!auth) { setIsLoading(false); return; }
    getRedirectResult(auth).then((result) => { if (result) setUser(result.user); }).catch((error) => { console.error("Redirect Login Error:", error); setAuthErrorCode(error.code); setAuthError(`重新導向登入失敗: ${error.message}`); });
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setIsLoading(false); });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => { setAuthError(null); setAuthErrorCode(null); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (error) { setAuthErrorCode(error.code); setAuthError(error.code === 'auth/popup-blocked' ? "彈出視窗被阻擋" : "登入失敗"); } };
  const handleRedirectLogin = async () => { setAuthError(null); try { await signInWithRedirect(auth, new GoogleAuthProvider()); } catch (error) { setAuthError(error.message); } };
  const handleLogout = async () => { try { await signOut(auth); setVocabList([]); } catch (error) { console.error("Logout Failed", error); } };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!confirm('警告：您確定要永久刪除您的帳號及所有單字資料嗎？此操作無法復原。')) return;

    try {
      const q = collection(db, 'vocab_users', user.uid, 'items');
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      await deleteUser(user);

      alert('帳號及所有資料已成功刪除。');
      handleLogout();
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
         alert('安全性警告：請先登出，然後重新登入一次，才能執行刪除帳號操作。');
      } else {
         console.error("Account Deletion Failed:", e);
         alert(`註銷失敗: ${e.message}`);
      }
    }
  };

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
                    createdAt: serverTimestamp(),
                    ...w 
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

  const handleImportWords = async (wordList) => {
    if (!user) return;
    if (!confirm(`確定要匯入 ${wordList.length} 個單字嗎？\n系統會自動略過重複的單字。`)) return;

    setIsImporting(true);
    try {
        const result = await handleBatchAdd(wordList, 'builtin');
        alert(`匯入完成！\n\n✅ 成功新增: ${result.added} 個\n⚠️ 略過重複: ${result.skipped} 個`);
    } catch (e) {
        console.error("Import Error", e);
        alert("匯入發生錯誤，請稍後再試。");
    } finally {
        setIsImporting(false);
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

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

  if (isLoading) return <div className="min-h-screen bg-slate-50 text-slate-500 flex items-center justify-center"><Loader2 className="animate-spin mb-4" size={32} /><p>載入中...</p></div>;
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("apiKey")) return <div className="min-h-screen flex items-center justify-center bg-slate-100 p-8 font-sans"><div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center"><AlertCircle size={32} className="mx-auto text-red-500 mb-4"/><h2 className="text-2xl font-bold text-slate-800 mb-2">尚未設定資料庫</h2><p className="text-slate-500">請打開 <code>App.jsx</code> 填入您的 Firebase Keys。</p></div></div>;
  if (!user) return <LoginScreen onLogin={handleLogin} onRedirectLogin={handleRedirectLogin} error={authError} errorCode={authErrorCode} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2"><div className="bg-yellow-400 p-1.5 rounded text-slate-900"><BookOpen size={20} /></div><span className="font-bold text-lg hidden sm:inline">DeVoca App</span></div>
        <div className="flex gap-2 items-center">
            
            {/* 🔑 新增：背單字模式開關 (會跟批次開關互斥) */}
            <button 
              onClick={() => { setIsMemoMode(!isMemoMode); setIsBatchMode(false); setSelectedItems(new Set()); }}
              className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${isMemoMode ? 'bg-indigo-100 border-indigo-400 text-indigo-700 shadow-inner' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              title="背單字模式"
            >
              {isMemoMode ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="hidden sm:inline text-sm font-semibold">{isMemoMode ? '關閉背單字' : '背單字模式'}</span>
            </button>

            {/* 批次選取開關 */}
            <button 
              onClick={() => { setIsBatchMode(!isBatchMode); setIsMemoMode(false); setSelectedItems(new Set()); }}
              className={`p-2 border rounded-lg transition-colors ${isBatchMode ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              title="批次管理"
            >
              <ListChecks size={18} />
            </button>

            <div className="flex items-center gap-2 mr-2 border-r pr-4 border-slate-200">
               <UserMenu 
                 user={user} 
                 onLogout={handleLogout} 
                 onImportLibrary={() => setShowLibraryModal(true)}
                 onDownload={downloadData}
                 onSettings={() => setShowSettingsModal(true)}
                 onAccount={() => setShowAccountModal(true)}
               />
            </div>
            
            <button onClick={() => setShowBatchModal(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 shadow-sm"><FileText size={18} /> <span className="hidden sm:inline">批量</span></button>
            <button onClick={openAddModal} className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1 shadow-sm"><Plus size={18} /> <span className="hidden sm:inline">新增</span></button>
        </div>
      </header>

      <main className="w-full max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex-grow">
        {vocabList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-xl mt-8 mx-auto max-w-4xl">
             <GraduationCap size={48} className="mx-auto text-slate-300 mb-4"/>
             <h3 className="text-xl font-bold text-slate-700 mb-2">單字本是空的</h3>
             <p className="text-slate-500 mb-6">點擊右上角的「新增」按鈕開始建立單字庫，或匯入內建題庫。</p>
             <div className="flex justify-center gap-4">
                <button onClick={() => setShowLibraryModal(true)} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"><Library size={18}/> 匯入內建題庫</button>
             </div>
          </div>
         ) : (
          <>
             <div className={`mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-10 transition-all duration-300 ease-in-out ${isScrolled && !isFilterExpanded ? 'p-2' : 'p-5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-md mr-4">
                    <div className="relative group">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500" size={16} />
                       <input 
                         type="text" 
                         placeholder="搜尋德文單字..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"
                       />
                    </div>
                  </div>

                  <div 
                    className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  >
                    <Filter size={14} />
                    <span>篩選 ({filtered.length}/{vocabList.length})</span>
                    {isScrolled && !isFilterExpanded && activeFiltersCount > 0 && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full normal-case">
                        {activeFiltersCount} 個條件
                      </span>
                    )}
                    {isScrolled && (
                      <div className="text-slate-400 hover:text-slate-600 ml-1">
                        {isFilterExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    )}
                  </div>
                </div>
                
                {isFilterExpanded && (
                  <div className={`space-y-3 ${isScrolled ? 'mt-4 animate-in fade-in slide-in-from-top-2 duration-200' : 'mt-4'}`}>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">等級:</span>{['A1', 'A2', 'B1'].map(l => (<FilterChip key={l} label={l} isSelected={selectedLevels.includes(l)} onClick={() => toggleFilter(setSelectedLevels, l)} colorClass="bg-slate-700 text-white" />))}</div>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">詞性:</span><FilterChip label="名詞" isSelected={selectedTypes.includes('noun')} onClick={() => toggleFilter(setSelectedTypes, 'noun')} colorClass="bg-blue-600 text-white" /><FilterChip label="動詞" isSelected={selectedTypes.includes('verb')} onClick={() => toggleFilter(setSelectedTypes, 'verb')} colorClass="bg-purple-600 text-white" /><FilterChip label="形容詞" isSelected={selectedTypes.includes('adj')} onClick={() => toggleFilter(setSelectedTypes, 'adj')} colorClass="bg-yellow-500 text-white" /><FilterChip label="副詞" isSelected={selectedTypes.includes('adv')} onClick={() => toggleFilter(setSelectedTypes, 'adv')} colorClass="bg-orange-500 text-white" /></div>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">狀態:</span><FilterChip label="未標記" isSelected={selectedStatuses.includes('new')} onClick={() => toggleFilter(setSelectedStatuses, 'new')} colorClass="bg-slate-400 text-white" /><FilterChip label="需加強" isSelected={selectedStatuses.includes('review')} onClick={() => toggleFilter(setSelectedStatuses, 'review')} colorClass="bg-amber-500 text-white" /><FilterChip label="已學會" isSelected={selectedStatuses.includes('learned')} onClick={() => toggleFilter(setSelectedStatuses, 'learned')} colorClass="bg-emerald-600 text-white" /></div>
                    <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-slate-400 mr-1">來源:</span><FilterChip label="自訂" isSelected={selectedSources.includes('custom')} onClick={() => toggleFilter(setSelectedSources, 'custom')} colorClass="bg-orange-500 text-white" /><FilterChip label="內建" isSelected={selectedSources.includes('builtin')} onClick={() => toggleFilter(setSelectedSources, 'builtin')} colorClass="bg-purple-500 text-white" /></div>
                  </div>
                )}
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
               {/* 🔑 傳入 isMemoMode 給子元件 */}
               {filtered.map(item => <VocabularyCard key={item.id} item={item} onToggleStatus={handleToggleStatus} onDelete={handleDeleteWord} onEditNote={openEditNote} onEditCard={openEditCardModal} isBatchMode={isBatchMode} isSelected={selectedItems.has(item.id)} onSelect={() => toggleSelect(item.id)} isMemoMode={isMemoMode} />)}
             </div>

             {isBatchMode && selectedItems.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md bg-white px-4 py-3 rounded-full shadow-xl border border-slate-200 flex justify-between items-center gap-3 animate-in slide-in-from-bottom-4 z-50">
                  <span className="text-slate-700 font-bold whitespace-nowrap ml-2">{selectedItems.size} 張已選取</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedItems(new Set())} className="text-slate-500 hover:text-slate-700 text-sm px-3 py-2 whitespace-nowrap">取消</button>
                    <button onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-sm">
                      <Trash2 size={16}/> 刪除
                    </button>
                  </div>
                </div>
             )}
          </>
         )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            © 2025 German Vocabulary Tool. 
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Developed by</span>
            <a 
              href="https://nikkistudiotw.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 transition-colors"
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
      <LibraryModal isOpen={showLibraryModal} onClose={() => setShowLibraryModal(false)} onImport={handleImportWords} />
      {user && <AccountSettingsModal 
        isOpen={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
        user={user}
        onPasswordReset={() => { 
          sendPasswordResetEmail(auth, user.email)
            .then(() => alert(`密碼重設連結已發送到 ${user.email}。請檢查您的信箱！`))
            .catch(e => alert(`重設密碼失敗: ${e.message}`));
          setShowAccountModal(false);
        }}
        onDeleteAccount={handleDeleteAccount}
      />}
    </div>
  );
}
