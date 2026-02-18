/**
 * 版本: 1.6 (內建 Key + 雷達圖強化版)
 * 項目: 正覺蓮社學校 體育科網站
 * 說明:
 * 1. 設定: 在代碼中直接寫入 OpenRouter API Key，免去重複輸入。
 * 2. 介面: 體適能頁面確保雷達圖 (Radar Chart) 正確顯示。
 * 3. 功能: 保留 AI 智能評語、校隊推薦、數據儲存等所有功能。
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, Activity, Lock, Dumbbell, Star, BookOpen, Menu, Trophy, User, LogOut, ChevronRight, TrendingUp, AlertCircle, Calendar, Smile, Award, Medal, Target, ThumbsUp, Sparkles, Brain, Bot, Download, Save, Key
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

// --- Firebase 配置 ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, getDocs
} from 'firebase/firestore';

// 系統設定
const firebaseConfig = {
  apiKey: "AIzaSyDyvozVkRinHF6llR9-6xVZb2gtov71jRU", 
  authDomain: "pewebsite-1a640.firebaseapp.com",
  projectId: "pewebsite-1a640",
  storageBucket: "pewebsite-1a640.firebasestorage.app",
  messagingSenderId: "851903281806",
  appId: "1:851903281806:web:26f894ca1ccc180636e7df"
};

// --- OpenRouter API 設定 ---
// 🔴 請在此填入您的 OpenRouter Key (以 sk-or- 開頭)
// 填入後，網頁上的輸入框將會自動隱藏，直接啟用 AI 功能
const HARDCODED_AI_KEY = "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"; 

// 安全初始化
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 初始化失敗:", e);
}

const appId = 'pe-system-v1'; 

// --- 核心業務邏輯 ---
const calculateScore = (gender, age, item, value) => {
  let score = 0;
  if (item === 'bmi') {
    if (value > 18.5 && value < 23) return 4;
    return 2;
  }
  score = Math.min(Math.floor(value / 5), 5); 
  return score > 0 ? score : 1;
};

const getBadgeColor = (score) => {
  if (score >= 5) return '#fbbf24'; 
  if (score >= 4) return '#94a3b8'; 
  if (score >= 3) return '#b45309'; 
  return '#475569'; 
};

// --- UI 組件 ---

const Card = ({ children, className = "", theme = "dark" }) => {
  const themes = {
    white: "bg-white border-slate-100 shadow-sm",
    ai: "bg-gradient-to-br from-indigo-900/80 to-violet-900/80 border-indigo-500/30 shadow-lg shadow-indigo-500/20 text-white", // AI 專用
    dark: "bg-slate-900 text-white border-slate-800 shadow-xl"
  };
  const selectedTheme = themes[theme] || themes.white;
  
  return (
    <div className={`rounded-2xl p-6 border transition-all duration-300 ${selectedTheme} ${className}`}>
      {children}
    </div>
  );
};

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "" }) => {
  const baseStyle = "px-4 py-2.5 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm";
  const variants = {
    primary: "bg-yellow-500 text-slate-900 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 border border-slate-600",
    ai: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:brightness-110 shadow-lg shadow-fuchsia-500/30",
    success: "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/20"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- 頁面組件 ---

// 1. 側邊欄
const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'home', label: '首頁', icon: <Home size={20} /> },
    { id: 'fitness', label: '體適能評測', icon: <Activity size={20} /> },
    { id: 'equipment', label: '器材管理', icon: <Dumbbell size={20} /> },
    { id: 'stars', label: '體育之星', icon: <Star size={20} /> },
    { id: 'reading', label: '體育閱讀', icon: <BookOpen size={20} /> },
    { id: 'admin', label: '老師管理後台', icon: <Lock size={20} /> },
  ];

  return (
    <div className="w-[250px] shrink-0 h-full bg-slate-900 border-r border-slate-700 flex flex-col z-20">
      <div className="p-6 text-center border-b border-slate-700">
        <h1 className="text-xl font-bold text-yellow-400">正覺蓮社學校</h1>
        <h2 className="text-sm text-slate-400 mt-1">體育組系統 Ver 1.6</h2>
      </div>
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-yellow-500 text-slate-900 font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// 2. 首頁
const HomePage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setNews([{ id: 1, title: '🎉 系統展示模式', date: '2025/02/06', content: '目前尚未設定 Firebase Key。' }]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'news'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="bg-gradient-to-r from-blue-900 to-slate-900 p-8 rounded-2xl shadow-lg border border-slate-700 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">🌟 正覺體育人：資訊與動態</h1>
          <p className="text-slate-300 text-lg">培養堅毅精神，成就卓越人生</p>
        </div>
        <Trophy size={150} className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <span className="bg-yellow-500 w-2 h-8 mr-3 rounded-full"></span> 📢 體育組最新動態
          </h2>
          {loading ? <div className="text-center py-10 text-slate-500">載入中...</div> : news.length > 0 ? news.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border-l-4 border-yellow-400">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{item.title}</h3>
                <span className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-300">{item.date}</span>
              </div>
              <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-line">{item.content}</p>
            </div>
          )) : <div className="bg-white dark:bg-slate-800 p-8 rounded-xl text-center text-slate-500">暫無最新消息</div>}
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">🏆 我們的校隊</h3>
            <div className="grid grid-cols-2 gap-3">
              {['壁球', '足球', '籃球', '田徑', '乒乓球', '游泳'].map(team => <div key={team} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg text-center font-medium text-slate-700 dark:text-slate-200">{team}隊</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. 體適能評測 (Ver 1.6: 內建Key + 雷達圖)
const FitnessPage = ({ user }) => {
  const [formData, setFormData] = useState({ name: '', class: '6A', classNo: '', gender: 'M', sitUps: 0, flexibility: 0, handGrip: 0, run9min: 0, height: 150, weight: 40 });
  const [result, setResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [userAiKey, setUserAiKey] = useState("");

  const calculate = async () => {
    if (!formData.name || !formData.classNo) { alert("請填寫姓名及班號"); return; }
    
    const bmi = (formData.weight / ((formData.height / 100) ** 2)).toFixed(1);
    const scores = [
      { subject: '仰臥起坐', A: calculateScore(formData.gender, 12, 'situp', formData.sitUps), fullMark: 5, value: formData.sitUps, unit: '次' },
      { subject: '坐姿體前彎', A: calculateScore(formData.gender, 12, 'sitreach', formData.flexibility), fullMark: 5, value: formData.flexibility, unit: 'cm' },
      { subject: '手握力', A: calculateScore(formData.gender, 12, 'grip', formData.handGrip), fullMark: 5, value: formData.handGrip, unit: 'kg' },
      { subject: '心肺耐力', A: calculateScore(formData.gender, 12, 'run', formData.run9min), fullMark: 5, value: formData.run9min, unit: 'm' },
      { subject: 'BMI健康度', A: calculateScore(formData.gender, 12, 'bmi', bmi), fullMark: 5, value: bmi, unit: '' },
    ];
    
    let recommendations = [];
    scores.forEach(s => {
      if (s.A >= 4) {
        if (s.subject === '仰臥起坐') recommendations.push('⚽ 足球隊 (核心強)');
        if (s.subject === '坐姿體前彎') recommendations.push('🎾 壁球隊 (柔軟)');
        if (s.subject === '手握力') recommendations.push('🏓 乒乓球隊 (爆發力)');
        if (s.subject === '心肺耐力') recommendations.push('🏊 游泳隊 / 🏃 田徑隊 (耐力)');
      }
    });
    recommendations = [...new Set(recommendations)];
    
    const newResult = { scores, bmi, recommendations, bestItem: scores.reduce((a,b)=>a.A>b.A?a:b), worstItem: scores.reduce((a,b)=>a.A<b.A?a:b) };
    setResult(newResult);
    setAiAnalysis(""); 

    if (db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'fitness_records'), {
          ...formData, uid: user ? user.uid : 'anonymous', bmi, scores: scores.map(s => s.A), totalScore: scores.reduce((sum, item) => sum + item.A, 0), recommendations, date: new Date().toISOString()
        });
      } catch (e) { console.error("Auto-save failed:", e); }
    }
  };

  // --- AI 分析 (透過 OpenRouter) ---
  const generateAIAnalysis = async () => {
    // 優先使用硬編碼 Key (若有)，否則使用用戶輸入
    const keyToUse = HARDCODED_AI_KEY || userAiKey;
    
    if (!keyToUse) {
      setAiAnalysis("⚠️ 請在上方輸入 OpenRouter Key，或請管理員在程式碼中設定 HARDCODED_AI_KEY。");
      return;
    }
    
    setIsAiLoading(true);
    
    const prompt = `
      角色：你是一位資深、熱情的小學體育科主任。
      任務：根據以下學生的體適能數據，撰寫一份約 150 字的「個人化運動建議」。
      
      學生：${formData.name} (${formData.gender === 'M' ? '男' : '女'}, ${formData.class})
      數據：
      - 仰臥起坐: ${formData.sitUps}次 (得分${result.scores[0].A}/5)
      - 柔軟度: ${formData.flexibility}cm (得分${result.scores[1].A}/5)
      - 手握力: ${formData.handGrip}kg (得分${result.scores[2].A}/5)
      - 9分鐘跑: ${formData.run9min}m (得分${result.scores[3].A}/5)
      
      請包含：
      1. 親切開場。
      2. 針對弱項 (2分或以下) 給出具體訓練建議（例如：如果柔軟度差，建議做什麼伸展）。
      3. 根據優勢推薦適合的校隊。
      4. 語氣要正面、溫暖、鼓勵。
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${keyToUse}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [
            {"role": "user", "content": prompt}
          ]
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        setAiAnalysis(data.choices[0].message.content);
      } else if (data.error) {
        setAiAnalysis(`API 錯誤: ${data.error.message}`);
      } else {
        setAiAnalysis("無法取得 AI 回應，請稍後再試。");
      }
    } catch (error) {
      console.error("AI Error:", error);
      setAiAnalysis(`連線錯誤: ${error.message}`);
    }
    setIsAiLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10">
      <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border-t-4 border-yellow-500 h-fit">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
          <Activity className="mr-2 text-yellow-500" /> 輸入評測數據
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
             <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">個人資料 (必填)</h3>
             <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="姓名" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input type="number" placeholder="班號" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.classNo} onChange={e => setFormData({...formData, classNo: Number(e.target.value)})} />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <select className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})}>{['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option value="M">男</option><option value="F">女</option></select>
             </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">測驗項目</h3>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="text-xs text-slate-500 mb-1 block">仰臥起坐</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.sitUps} onChange={e => setFormData({...formData, sitUps: Number(e.target.value)})} /></div>
               <div><label className="text-xs text-slate-500 mb-1 block">柔軟度</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.flexibility} onChange={e => setFormData({...formData, flexibility: Number(e.target.value)})} /></div>
               <div><label className="text-xs text-slate-500 mb-1 block">手握力</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.handGrip} onChange={e => setFormData({...formData, handGrip: Number(e.target.value)})} /></div>
               <div><label className="text-xs text-slate-500 mb-1 block">9分鐘跑</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.run9min} onChange={e => setFormData({...formData, run9min: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
               <input type="number" placeholder="身高 cm" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
               <input type="number" placeholder="體重 kg" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
            </div>
          </div>
          <button onClick={calculate} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2">
             <Save size={18}/> 計算並儲存成績
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {result ? (
          <>
            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Trophy className="text-yellow-400" size={24}/> 獲得勳章</h3>
                <div className="grid grid-cols-5 gap-4 text-center">
                  {result.scores.map((s, idx) => (
                    <div key={idx} className="flex flex-col items-center group">
                      <div className="relative mb-3 transform group-hover:scale-110 transition-transform duration-300">
                         <div className="absolute inset-0 bg-white/10 blur-xl rounded-full"></div>
                         <Medal size={48} style={{ color: getBadgeColor(s.A) }} />
                         <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900">{s.A}</span>
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{s.subject}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI 分析卡片 (HK版) */}
            <Card theme="ai" className="border-indigo-500/30">
               <div className="flex justify-between items-start mb-4">
                 <h3 className="text-lg font-bold text-indigo-300 flex items-center">
                   <Brain className="mr-2 text-purple-400" size={22} /> AI 智能教練評語
                 </h3>
                 {!aiAnalysis && !isAiLoading && (
                   <Button onClick={generateAIAnalysis} variant="ai" className="text-xs py-2 px-4">
                     <Sparkles size={14} className="mr-1"/> 生成詳細報告
                   </Button>
                 )}
               </div>
               
               {/* 只有在沒有寫死 Key 時才顯示輸入框 */}
               {!HARDCODED_AI_KEY && !aiAnalysis && !isAiLoading && (
                 <div className="mb-4">
                   <input 
                     type="password" 
                     placeholder="請在此輸入 OpenRouter API Key (sk-or-...)" 
                     className="w-full p-2 rounded bg-slate-800/50 border border-indigo-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                     value={userAiKey}
                     onChange={(e) => setUserAiKey(e.target.value)}
                   />
                   <p className="text-[10px] text-slate-500 mt-1">* 提示: 若代碼已內建 Key，此欄位會自動隱藏</p>
                 </div>
               )}
               
               {isAiLoading ? (
                 <div className="text-center py-8 text-indigo-400 animate-pulse">
                   <Bot size={48} className="mx-auto mb-2" />
                   <p>教練正在思考中...</p>
                 </div>
               ) : aiAnalysis ? (
                 <div className="prose prose-sm max-w-none text-slate-200 bg-slate-900/50 p-6 rounded-xl border border-indigo-500/30 shadow-inner">
                   <p className="whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
                 </div>
               ) : (
                 <div className="text-slate-400 text-sm p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 flex items-center gap-3">
                   <div className="bg-indigo-500/20 p-2 rounded-full"><Sparkles size={16} className="text-indigo-400"/></div>
                   <p>點擊按鈕，獲取針對 {formData.name} 同學的個人化訓練建議與校隊推薦。</p>
                 </div>
               )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 雷達圖 (Ver 1.6: 恢復顯示) */}
              <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">綜合能力雷達</h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.scores}>
                      <PolarGrid stroke="#475569" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar name="我的表現" dataKey="A" stroke="#EAB308" fill="#EAB308" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 長條圖 */}
              <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">單項得分統計</h3>
                <div className="w-full h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={result.scores} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                       <XAxis type="number" domain={[0, 5]} tick={{ fill: '#FFFFFF' }} /> 
                       <YAxis dataKey="subject" type="category" width={80} tick={{ fill: '#FFFFFF', fontSize: 12 }} />
                       <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                       <Bar dataKey="A" barSize={20} radius={[0, 4, 4, 0]}>
                         {result.scores.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={getBadgeColor(entry.A)} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
            
             <div className="bg-white p-6 rounded-2xl border-l-4 border-green-500 shadow-md">
                <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center"><ThumbsUp className="mr-2" size={20}/> 系統推薦校隊 (規則)</h3>
                {result.recommendations.length > 0 ? (
                  <ul className="space-y-2">{result.recommendations.map((rec, idx) => (<li key={idx} className="flex items-center text-slate-700 bg-green-50 p-2 rounded"><Star size={16} className="text-yellow-500 mr-2" fill="currentColor"/> {rec}</li>))}</ul>
                ) : <p className="text-slate-500 text-sm">各項表現平均，建議多參加不同運動！</p>}
              </div>

          </>
        ) : (
          <div className="text-center text-slate-500 py-10">
            <Activity size={64} className="mx-auto mb-4 opacity-50" />
            <p>請在左側輸入數據以獲取報告</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. 器材管理組件
const EquipmentPage = ({ user }) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'));
    const unsubscribe = onSnapshot(q, (snapshot) => setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsubscribe();
  }, []);
  const handleBorrow = async (item) => {
    if (item.stock > 0) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', item.id), { stock: item.stock - 1 }); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'borrow_logs'), { itemName: item.name, action: 'borrow', user: user ? user.email : 'Anonymous', time: new Date().toISOString() }); }
  };
  const handleReturn = async (item) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', item.id), { stock: item.stock + 1 }); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'borrow_logs'), { itemName: item.name, action: 'return', user: user ? user.email : 'Anonymous', time: new Date().toISOString() });
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">🏸 器材庫存管理</h2>{!user && <span className="text-sm text-red-500 bg-red-100 px-3 py-1 rounded-full">請通知老師進行管理操作</span>}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length > 0 ? items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border-t-4 border-blue-500 flex flex-col justify-between">
            <div><div className="flex justify-between items-start mb-2"><h3 className="text-lg font-bold text-slate-800 dark:text-white">{item.name}</h3><span className={`px-2 py-1 rounded text-xs font-bold ${item.stock > 5 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>剩餘: {item.stock}</span></div><p className="text-slate-500 text-sm mb-4">位置: {item.location || '體育室'}</p></div>
            <div className="flex space-x-2"><button onClick={() => handleBorrow(item)} disabled={item.stock <= 0} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition-colors disabled:opacity-50 text-sm">借出</button><button onClick={() => handleReturn(item)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors text-sm">歸還</button></div>
          </div>
        )) : <div className="col-span-full text-center text-slate-500 py-10 bg-white dark:bg-slate-800 rounded-xl">暫無器材數據</div>}
      </div>
    </div>
  );
};

// 5. 體育之星組件
const StarsPage = () => {
  const [stars, setStars] = useState([]);
  const [yearFilter, setYearFilter] = useState('2025-2026');
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'stars'));
    const unsubscribe = onSnapshot(q, (snapshot) => setStars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsubscribe();
  }, []);
  const filteredStars = stars.filter(s => s.year === yearFilter);
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-xl shadow-lg text-white">
        <div><h2 className="text-2xl font-bold flex items-center"><Star className="mr-2" /> 年度體育之星</h2><p className="opacity-90">表揚傑出運動員，激發無限潛能</p></div>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="mt-4 md:mt-0 bg-white/20 backdrop-blur text-white border border-white/30 rounded px-4 py-2"><option value="2025-2026" className="text-slate-800">2025-2026</option><option value="2024-2025" className="text-slate-800">2024-2025</option></select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredStars.map((star) => (
          <div key={star.id} className="group relative overflow-hidden rounded-xl shadow-lg aspect-[3/4]">
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-slate-600">{star.photoUrl ? <img src={star.photoUrl} alt={star.name} className="w-full h-full object-cover" /> : <User size={64} />}</div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6"><h3 className="text-2xl font-bold text-white">{star.name}</h3><p className="text-yellow-400 font-medium">{star.team}隊</p><p className="text-slate-300 text-sm mt-1">{star.award}</p></div>
          </div>
        ))}
        {filteredStars.length === 0 && <div className="col-span-full text-center py-20 text-slate-500">本年度尚未有體育之星紀錄</div>}
      </div>
    </div>
  );
};

// 6. 閱讀與測驗組件
const ReadingPage = ({ user }) => {
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); setScore(100); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center"><BookOpen className="mr-2 text-yellow-500" /> 本週閱讀教材：壁球入門與規則</h2>
          <div className="aspect-video bg-slate-200 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-500"><p>PDF 閱讀器 (Ver 1.6)</p></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">壁球（Squash）是一項在封閉場地進行的室內運動。重點在於：1. 發球必須擊中前牆發球線上方。 2. 對手必須在球落地兩次前擊回。</p>
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-yellow-400">📝 閱讀後小測</h3>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><p className="mb-2 text-sm">1. 壁球發球時，球必須擊中前牆哪條線上方？</p><div className="space-y-2"><label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="q1" className="text-yellow-500" required /><span className="text-sm text-slate-300">發球線 (Service Line)</span></label><label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="q1" className="text-yellow-500" /><span className="text-sm text-slate-300">底界線 (Tin)</span></label></div></div>
              <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 rounded mt-4 transition-colors">提交答案</button>
            </form>
          ) : <div className="text-center py-6"><div className="text-4xl mb-2">🎉</div><h4 className="text-xl font-bold text-white">恭喜完成！</h4><p className="text-yellow-400 text-2xl font-bold my-2">{score} 分</p><button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-slate-300 underline">重做測驗</button></div>}
        </div>
      </div>
    </div>
  );
};

// 7. 後台管理
const AdminPage = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const handleLogin = async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch(e) { alert("登入失敗"); } };
  const initInventory = async () => { if (!db) return; const items = [{ name: '羽毛球拍', stock: 20, location: 'A櫃' }, { name: '籃球 (5號)', stock: 15, location: 'B架' }, { name: '足球', stock: 12, location: 'C架' }, { name: '壁球拍', stock: 10, location: 'D櫃' }]; for (const i of items) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'), i); alert('庫存初始化完成！'); };
  const postNews = async () => { if (!db || !newsTitle || !newsContent) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), { title: newsTitle, content: newsContent, date: new Date().toLocaleDateString('zh-HK'), timestamp: serverTimestamp() }); setNewsTitle(''); setNewsContent(''); alert('動態已發佈'); };
  
  // CSV 匯出
  const exportFitnessReport = async () => {
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'fitness_records'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { alert("目前沒有體適能紀錄"); return; }
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
      csvContent += "日期,班別,班號,姓名,性別,仰臥起坐,坐姿體前彎,手握力,9分鐘跑,BMI,總分\n";
      snapshot.forEach(doc => {
        const d = doc.data();
        const row = [d.date ? new Date(d.date).toLocaleDateString() : '', d.class, d.classNo, d.name, d.gender, d.sitUps, d.flexibility, d.handGrip, d.run9min, d.bmi, d.totalScore || 0].join(",");
        csvContent += row + "\n";
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `fitness_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) { console.error(e); alert("匯出失敗"); }
  };

  if (!user) return <div className="flex items-center justify-center min-h-[60vh]"><div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700"><h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">🔐 老師登入</h2><form onSubmit={handleLogin} className="space-y-4"><input className="w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/><input className="w-full p-2 border rounded" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/><button className="w-full bg-blue-600 text-white p-2 rounded">登入</button></form></div></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border-l-4 border-blue-500"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">T</div><div><p className="font-bold text-slate-800 dark:text-white">體育主任</p><p className="text-xs text-slate-500">{user.email}</p></div></div><button onClick={() => signOut(auth)} className="text-slate-500 hover:text-red-500"><LogOut size={20} /></button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">📢 發佈最新動態</h3><div className="space-y-4"><input placeholder="標題" className="w-full p-2 border rounded" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} /><textarea placeholder="內容..." rows={4} className="w-full p-2 border rounded" value={newsContent} onChange={e => setNewsContent(e.target.value)} /><button onClick={postNews} className="w-full bg-green-600 text-white px-4 py-2 rounded">發佈公告</button></div></div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">🛠️ 系統維護工具</h3><div className="space-y-4"><div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl"><span>器材資料庫重置</span><button onClick={initInventory} className="bg-purple-100 text-purple-700 px-3 py-1 rounded">執行</button></div><div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl"><span>匯出體適能報告</span><button onClick={exportFitnessReport} className="bg-blue-100 text-blue-700 px-3 py-1 rounded flex gap-1"><Download size={14}/> 匯出</button></div></div></div>
      </div>
    </div>
  );
};

// --- 主應用程式 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } else { if (!auth.currentUser) { await signInAnonymously(auth); } } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); });
    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    switch(activeTab) {
      case 'home': return <HomePage />;
      case 'fitness': return <FitnessPage user={user} />;
      case 'equipment': return <EquipmentPage user={user} />;
      case 'stars': return <StarsPage />;
      case 'reading': return <ReadingPage user={user} />;
      case 'admin': return <AdminPage user={user} />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      <div className="flex-none"><Sidebar activeTab={activeTab} setActiveTab={setActiveTab} /></div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="md:hidden flex items-center p-4 bg-slate-900 text-white border-b border-slate-700"><button className="p-2"><Menu /></button><span className="ml-4 font-bold text-yellow-400">正覺體育人</span></div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 dark:bg-[#0F0F1B]"><div className="max-w-7xl mx-auto">{renderContent()}</div></main>
      </div>
      <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}