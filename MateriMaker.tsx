import React, { useState, useEffect } from "react";
import { MateriData, PoinMateri } from "../types";
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Printer, 
  Copy, 
  Save, 
  Check, 
  BookOpen, 
  FileText, 
  Award,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Palette,
  Edit3,
  Plus,
  Trash2,
  Eye,
  Sliders
} from "lucide-react";

const THEME_STYLES = {
  emerald: {
    name: "Modern Emerald (Fresh)",
    cardBg: "from-white to-emerald-50/25 text-slate-800 border-emerald-100",
    headerBg: "bg-emerald-600 text-white",
    counterColor: "text-emerald-600",
    bulletBullet: "text-emerald-700 bg-emerald-50 border border-emerald-100",
    textColor: "text-slate-800",
    paragraphColor: "text-slate-600",
    tagStyle: "bg-emerald-100 text-emerald-800",
    borderStyle: "border-emerald-100",
    accentColor: "emerald"
  },
  ocean: {
    name: "Ocean Breeze (Serene)",
    cardBg: "from-sky-50 to-blue-50/40 text-slate-800 border-sky-100",
    headerBg: "bg-sky-600 text-white",
    counterColor: "text-sky-600",
    bulletBullet: "text-sky-700 bg-sky-50 border border-sky-150",
    textColor: "text-slate-850",
    paragraphColor: "text-slate-650",
    tagStyle: "bg-sky-100 text-sky-800",
    borderStyle: "border-sky-250",
    accentColor: "sky"
  },
  sunset: {
    name: "Sunset Space (Deep)",
    cardBg: "from-slate-900 to-indigo-950 text-slate-100 border-indigo-950",
    headerBg: "bg-amber-400 text-slate-950",
    counterColor: "text-amber-400",
    bulletBullet: "text-amber-300 bg-slate-800/80 border border-slate-700",
    textColor: "text-slate-100",
    paragraphColor: "text-slate-300",
    tagStyle: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    borderStyle: "border-slate-800",
    accentColor: "amber"
  },
  terracotta: {
    name: "Warm Terracotta",
    cardBg: "from-amber-50/50 to-orange-100/10 text-orange-950 border-orange-100",
    headerBg: "bg-orange-800 text-white",
    counterColor: "text-orange-850",
    bulletBullet: "text-orange-800 bg-orange-50 border border-orange-150",
    textColor: "text-orange-950",
    paragraphColor: "text-orange-900/85",
    tagStyle: "bg-orange-100 text-orange-800",
    borderStyle: "border-orange-150",
    accentColor: "orange"
  },
  sakura: {
    name: "Sakura Pastel",
    cardBg: "from-pink-50/50 to-rose-50/30 text-rose-950 border-pink-100",
    headerBg: "bg-pink-600 text-white",
    counterColor: "text-pink-600",
    bulletBullet: "text-pink-700 bg-pink-50 border border-pink-150",
    textColor: "text-rose-900",
    paragraphColor: "text-rose-800/90",
    tagStyle: "bg-pink-100 text-pink-850",
    borderStyle: "border-pink-200",
    accentColor: "pink"
  },
  cyberpunk: {
    name: "Futuristic Violet",
    cardBg: "from-purple-950 to-fuchsia-950 text-fuchsia-100 border-purple-900",
    headerBg: "bg-fuchsia-600 text-white",
    counterColor: "text-fuchsia-400",
    bulletBullet: "text-fuchsia-300 bg-purple-900/70 border border-purple-800",
    textColor: "text-fuchsia-100",
    paragraphColor: "text-purple-200",
    tagStyle: "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30",
    borderStyle: "border-purple-800",
    accentColor: "fuchsia"
  }
};

interface MateriProps {
  initialTopic: string;
  initialBidang: string;
  savedMateri: MateriData[];
  onSavedMateriChange: (materi: MateriData[]) => void;
}

export default function MateriMaker({ 
  initialTopic, 
  initialBidang, 
  savedMateri, 
  onSavedMateriChange 
}: MateriProps) {
  // Parameters
  const [topikTema, setTopikTema] = useState("");
  const [bidangLayanan, setBidangLayanan] = useState("Pribadi");
  const [audiens, setAudiens] = useState("SMP / Siswa Menengah Pertama");

  // Interaction states
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentMateri, setCurrentMateri] = useState<MateriData | null>(null);
  
  // Interactive slides player & themes & editor
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<"emerald" | "ocean" | "sunset" | "terracotta" | "sakura" | "cyberpunk">("emerald");
  const [isEditing, setIsEditing] = useState(false);

  // General controls
  const [subView, setSubView] = useState<"slides" | "outline" | "studi-kasus">("slides");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync with initial load or parameters transferred from other modules
  useEffect(() => {
    if (initialTopic) {
      setTopikTema(initialTopic);
    }
    if (initialBidang) {
      setBidangLayanan(initialBidang);
    }
  }, [initialTopic, initialBidang]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topikTema) {
      setError("Isi tema bimbingan terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCurrentMateri(null);
    setIsPlaying(false);
    setCurrentSlideIndex(0);

    try {
      const response = await fetch("/api/generate-materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topikTema, bidangLayanan, audiens })
      });

      if (!response.ok) {
        throw new Error("Gagal menyusun materi. Silakan coba kembali.");
      }

      const data: MateriData = await response.json();
      setCurrentMateri(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi saat memanggil AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getSlides = (): { title: string; content: string; bulletPoints?: string[]; isCover?: boolean; isReview?: boolean }[] => {
    if (!currentMateri) return [];

    const slidesList: { title: string; content: string; bulletPoints?: string[]; isCover?: boolean; isReview?: boolean }[] = [
      // Slide 1: Cover
      {
        title: currentMateri.judulMateri,
        content: currentMateri.pengantar,
        isCover: true
      }
    ];

    // Slide points
    currentMateri.poinMateri.forEach((poin) => {
      slidesList.push({
        title: poin.subJudul,
        content: poin.deskripsi,
        bulletPoints: poin.tipsPraktis,
        isCover: false
      });
    });

    // Slide: Case study
    slidesList.push({
      title: "🧩 Studi Kasus & Curah Pendapat",
      content: currentMateri.studiKasusInteraktif.cerita,
      bulletPoints: currentMateri.studiKasusInteraktif.pertanyaanDiskusi,
      isCover: false
    });

    // Slide: Conclusion
    slidesList.push({
      title: "🌟 Rencana Tindak Lanjut & Kesimpulan",
      content: currentMateri.kesimpulan,
      isReview: true
    });

    return slidesList;
  };

  const slides = getSlides();

  const updateMateriField = (updater: (prev: MateriData) => MateriData) => {
    if (!currentMateri) return;
    setCurrentMateri(updater(currentMateri));
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const handleSave = () => {
    if (!currentMateri) return;
    const toSave: MateriData = {
      ...currentMateri,
      id: "mat_" + Date.now(),
      createdAt: new Date().toISOString()
    };
    onSavedMateriChange([toSave, ...savedMateri]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyText = () => {
    if (!currentMateri) return;
    const text = `
MATERI LAYANAN: ${currentMateri.judulMateri.toUpperCase()}
Topik: ${topikTema}

PENGANTAR:
${currentMateri.pengantar}

MATERI INTI:
${currentMateri.poinMateri.map((pm, i) => `
${i + 1}. ${pm.subJudul}
   - Penjelasan: ${pm.deskripsi}
   - Tips: ${pm.tipsPraktis.join(", ")}
`).join("\n")}

STUDI KASUS:
Cerita: ${currentMateri.studiKasusInteraktif.cerita}
Pertanyaan Diskusi:
${currentMateri.studiKasusInteraktif.pertanyaanDiskusi.map((pt, i) => `- ${pt}`).join("\n")}

KESIMPULAN:
${currentMateri.kesimpulan}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in no-print">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Form Panel */}
        <div className="w-full lg:w-5/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" /> Parameter Materi Layanan
            </h2>
            <p className="text-xs text-slate-400 mt-1">Sediakan pokok bimbingan agar sistem merumuskan rancangan materi presentasi interaktif khusus kelas Anda.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            {/* Bidang Layanan */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bidang Layanan</label>
              <select 
                value={bidangLayanan}
                onChange={(e) => setBidangLayanan(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="Pribadi">Pribadi</option>
                <option value="Sosial">Sosial</option>
                <option value="Belajar">Belajar</option>
                <option value="Karir">Karir</option>
                <option value="Keluarga">Keluarga</option>
              </select>
            </div>

            {/* Sasaran Audiens */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Karakteristik Siswa (Audiens)</label>
              <select 
                value={audiens}
                onChange={(e) => setAudiens(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="Siswa Kelas VII/VIII (SMP Baru)">Siswa Kelas VII/VIII (SMP Awal)</option>
                <option value="Siswa Kelas IX (SMP Lulusan)">Siswa Kelas IX (Persiapan Studi Lanjut)</option>
                <option value="Siswa Kelas X/XI (Remaja Menengah/SMA)">Siswa Kelas X/XI (Transisi & Penyesuaian SMA)</option>
                <option value="Siswa Kelas XII (Remaja Akhir/Persiapan Karir)">Siswa Kelas XII (Persiapan Karir & Kuliah)</option>
              </select>
            </div>

            {/* Tema / Topik */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tema / Topik Bimbingan <span className="text-red-500">*</span></label>
              <textarea 
                rows={3}
                value={topikTema}
                onChange={(e) => setTopikTema(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Misal: 'Tips Manajemen Waktu Untuk Mencegah Prokrastinasi'"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isGenerating || !topikTema}
              className={`w-full py-3 px-4 rounded-lg font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isGenerating || !topikTema
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-700 rounded-full animate-spin" />
                  <span>Menganalisis & Menyusun Presentasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Rancang Materi & Skenario</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Quick instructions */}
          <div className="p-4 bg-emerald-50 rounded-lg text-xs text-emerald-800 space-y-2">
            <span className="font-bold flex items-center gap-1"><Lightbulb className="w-4 h-4 text-emerald-600" /> Tip Guru BK:</span>
            <p className="leading-relaxed">Materi yang baik melibatkan kuis interaktif atau studi kasus. Sistem akan menyusun skenario studi kasus realistis sehingga pembelajaran klasikal menjadi interaktif dan berkesan!</p>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="w-full lg:w-7/12 flex flex-col min-h-[480px]">
          {isGenerating ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <BookOpen className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className="font-bold text-slate-700 text-sm">Menyusun Pokok Bahasan</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistem sedang menyusun pengantar bernada empatik, mengolah poin-poin teoretis ke dalam langkah praktis, dan merekayasa naskah studi kasus fiktif yang relevan & hangat.
                </p>
              </div>
            </div>
          ) : currentMateri ? (
            <div className="space-y-4">
              
              {/* Operations Panel */}
              <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl p-3 shadow-md flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 p-1 px-2 rounded font-bold uppercase tracking-wider text-[10px]">Materi</span>
                  <span className="font-medium line-clamp-1">{currentMateri.judulMateri}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <button
                    onClick={handleCopyText}
                    className="p-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Gamma AI Style Design Tuner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Studio Penata Estetika & Palet Slides
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium font-sans">
                    Transformasikan palet visual instan & aktifkan edit teks draf langsung di bawah.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Theme Selector */}
                  <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    {Object.entries(THEME_STYLES).map(([key, style]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTheme(key as any)}
                        title={style.name}
                        className={`w-5 h-5 rounded-md transition-all border cursor-pointer ${
                          selectedTheme === key 
                            ? "ring-2 ring-slate-800 ring-offset-1 scale-105 border-slate-900" 
                            : "border-slate-200 hover:scale-110"
                        }`}
                        style={{
                          background: key === "emerald" ? "linear-gradient(135deg, #059669, #ecfdf5)" :
                                      key === "ocean" ? "linear-gradient(135deg, #0284c7, #f0f9ff)" :
                                      key === "sunset" ? "linear-gradient(135deg, #f59e0b, #1e1b4b)" :
                                      key === "terracotta" ? "linear-gradient(135deg, #ea580c, #fff7ed)" :
                                      key === "sakura" ? "linear-gradient(135deg, #e11d48, #fff1f2)" :
                                      "linear-gradient(135deg, #d946ef, #1e1b4b)"
                        }}
                      />
                    ))}
                  </div>

                  {/* Inline edit toggle button */}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-1.5 rounded-lg font-bold border flex items-center gap-1 transition-all cursor-pointer text-[11px] shadow-2xs ${
                      isEditing 
                        ? "bg-amber-600 border-amber-700 text-white" 
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-250"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Tutup Editor" : "Edit Konten"}</span>
                  </button>
                </div>
              </div>

              {/* Presentation Subtabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setSubView("slides")}
                  className={`px-4 py-2 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px ${
                    subView === "slides" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  💻 Mode Presentasi Slides
                </button>
                <button
                  onClick={() => setSubView("outline")}
                  className={`px-4 py-2 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px ${
                    subView === "outline" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📝 Brosur / Handout Lengkap
                </button>
                <button
                  onClick={() => setSubView("studi-kasus")}
                  className={`px-4 py-2 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px ${
                    subView === "studi-kasus" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🧩 Studi Kasus Diskusi
                </button>
              </div>

              {/* Content Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[350px] shadow-sm flex flex-col justify-between">
                
                {/* 1. Mode Slide Presentasi */}
                {subView === "slides" && slides.length > 0 && (
                  <div className="flex-1 flex flex-col justify-between space-y-6">
                    
                    {/* Slide Area styled with Theme Config */}
                    {(() => {
                      const theme = THEME_STYLES[selectedTheme];
                      return (
                        <div className={`flex-1 p-6 bg-gradient-to-br ${theme.cardBg} border ${theme.borderStyle} rounded-xl flex flex-col justify-center min-h-[260px] transition-all relative overflow-hidden shadow-2xs`}>
                          
                          {/* Counter indicator */}
                          <span className={`absolute top-3 right-3 text-[10px] font-mono font-bold uppercase ${theme.counterColor}`}>
                            {isEditing ? "🛠️ Editor " : "Slide "}{currentSlideIndex + 1} / {slides.length}
                          </span>

                          {isEditing ? (
                            /* EDIT MODE WRAPPER */
                            <div className="w-full space-y-4 text-xs font-semibold py-1">
                              {currentSlideIndex === 0 ? (
                                /* EDIT COVER SLIDE */
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Judul Presentasi Utama</label>
                                    <input
                                      type="text"
                                      value={currentMateri.judulMateri}
                                      onChange={(e) => updateMateriField(prev => ({ ...prev, judulMateri: e.target.value }))}
                                      className="w-full p-2 bg-white/90 backdrop-blur-xs border border-slate-250 rounded-lg text-slate-850 font-bold text-xs focus:ring-1 focus:ring-rose-400 text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Teks Pendantar (Intro)</label>
                                    <textarea
                                      rows={4}
                                      value={currentMateri.pengantar}
                                      onChange={(e) => updateMateriField(prev => ({ ...prev, pengantar: e.target.value }))}
                                      className="w-full p-2 bg-white/90 backdrop-blur-xs border border-slate-250 rounded-lg text-slate-850 text-xs focus:ring-1 focus:ring-rose-400 leading-relaxed font-sans text-slate-800"
                                    />
                                  </div>
                                </div>
                              ) : currentSlideIndex > 0 && currentSlideIndex <= currentMateri.poinMateri.length ? (
                                /* EDIT POINT SLIDE */
                                (() => {
                                  const poinIdx = currentSlideIndex - 1;
                                  const activePoin = currentMateri.poinMateri[poinIdx];
                                  if (!activePoin) return null;
                                  return (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Judul Slide</label>
                                        <input
                                          type="text"
                                          value={activePoin.subJudul}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateMateriField(prev => {
                                              const copy = [...prev.poinMateri];
                                              copy[poinIdx] = { ...copy[poinIdx], subJudul: val };
                                              return { ...prev, poinMateri: copy };
                                            });
                                          }}
                                          className="w-full p-2 bg-white/90 backdrop-blur-xs border border-slate-250 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-rose-400 text-slate-900"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Deskripsi / Penjelasan Singkat</label>
                                        <textarea
                                          rows={3}
                                          value={activePoin.deskripsi}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateMateriField(prev => {
                                              const copy = [...prev.poinMateri];
                                              copy[poinIdx] = { ...copy[poinIdx], deskripsi: val };
                                              return { ...prev, poinMateri: copy };
                                            });
                                          }}
                                          className="w-full p-2 bg-white/90 backdrop-blur-xs border border-slate-250 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-rose-400 leading-relaxed font-sans text-slate-800"
                                        />
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="block text-[10px] uppercase font-bold text-slate-550">Butir Poin / Tips Praktis</label>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateMateriField(prev => {
                                                const copy = [...prev.poinMateri];
                                                copy[poinIdx] = {
                                                  ...copy[poinIdx],
                                                  tipsPraktis: [...copy[poinIdx].tipsPraktis, "Ketik tips praktis di sini"]
                                                };
                                                return { ...prev, poinMateri: copy };
                                              });
                                            }}
                                            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
                                          >
                                            <Plus className="w-3 h-3" /> Tambah Tips
                                          </button>
                                        </div>
                                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                          {activePoin.tipsPraktis.map((tip, tipIdx) => (
                                            <div key={tipIdx} className="flex items-center gap-1.5">
                                              <span className="text-slate-405">•</span>
                                              <input
                                                type="text"
                                                value={tip}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  updateMateriField(prev => {
                                                    const copy = [...prev.poinMateri];
                                                    const tipsCopy = [...copy[poinIdx].tipsPraktis];
                                                    tipsCopy[tipIdx] = val;
                                                    copy[poinIdx] = { ...copy[poinIdx], tipsPraktis: tipsCopy };
                                                    return { ...prev, poinMateri: copy };
                                                  });
                                                }}
                                                className="flex-1 p-1 bg-white border border-slate-200 rounded text-[11px] text-slate-800 font-medium"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updateMateriField(prev => {
                                                    const copy = [...prev.poinMateri];
                                                    copy[poinIdx] = {
                                                      ...copy[poinIdx],
                                                      tipsPraktis: copy[poinIdx].tipsPraktis.filter((_, i) => i !== tipIdx)
                                                    };
                                                    return { ...prev, poinMateri: copy };
                                                  });
                                                }}
                                                className="p-1 text-slate-400 hover:text-red-650"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : currentSlideIndex === currentMateri.poinMateri.length + 1 ? (
                                /* EDITING CASE STUDY */
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-orange-850 mb-1">Cerita Studi Kasus</label>
                                    <textarea
                                      rows={4}
                                      value={currentMateri.studiKasusInteraktif.cerita}
                                      onChange={(e) => updateMateriField(prev => ({
                                        ...prev,
                                        studiKasusInteraktif: {
                                          ...prev.studiKasusInteraktif,
                                          cerita: e.target.value
                                        }
                                      }))}
                                      className="w-full p-2 bg-white/90 backdrop-blur-xs border border-slate-250 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-[10px] uppercase font-bold text-orange-850">Pertanyaan Diskusi Kelas</label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateMateriField(prev => ({
                                            ...prev,
                                            studiKasusInteraktif: {
                                              ...prev.studiKasusInteraktif,
                                              pertanyaanDiskusi: [...prev.studiKasusInteraktif.pertanyaanDiskusi, "Pertanyaan reflektif baru?"]
                                            }
                                          }));
                                        }}
                                        className="text-[10px] font-bold text-orange-800"
                                      >
                                        + Tabah Soal
                                      </button>
                                    </div>
                                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                                      {currentMateri.studiKasusInteraktif.pertanyaanDiskusi.map((pt, ptIdx) => (
                                        <div key={ptIdx} className="flex items-center gap-1.5">
                                          <span className="text-orange-700 font-bold">{ptIdx + 1}</span>
                                          <input
                                            type="text"
                                            value={pt}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              updateMateriField(prev => {
                                                const ptCopy = [...prev.studiKasusInteraktif.pertanyaanDiskusi];
                                                ptCopy[ptIdx] = val;
                                                return {
                                                  ...prev,
                                                  studiKasusInteraktif: {
                                                    ...prev.studiKasusInteraktif,
                                                    pertanyaanDiskusi: ptCopy
                                                  }
                                                };
                                              });
                                            }}
                                            className="flex-1 p-1 bg-white border border-slate-200 rounded text-[11px] text-slate-800 font-medium"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateMateriField(prev => ({
                                                ...prev,
                                                studiKasusInteraktif: {
                                                  ...prev.studiKasusInteraktif,
                                                  pertanyaanDiskusi: prev.studiKasusInteraktif.pertanyaanDiskusi.filter((_, i) => i !== ptIdx)
                                                }
                                              }));
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-650"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* EDITING CONCLUSION */
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Rencana Kesimpulan & Komitmen Siswa</label>
                                    <textarea
                                      rows={6}
                                      value={currentMateri.kesimpulan}
                                      onChange={(e) => updateMateriField(prev => ({ ...prev, kesimpulan: e.target.value }))}
                                      className="w-full p-2 bg-white/90 backdrop-blur-xs border border-slate-250 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* NORMAL PREVIEW MODE */
                            slides[currentSlideIndex].isCover ? (
                              <div className="text-center space-y-4 py-8">
                                <span className={`inline-flex py-1 px-3 ${theme.tagStyle} font-extrabold rounded-full text-[10px] uppercase tracking-widest`}>
                                  Bimbingan Klasikal
                                </span>
                                <h2 className={`text-xl md:text-2xl font-black tracking-tight leading-snug ${theme.textColor}`}>
                                  {slides[currentSlideIndex].title}
                                </h2>
                                <p className={`text-xs max-w-md mx-auto leading-relaxed ${theme.paragraphColor} font-medium`}>
                                  {slides[currentSlideIndex].content}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4 text-left">
                                <h3 className={`text-md md:text-lg font-black border-b pb-2.5 flex items-center gap-2 ${theme.borderStyle} ${theme.textColor}`}>
                                  <span className={`w-3 h-3 rounded-full ${theme.headerBg} block animate-pulse`} /> 
                                  {slides[currentSlideIndex].title}
                                </h3>
                                <p className={`text-xs leading-relaxed font-semibold ${theme.paragraphColor}`}>
                                  {slides[currentSlideIndex].content}
                                </p>
                                {slides[currentSlideIndex].bulletPoints && slides[currentSlideIndex].bulletPoints!.length > 0 && (
                                  <div className="pt-2 space-y-2">
                                    <span className={`text-[10px] uppercase font-extrabold tracking-wider block ${theme.counterColor}`}>
                                      Faktor Pendukung / Tips Praktis:
                                    </span>
                                    <ul className="grid grid-cols-1 gap-1.5">
                                      {slides[currentSlideIndex].bulletPoints?.map((item, id) => (
                                        <li key={id} className={`text-xs p-2.5 rounded-xl flex items-start gap-2 bg-white/60 backdrop-blur-xs border ${theme.borderStyle} shadow-2sm font-medium`}>
                                          <span className={`font-bold text-sm ${theme.counterColor}`}>•</span>
                                          <span className={`font-medium leading-relaxed ${theme.textColor}`}>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })()}

                    {/* Slides Controller */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={handlePrevSlide}
                        disabled={currentSlideIndex === 0}
                        className={`p-2 rounded border border-slate-200 cursor-pointer text-xs font-semibold flex items-center gap-1 transition-colors ${
                          currentSlideIndex === 0 ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" /> Sebelum
                      </button>

                      <div className="flex gap-1 flex-wrap justify-center">
                        {slides.map((_, idx) => (
                           <span 
                             key={idx} 
                             onClick={() => setCurrentSlideIndex(idx)}
                             className={`w-2 h-2 rounded-full cursor-pointer transition-all ${idx === currentSlideIndex ? "bg-rose-500 w-4" : "bg-slate-200"}`} 
                           />
                         ))}
                       </div>

                      <button
                        onClick={handleNextSlide}
                        disabled={currentSlideIndex === slides.length - 1}
                        className={`p-2 rounded border border-slate-200 cursor-pointer text-xs font-semibold flex items-center gap-1 transition-colors ${
                          currentSlideIndex === slides.length - 1 ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Berikut <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Mode Brosur/Outline Lengkap */}
                {subView === "outline" && (() => {
                  const theme = THEME_STYLES[selectedTheme];
                  return (
                    <div className="space-y-6 text-xs text-justify">
                      <div className={`p-5 rounded-xl border bg-gradient-to-br ${theme.cardBg} ${theme.borderStyle}`}>
                        <span className={`inline-block px-2.5 py-1 ${theme.tagStyle} rounded-full text-[9px] font-extrabold uppercase tracking-wider`}>
                          Brosur / Ringkasan Materi Lengkap
                        </span>
                        <h3 className={`text-base font-black tracking-tight mt-2 ${theme.textColor}`}>{currentMateri.judulMateri}</h3>
                        <p className="text-slate-400 text-[10px] mt-2">Topik: {topikTema} | Sasaran: {audiens}</p>
                      </div>

                      <div className={`p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 italic leading-relaxed font-medium`}>
                        " {currentMateri.pengantar} "
                      </div>

                      <div className="space-y-4">
                        {currentMateri.poinMateri.map((pm, idx) => (
                          <div key={idx} className={`p-4 bg-white/60 backdrop-blur-xs border ${theme.borderStyle} rounded-xl space-y-3`}>
                            <h4 className={`font-black text-[12px] flex items-center gap-2 ${theme.textColor}`}>
                              <span className={`w-6 h-6 flex items-center justify-center ${theme.headerBg} font-extrabold rounded-lg text-[10px]`}>
                                {idx + 1}
                              </span>
                              {pm.subJudul}
                            </h4>
                            <p className="text-slate-650 leading-relaxed font-semibold">{pm.deskripsi}</p>
                            {pm.tipsPraktis.length > 0 && (
                              <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                                <span className={`font-extrabold text-[10px] tracking-wider uppercase ${theme.counterColor}`}>Tips Ringkas Bagi Siswa:</span>
                                <ul className="grid grid-cols-1 gap-1 pl-1">
                                  {pm.tipsPraktis.map((tp, idx2) => (
                                    <li key={idx2} className="flex items-start gap-1.5 text-slate-600 font-medium">
                                      <span className={`${theme.counterColor} text-xs mt-0.5`}>•</span>
                                      <span>{tp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className={`p-5 ${theme.headerBg} rounded-xl space-y-2 text-white shadow-2xs`}>
                        <h4 className="font-extrabold flex items-center gap-1.5 text-sm"><Award className="w-4 h-4 text-white animate-bounce" /> Rencana Kesimpulan & Tindak Lanjut:</h4>
                        <p className="leading-relaxed text-[11px] font-semibold text-white/90">{currentMateri.kesimpulan}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Mode Studi Kasus */}
                {subView === "studi-kasus" && (
                  <div className="space-y-5 text-xs">
                    <div>
                      <span className="inline-block py-0.5 px-2 bg-orange-100 text-orange-800 rounded text-[9px] font-extrabold tracking-wider uppercase">Problem Solving</span>
                      <h3 className="text-md font-bold text-slate-800 mt-1">Studi Kasus Pembelajaran Interaktif</h3>
                      <p className="text-slate-400 text-[10px] mt-0.5">Berikan cerita di bawah ini kepada siswa untuk dibahas berkelompok.</p>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-slate-700 leading-relaxed font-medium">
                      {currentMateri.studiKasusInteraktif.cerita}
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 block">Pertanyaan diskusi kelompok siswa:</span>
                      <ul className="space-y-1.5 pl-1">
                        {currentMateri.studiKasusInteraktif.pertanyaanDiskusi.map((pt, idx) => (
                          <li key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 flex items-start gap-2">
                            <span className="p-1 px-1.5 bg-slate-200 text-slate-800 rounded text-[10px] font-extrabold">{idx + 1}</span>
                            <span className="leading-relaxed">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <span className="p-3.5 bg-slate-50 rounded-full text-slate-400">
                <FileText className="w-8 h-8 text-slate-300" />
              </span>
              <div className="space-y-1 max-w-sm">
                <p className="font-bold text-slate-600">Bahan Ajar Belum Tersedia</p>
                <p className="text-xs leading-relaxed">
                  Gunakan form di sebelah kiri untuk merancang draf presentasi materi. Sistem akan merancang <b>Slides, Handout, dan naskah Studi Kasus Lengkap</b> untuk bimbingan klasikal.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History of Materi */}
      {savedMateri.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-md font-bold text-slate-800">Bahan Ajar Lain Tersimpan</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedMateri.map((mat) => (
              <div 
                key={mat.id}
                onClick={() => setCurrentMateri(mat)}
                className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow hover:border-rose-300 hover:bg-rose-50/5 transition-all text-xs cursor-pointer space-y-2"
              >
                <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-extrabold uppercase text-slate-600">
                  {mat.judulMateri ? "Slide Aktif" : "Handout"}
                </span>
                <h4 className="font-bold text-slate-800 line-clamp-1">{mat.judulMateri}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2">{mat.pengantar}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
