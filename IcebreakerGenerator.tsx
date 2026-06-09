import React, { useState, useEffect } from "react";
import { IcebreakerData } from "../types";
import { 
  Sparkles, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Printer, 
  Copy, 
  Save, 
  Check, 
  Flame, 
  ShieldAlert, 
  AlertCircle,
  HelpCircle,
  MessageSquare,
  BookOpen
} from "lucide-react";

interface IcebreakerProps {
  initialTopic: string;
  initialBidang: string;
  savedIcebreakers: IcebreakerData[];
  onSavedIcebreakersChange: (icebreakers: IcebreakerData[]) => void;
}

export default function IcebreakerGenerator({
  initialTopic,
  initialBidang,
  savedIcebreakers,
  onSavedIcebreakersChange
}: IcebreakerProps) {
  // Inputs
  const [topikTema, setTopikTema] = useState("");
  const [bidangLayanan, setBidangLayanan] = useState("Pribadi");
  const [durasi, setDurasi] = useState("10 Menit");

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentIcebreaker, setCurrentIcebreaker] = useState<IcebreakerData | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState(600); // Default 10 min
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);

  useEffect(() => {
    if (initialTopic) {
      setTopikTema(initialTopic);
    }
    if (initialBidang) {
      setBidangLayanan(initialBidang);
    }
  }, [initialTopic, initialBidang]);

  // Set stopwatch countdown based on generated time helper
  useEffect(() => {
    if (currentIcebreaker) {
      const minutesStr = currentIcebreaker.estimasiWaktu.match(/\d+/);
      if (minutesStr) {
        setTimerSeconds(parseInt(minutesStr[0]) * 60);
      }
    }
  }, [currentIcebreaker]);

  // Handle countdown interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topikTema) {
      setError("Silakan masukkan tema atau topik BK terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCurrentIcebreaker(null);
    setIsTimerActive(false);

    try {
      const response = await fetch("/api/generate-icebreaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topikTema, bidangLayanan, durasi })
      });

      if (!response.ok) {
        throw new Error("Gagal merakit game icebreaker. Silakan coba sesaat lagi.");
      }

      const data: IcebreakerData = await response.json();
      setCurrentIcebreaker(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menghubungkan ke AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formattedTime = () => {
    const min = Math.floor(timerSeconds / 60);
    const sec = timerSeconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleCopy = () => {
    if (!currentIcebreaker) return;
    const bodyText = `
Nama Game: ${currentIcebreaker.namaGame}
Estimasi Waktu: ${currentIcebreaker.estimasiWaktu}
Alat & Bahan: ${currentIcebreaker.alatBahan.join(", ")}

Langkah Cara Bermain:
${currentIcebreaker.caraBermain.map((cb, i) => `${i + 1}. ${cb}`).join("\n")}

Dinamika Refleksi & Makna:
${currentIcebreaker.maknaRefleksi}

Pertanyaan Debriefing Konseling:
${currentIcebreaker.pertanyaanDebriefing.map((pd, i) => `- ${pd}`).join("\n")}
    `;

    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!currentIcebreaker) return;
    const toSave: IcebreakerData = {
      ...currentIcebreaker,
      id: "ib_" + Date.now(),
      createdAt: new Date().toISOString()
    };
    onSavedIcebreakersChange([toSave, ...savedIcebreakers]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in no-print">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Input Form Panel */}
        <div className="w-full lg:w-5/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" /> Kreator Icebreaker BK
            </h2>
            <p className="text-xs text-slate-400 mt-1">Ciptakan pemecah kejenuhan kelas yang sarat dengan pesan moral dan nilai positif konseling.</p>
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

            {/* Durasi */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Maksimal Durasi</label>
              <select 
                value={durasi}
                onChange={(e) => setDurasi(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="5 Menit">5 Menit (Cepat & Energis)</option>
                <option value="10 Menit">10 Menit (Ideal & Reflektif)</option>
                <option value="15 Menit">15 Menit (Lebih Interaktif)</option>
              </select>
            </div>

            {/* Tema / Topik */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tema Bimbingan Kelas <span className="text-red-500">*</span></label>
              <textarea 
                rows={3}
                value={topikTema}
                onChange={(e) => setTopikTema(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Misal: 'Mengatasi Konflik Teman Sebaya' atau 'Meningkatkan Konsentrasi Belajar'"
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
                  <span>Meracik Dinamika Game...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Rakit Instan Icebreaker</span>
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
        </div>

        {/* Right Output Preview Panel */}
        <div className="w-full lg:w-7/12 flex flex-col min-h-[480px]">
          {isGenerating ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <Flame className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className="font-bold text-slate-700 text-sm">Merancang Aturan Bermain</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kecerdasan Buatan sedang merancang nama game yang unik, merakit prosedur permainan tanpa alat di kelas, dan mengaitkan psikologi bimbingan konseling ke dalam butir pertanyaan refleksi.
                </p>
              </div>
            </div>
          ) : currentIcebreaker ? (
            <div className="space-y-4 animate-fade-in">
              
              {/* Action Bar */}
              <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl p-3 shadow-md flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="bg-red-500 p-1 px-2 rounded font-bold uppercase tracking-wider text-[10px]">Game</span>
                  <span className="font-medium">{currentIcebreaker.namaGame}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-1 px-2.5 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-1 px-2.5 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Advanced Feature: Embedded Classroom StopWatch */}
              <div className="p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-red-500 rounded-full animate-pulse">
                    <Clock className="w-5 h-5 text-white" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm">Timer Icebreaker Kelas</h4>
                    <p className="text-[10px] text-slate-400">Pastikan game berakhir tepat waktu agar tidak memotong jam pelajaran utama.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Visual Clock */}
                  <span className={`text-2xl font-mono font-bold tracking-wider ${timerSeconds === 0 ? "text-red-500 animate-bounce" : "text-emerald-400"}`}>
                    {formattedTime()}
                  </span>

                  {/* Buttons */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      className={`p-2 rounded font-bold cursor-pointer transition-colors ${isTimerActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}
                    >
                      {isTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerActive(false);
                        const minutesStr = currentIcebreaker.estimasiWaktu.match(/\d+/);
                        setTimerSeconds(minutesStr ? parseInt(minutesStr[0]) * 60 : 600);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Contents Card Sheet */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-xs leading-relaxed space-y-6">
                
                {/* Visual Title Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-850">{currentIcebreaker.namaGame}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">Fungsi: Dinamika Kelas & Pembinaan Suasana</p>
                  </div>
                  <span className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold font-mono">
                    ⏱️ {currentIcebreaker.estimasiWaktu}
                  </span>
                </div>

                {/* Grid: Tools & Preparations */}
                <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-700 tracking-wide">📦 Alat & Bahan:</span>
                  <p className="text-slate-600 font-medium">
                    {currentIcebreaker.alatBahan.length > 0 && currentIcebreaker.alatBahan[0] !== ""
                      ? currentIcebreaker.alatBahan.join(", ")
                      : "Tanpa menggunakan alat bantuan (Bisa dilakukan berdiri di bangku masing-masing)"}
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  <span className="font-extrabold text-[11px] tracking-wider uppercase text-slate-800">Langkah Cara Bermain:</span>
                  <ol className="space-y-1.5 pl-1">
                    {currentIcebreaker.caraBermain.map((langkah, index) => (
                      <li key={index} className="p-2.5 bg-slate-50/50 rounded border border-slate-100 text-slate-600 flex items-start gap-2.5 text-justify">
                        <span className="p-1 px-1.5 bg-slate-100 text-slate-800 font-bold rounded text-[9px]">{index + 1}</span>
                        <span className="leading-relaxed">{langkah}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Guidance reflection meaning */}
                <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-lg space-y-1.5">
                  <h4 className="font-bold text-emerald-800 flex items-center gap-1">💡 Nilai Refleksi & Pemaknaan Psikologis:</h4>
                  <p className="text-emerald-700 leading-relaxed text-justify">
                    {currentIcebreaker.maknaRefleksi}
                  </p>
                </div>

                {/* Debrief questions */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-850 flex items-center gap-1">💬 Pertanyaan Debrief (Diskusi Pasca Permainan):</h4>
                  <ul className="space-y-1.5 pl-1">
                    {currentIcebreaker.pertanyaanDebriefing.map((pertanyaan, pIdx) => (
                      <li key={pIdx} className="p-2.5 bg-rose-50/10 border border-slate-100 rounded text-slate-600 flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">?</span>
                        <span className="leading-relaxed">{pertanyaan}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <span className="p-3.5 bg-slate-50 rounded-full text-slate-400">
                <Flame className="w-8 h-8 text-slate-200" />
              </span>
              <div className="space-y-1 max-w-sm">
                <p className="font-bold text-slate-600">Draf Icebreaker Belum Tersimpan</p>
                <p className="text-xs leading-relaxed">
                  Lengkapi tema bimbingan klasikal dan alokasi waktu luang di sebelah kiri, lalu klik <b>"Rakit Instan Icebreaker"</b> untuk mengolah permainan kelas yang interaktif.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Previously generated list */}
      {savedIcebreakers.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-md font-bold text-slate-800">Daftar Icebreakers Tersimpan</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedIcebreakers.map((ib) => (
              <div 
                key={ib.id}
                onClick={() => setCurrentIcebreaker(ib)}
                className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow hover:border-emerald-300 hover:bg-emerald-50/5 transition-all text-xs cursor-pointer space-y-2"
              >
                <span className="inline-block px-2 py-0.5 bg-red-100 rounded text-[9px] font-extrabold uppercase text-red-700">
                  {ib.estimasiWaktu}
                </span>
                <h4 className="font-bold text-slate-800 line-clamp-1">{ib.namaGame}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2">{ib.maknaRefleksi}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
