import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import RplGenerator from "./components/RplGenerator";
import MateriMaker from "./components/MateriMaker";
import IcebreakerGenerator from "./components/IcebreakerGenerator";
import AsesmenMaker from "./components/AsesmenMaker";
import AuthModal from "./components/AuthModal";
import { RPLData, IcebreakerData, MateriData, AsesmenData, PredefinedTopic } from "./types";
import { 
  Heart, 
  Home, 
  FileText, 
  BookOpen, 
  Flame, 
  Clipboard, 
  Settings,
  HelpCircle,
  Menu,
  X,
  FileSpreadsheet,
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  UserCheck,
  Sun,
  Moon
} from "lucide-react";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "rpl" | "materi" | "icebreaker" | "asesmen">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("bk_dark_mode") === "true";
  });

  // Apply dark mode class to root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bk_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bk_dark_mode", "false");
    }
  }, [darkMode]);

  // Shared Transfer state (when a user selects a topic on the dashboard or sibling helper)
  const [selectedTopicText, setSelectedTopicText] = useState("");
  const [selectedBidang, setSelectedBidang] = useState("");

  // Persistent States
  const [savedRpls, setSavedRpls] = useState<RPLData[]>([]);
  const [savedIcebreakers, setSavedIcebreakers] = useState<IcebreakerData[]>([]);
  const [savedMateri, setSavedMateri] = useState<MateriData[]>([]);
  const [savedAsesmen, setSavedAsesmen] = useState<AsesmenData[]>([]);

  // Cloud Sync & Auth States
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Load from LocalStorage or Server Sync
  useEffect(() => {
    // 1. Check if user is cached
    const cachedUser = localStorage.getItem("bk_current_user");
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setCurrentUser(parsedUser);
        fetchSyncData(parsedUser.uid);
      } catch (e) {
        console.error("Gagal membaca cache user:", e);
        loadOfflineData();
      }
    } else {
      loadOfflineData();
    }
  }, []);

  const loadOfflineData = () => {
    try {
      const rpls = localStorage.getItem("bk_saved_rpls");
      if (rpls) setSavedRpls(JSON.parse(rpls));

      const ices = localStorage.getItem("bk_saved_icebreakers");
      if (ices) setSavedIcebreakers(JSON.parse(ices));

      const mats = localStorage.getItem("bk_saved_materi");
      if (mats) setSavedMateri(JSON.parse(mats));

      const ases = localStorage.getItem("bk_saved_asesmen");
      if (ases) setSavedAsesmen(JSON.parse(ases));
    } catch (e) {
      console.error("Gagal memuat data offline dari LocalStorage:", e);
    }
  };

  const fetchSyncData = async (userId: string) => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/sync/${userId}`);
      if (res.ok) {
        const cloudData = await res.json();
        
        // Merge offline + online items seamlessly comparing ID or createdAt timestamp
        const mergeArrays = (local: any[], cloud: any[]) => {
          const combined = [...local];
          const localKeys = new Set(local.map(item => item.id || item.createdAt));
          
          if (Array.isArray(cloud)) {
            cloud.forEach(item => {
              const signature = item.id || item.createdAt;
              if (signature && !localKeys.has(signature)) {
                combined.push(item);
              }
            });
          }
          return combined;
        };

        const mergedRpls = mergeArrays(savedRpls, cloudData.rpls);
        const mergedIces = mergeArrays(savedIcebreakers, cloudData.icebreakers);
        const mergedMats = mergeArrays(savedMateri, cloudData.materi);
        const mergedAses = mergeArrays(savedAsesmen, cloudData.asesmen);

        setSavedRpls(mergedRpls);
        localStorage.setItem("bk_saved_rpls", JSON.stringify(mergedRpls));

        setSavedIcebreakers(mergedIces);
        localStorage.setItem("bk_saved_icebreakers", JSON.stringify(mergedIces));

        setSavedMateri(mergedMats);
        localStorage.setItem("bk_saved_materi", JSON.stringify(mergedMats));

        setSavedAsesmen(mergedAses);
        localStorage.setItem("bk_saved_asesmen", JSON.stringify(mergedAses));
      }
    } catch (e) {
      console.error("Gagal mengambil data sinkronisasi server:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Safe online sync pusher
  const triggerOnlineSync = async (userId: string, rpls: RPLData[], icebreakers: IcebreakerData[], materi: MateriData[], asesmen: AsesmenData[]) => {
    try {
      await fetch(`/api/sync/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rpls, icebreakers, materi, asesmen })
      });
    } catch (e) {
      console.error("Gagal mengunggah data sinkronisasi:", e);
    }
  };

  // Sync state upward whenever local states undergo changes while logged in
  useEffect(() => {
    if (currentUser) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        triggerOnlineSync(currentUser.uid, savedRpls, savedIcebreakers, savedMateri, savedAsesmen)
          .finally(() => setIsSyncing(false));
      }, 1000); // Debounce to avoid excessive API requests
      return () => clearTimeout(timer);
    }
  }, [savedRpls, savedIcebreakers, savedMateri, savedAsesmen, currentUser]);

  const handleAuthSuccess = (user: { uid: string; email: string }) => {
    setCurrentUser(user);
    localStorage.setItem("bk_current_user", JSON.stringify(user));
    fetchSyncData(user.uid);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("bk_current_user");
    // Secure user session: Clear active items
    setSavedRpls([]);
    setSavedIcebreakers([]);
    setSavedMateri([]);
    setSavedAsesmen([]);
    localStorage.removeItem("bk_saved_rpls");
    localStorage.removeItem("bk_saved_icebreakers");
    localStorage.removeItem("bk_saved_materi");
    localStorage.removeItem("bk_saved_asesmen");
  };

  // Save changes to localstorage & offline helper
  const handleSavedRplsChange = (newRpls: RPLData[]) => {
    setSavedRpls(newRpls);
    localStorage.setItem("bk_saved_rpls", JSON.stringify(newRpls));
  };

  const handleSavedIcebreakersChange = (newIces: IcebreakerData[]) => {
    setSavedIcebreakers(newIces);
    localStorage.setItem("bk_saved_icebreakers", JSON.stringify(newIces));
  };

  const handleSavedMateriChange = (newMats: MateriData[]) => {
    setSavedMateri(newMats);
    localStorage.setItem("bk_saved_materi", JSON.stringify(newMats));
  };

  const handleSavedAsesmenChange = (newAses: AsesmenData[]) => {
    setSavedAsesmen(newAses);
    localStorage.setItem("bk_saved_asesmen", JSON.stringify(newAses));
  };

  // Cross-module action triggers (e.g. preset clicked on Dashboard)
  const handleSelectPresetTopic = (topic: PredefinedTopic) => {
    setSelectedTopicText(topic.topik);
    setSelectedBidang(topic.bidang);
    setActiveTab("rpl");
    setMobileMenuOpen(false);
  };

  // Coordinated module trigger (e.g., inside RPL: "Make Materi" or "Make Icebreaker")
  const handleTriggerSiblingModule = (module: "materi" | "icebreaker" | "asesmen", topic: string, bidang: string) => {
    setSelectedTopicText(topic);
    setSelectedBidang(bidang);
    setActiveTab(module);
  };

  // Statistics calculation
  const stats = {
    totalRPL: savedRpls.length,
    totalIcebreakers: savedIcebreakers.length,
    totalMateri: savedMateri.length,
    totalAsesmen: savedAsesmen.length
  };

  return (
    <div className="min-h-screen bg-rose-50/20 dark:bg-[#080c16] flex flex-col font-sans border-t-4 border-rose-400 dark:border-rose-600 transition-colors duration-200">
      
      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 bg-white/95 dark:bg-[#0f1322]/95 backdrop-blur-md border-b border-rose-100 dark:border-slate-800/80 z-50 px-4 py-3 shadow-xs no-print transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-xl text-white shadow-xs flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight flex items-center gap-1.5 leading-none">
                BK Klasikal <span className="text-[10px] bg-rose-100 dark:bg-rose-955/65 text-rose-800 dark:text-rose-250 px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase transition-colors">Workspace</span>
              </span>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 font-medium">Platform Layanan Klasikal Guru Bimbingan-Konseling</p>
            </div>
          </div>

          {/* Desktop Tab Buttons */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-650 dark:text-slate-350">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === "dashboard" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dasbor</span>
            </button>

            <button
              onClick={() => setActiveTab("rpl")}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === "rpl" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Pembuat RPL</span>
            </button>

            <button
              onClick={() => setActiveTab("materi")}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === "materi" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Materi & Slide</span>
            </button>

            <button
              onClick={() => setActiveTab("icebreaker")}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === "icebreaker" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Icebreakers</span>
            </button>

            <button
              onClick={() => setActiveTab("asesmen")}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === "asesmen" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Asesmen & Angket</span>
            </button>
          </nav>

          {/* Right utility or indicator (Desktop Login, Logout & Sync Indicators) */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 font-medium">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center"
              title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500 fill-amber-550/10" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-220 border border-rose-100 dark:border-rose-950 rounded-xl font-bold max-w-[200px]">
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-spin flex-shrink-0" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-rose-600 dark:text-rose-450 flex-shrink-0" />
                  )}
                  <span className="truncate">{currentUser.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-red-750 dark:hover:text-red-400 border border-slate-200 dark:border-slate-750 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg font-bold">
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lokal (Belum Sinkron)</span>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs transition-all cursor-pointer font-bold inline-flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk Akun</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button & Theme Controls */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center"
              title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-600 dark:text-slate-300" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Mobile Nav Dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#0f1322] border-b border-rose-100 dark:border-slate-800/80 p-4 space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-lg no-print animate-fade-in transition-all">
          <button
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "dashboard" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            <Home className="w-4 h-4 text-rose-500" />
            <span>Dasbor Utama</span>
          </button>
          <button
            onClick={() => { setActiveTab("rpl"); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "rpl" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Pembuat RPL BK</span>
          </button>
          <button
            onClick={() => { setActiveTab("materi"); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "materi" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            <BookOpen className="w-4 h-4 text-rose-500" />
            <span>Materi Presentasi & Slide</span>
          </button>
          <button
            onClick={() => { setActiveTab("icebreaker"); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "icebreaker" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            <Flame className="w-4 h-4" />
            <span>Permainan Icebreakers</span>
          </button>
          <button
            onClick={() => { setActiveTab("asesmen"); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "asesmen" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            <Clipboard className="w-4 h-4 text-rose-500" />
            <span>Asesmen & Angket BK</span>
          </button>
 
          {/* Mobile Auth Sync Option */}
          <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-850 dark:text-rose-220 border border-rose-100 dark:border-rose-950 rounded-lg font-extrabold text-[11px] transition-colors">
                  {isSyncing ? <RefreshCw className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-spin flex-shrink-0" /> : <Cloud className="w-4 h-4 text-rose-600 dark:text-rose-450 flex-shrink-0" />}
                  <span className="truncate">{currentUser.email} (Terhubung)</span>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-left rounded-lg cursor-pointer flex items-center gap-2 font-bold transition-all border border-slate-200 dark:border-slate-700"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span>Keluar Workspace</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-[11px]">
                  <CloudOff className="w-4 h-4 text-slate-400" />
                  <span>Penyimpanan Lokal Aktif</span>
                </div>
                <button
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full p-2.5 bg-rose-600 hover:bg-rose-500 text-white text-center rounded-lg cursor-pointer font-extrabold flex items-center justify-center gap-2 transition-all shadow"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk & Sinkronisasi</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Workspace Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {activeTab === "dashboard" && (
          <Dashboard 
            onSelectTopic={handleSelectPresetTopic} 
            stats={stats}
          />
        )}

        {activeTab === "rpl" && (
          <RplGenerator
            selectedTopicText={selectedTopicText}
            selectedBidang={selectedBidang}
            savedRpls={savedRpls}
            onSavedRplsChange={handleSavedRplsChange}
            onTriggerSiblingModule={handleTriggerSiblingModule}
          />
        )}

        {activeTab === "materi" && (
          <MateriMaker
            initialTopic={selectedTopicText}
            initialBidang={selectedBidang}
            savedMateri={savedMateri}
            onSavedMateriChange={handleSavedMateriChange}
          />
        )}

        {activeTab === "icebreaker" && (
          <IcebreakerGenerator
            initialTopic={selectedTopicText}
            initialBidang={selectedBidang}
            savedIcebreakers={savedIcebreakers}
            onSavedIcebreakersChange={handleSavedIcebreakersChange}
          />
        )}

        {activeTab === "asesmen" && (
          <AsesmenMaker
            initialTopic={selectedTopicText}
            initialBidang={selectedBidang}
            savedAsesmen={savedAsesmen}
            onSavedAsesmenChange={handleSavedAsesmenChange}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-white dark:bg-[#0f1322]/80 border-t border-rose-100 dark:border-slate-800/80 py-6 text-xs text-slate-400 dark:text-slate-500 no-print transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-0.5">
            <p className="font-extrabold text-slate-700 dark:text-slate-350">BK Klasikal Workspace © 2026</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Penyusun administrasi praktis, media persentasi interaktif, dan kuesioner refleksi bagi Guru Mandiri BK.</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
            <span>Diberdayakan oleh</span>
            <span className="text-rose-600 dark:text-rose-455 flex items-center gap-0.5">
              Gemini 3.5-Flash <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" />
            </span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
