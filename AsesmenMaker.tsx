import React, { useState, useEffect } from "react";
import { AsesmenData } from "../types";
import { 
  Sparkles, 
  HelpCircle, 
  Printer, 
  Copy, 
  Save, 
  Check, 
  Clipboard, 
  Play, 
  RotateCcw, 
  AlertCircle,
  BarChart as LucideBarChart,
  User,
  Activity,
  Award,
  TrendingUp,
  Info,
  ChevronRight,
  BookOpen
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AsesmenMakerProps {
  initialTopic: string;
  initialBidang: string;
  savedAsesmen: AsesmenData[];
  onSavedAsesmenChange: (asesmen: AsesmenData[]) => void;
}

// Custom Tooltip for Individual Score Profile Chart
const IndividualTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-[11px] text-white shadow-xl max-w-[240px] leading-relaxed">
        <p className="font-extrabold text-amber-400 text-xs">{data.name}</p>
        <p className="text-slate-300 font-medium my-1">{data.fullText}</p>
        <p className="text-emerald-400 font-bold">Skor Siswa: {payload[0].value} / 4 Poin</p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Class-wide Average Score
const ClassAverageTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-[11px] text-white shadow-xl max-w-[260px] leading-relaxed">
        <p className="font-extrabold text-teal-400 text-xs">{data.name}</p>
        <p className="text-slate-300 font-medium my-1">{data.fullText}</p>
        <p className="text-teal-300 font-bold">Rata-Rata Kelas: {payload[0].value} / 4.0</p>
        <div className="mt-1 pt-1 border-t border-slate-850 text-[10px] text-slate-400 space-y-0.5">
          <p>Sangat Setuju (SS): {data["Sangat Setuju"]} siswa</p>
          <p>Setuju (S): {data["Setuju"]} siswa</p>
          <p>Kurang Setuju (KS): {data["Kurang Setuju"]} siswa</p>
          <p>Sangat Tidak Setuju (STS): {data["Sangat Tidak Setuju"]} siswa</p>
        </div>
      </div>
    );
  }
  return null;
};

// Helper to generate aggregate deterministic class-wide statistics
const generateClassStats = (asesmen: AsesmenData) => {
  const numStudents = 36;
  const questions = asesmen.pertanyaanSkala;
  
  // Seed a stable random state based on the exact assessment ID and text length
  const seedString = asesmen.judulAsesmen + (asesmen.id || "default_id");
  let seed = seedString.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Generate question distributions
  const questionDetails = questions.map((q, idx) => {
    // Generate a varying base level of understanding per question
    const baseFavored = 0.55 + pseudoRandom() * 0.35; // between 0.55 and 0.90
    
    let ssCount = 0;
    let sCount = 0;
    let ksCount = 0;
    let stsCount = 0;

    for (let s = 0; s < numStudents; s++) {
      const roll = pseudoRandom();
      if (roll < baseFavored * 0.40) {
        ssCount++;
      } else if (roll < baseFavored * 0.85) {
        sCount++;
      } else if (roll < 0.94) {
        ksCount++;
      } else {
        stsCount++;
      }
    }

    // Ensure sum matches student total
    const totalCount = ssCount + sCount + ksCount + stsCount;
    const diff = numStudents - totalCount;
    sCount += diff;

    // Calculate rounded average (SS=4, S=3, KS=2, STS=1)
    const avgScore = ((ssCount * 4) + (sCount * 3) + (ksCount * 2) + (stsCount * 1)) / numStudents;
    const scoreFormatted = parseFloat(avgScore.toFixed(2));

    return {
      name: `Butir ${idx + 1}`,
      fullText: q.teksPertanyaan,
      "Rata-Rata Skor": scoreFormatted,
      "Sangat Setuju": ssCount,
      "Setuju": sCount,
      "Kurang Setuju": ksCount,
      "Sangat Tidak Setuju": stsCount,
    };
  });

  // Calculate scores per student to find category distributions
  let sangatBaikCount = 0;
  let baikCount = 0;
  let cukupCount = 0;
  let kurangCount = 0;

  for (let s = 0; s < numStudents; s++) {
    let studentScore = 0;
    questions.forEach((q, idx) => {
      const details = questionDetails[idx];
      const roll = pseudoRandom();
      const pctSS = details["Sangat Setuju"] / numStudents;
      const pctS = pctSS + (details["Setuju"] / numStudents);
      const pctKS = pctS + (details["Kurang Setuju"] / numStudents);

      if (roll < pctSS) studentScore += 4;
      else if (roll < pctS) studentScore += 3;
      else if (roll < pctKS) studentScore += 2;
      else studentScore += 1;
    });

    const maxScore = questions.length * 4;
    const pct = (studentScore / maxScore) * 100;

    if (pct >= 85) sangatBaikCount++;
    else if (pct >= 70) baikCount++;
    else if (pct >= 55) cukupCount++;
    else kurangCount++;
  }

  const categoryData = [
    { name: "Sangat Baik (≥85%)", value: sangatBaikCount, color: "#059669" }, // emerald-600
    { name: "Baik (70% - 84%)", value: baikCount, color: "#3b82f6" },       // blue-500
    { name: "Cukup Baik (55% - 69%)", value: cukupCount, color: "#f59e0b" },  // amber-500
    { name: "Perlu Bimbingan (<55%)", value: kurangCount, color: "#ef4444" }, // red-500
  ].filter(c => c.value > 0);

  return {
    numStudents,
    questionDetails,
    categoryData,
  };
};

export default function AsesmenMaker({
  initialTopic,
  initialBidang,
  savedAsesmen,
  onSavedAsesmenChange
}: AsesmenMakerProps) {
  // Inputs
  const [topikTema, setTopikTema] = useState("");
  const [bidangLayanan, setBidangLayanan] = useState("Pribadi");
  const [jenisAsesmen, setJenisAsesmen] = useState("Evaluasi Hasil & Refleksi Masukan");

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentAsesmen, setCurrentAsesmen] = useState<AsesmenData | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sub-navigation view modes
  const [subView, setSubView] = useState<"draft" | "simulation" | "analytics">("draft");

  // Simulation state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reflectiveAnswers, setReflectiveAnswers] = useState<Record<number, string>>({});
  const [simReport, setSimReport] = useState<any>(null);

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
      setError("Tema bimbingan diwajibkan.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCurrentAsesmen(null);
    setSubView("draft");
    setAnswers({});
    setReflectiveAnswers({});
    setSimReport(null);

    try {
      const response = await fetch("/api/generate-asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topikTema, bidangLayanan, jenisAsesmen })
      });

      if (!response.ok) {
        throw new Error("Gagal mengolah draf instrumen asesmen. Mohon coba sesaat lagi.");
      }

      const data: AsesmenData = await response.json();
      setCurrentAsesmen(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menghubungi sistem penyedia layanan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!currentAsesmen) return;
    const body = `
${currentAsesmen.judulAsesmen.toUpperCase()}
Petunjuk: ${currentAsesmen.petunjukPengisian}

PERNYATAAN / SKALA EVALUASI (1-4):
${currentAsesmen.pertanyaanSkala.map((ps, i) => `${i + 1}. ${ps.teksPertanyaan} 
   Pilihan: ${ps.pilihanSkala.join(" / ")}`).join("\n")}

PERTANYAAN TERBUKA / REFLEKTIF:
${currentAsesmen.pertanyaanTerbukaReflektif.map((pt, i) => `${i + 1}. ${pt}`).join("\n")}
    `;

    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!currentAsesmen) return;
    const toSave: AsesmenData = {
      ...currentAsesmen,
      id: "as_" + Date.now(),
      createdAt: new Date().toISOString()
    };
    onSavedAsesmenChange([toSave, ...savedAsesmen]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Simulation handlers
  const handleSelectAnswer = (qIdx: number, val: string) => {
    setAnswers({
      ...answers,
      [qIdx]: val
    });
  };

  const handleSelectReflective = (qIdx: number, val: string) => {
    setReflectiveAnswers({
      ...reflectiveAnswers,
      [qIdx]: val
    });
  };

  // Submit mock student answers to view feedback report
  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsesmen) return;

    // Tallies
    let totalScore = 0;
    const items = currentAsesmen.pertanyaanSkala;
    
    items.forEach((item, idx) => {
      const selected = answers[idx] || "Setuju";
      // Give scores based on choices (Sangat Setuju = 4, Setuju = 3, Kurang Setuju = 2, Sangat Tidak Setuju = 1)
      if (selected.includes("Sangat Setuju")) totalScore += 4;
      else if (selected.includes("Sangat Tidak Setuju")) totalScore += 1;
      else if (selected.includes("Kurang Setuju")) totalScore += 2;
      else totalScore += 3; // Setuju
    });

    const maxScore = items.length * 4;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Qualitative assessment
    let kesimpulanKualitatif = "Cukup Baik";
    let saranBimbingan = "Siswa menunjukkan pemahaman bimbingan yang memadai, namun memerlukan dorongan asertif untuk menerapkan nilai ini secara konsisten dalam interaksi harian mereka.";
    
    if (percentage >= 85) {
      kesimpulanKualitatif = "Sangat Baik & Matang";
      saranBimbingan = "Siswa telah menyerap materi bimbingan batin secara prima serta memiliki tekad perbaikan aksi yang matang. Sarankan siswa menjadi duta sebaya (peer guidance helper) untuk memotivasi seisi kelas.";
    } else if (percentage < 65) {
      kesimpulanKualitatif = "Perlu Pendampingan Khusus";
      saranBimbingan = "Skor menunjukkan keraguan atau kesulitan menyerap nilai inti dari topik ini. Direkomendasikan bagi Guru BK untuk melakukan sesi konseling kelompok kecil (small group counseling) draf evaluasi.";
    }

    setSimReport({
      skorTotal: totalScore,
      skorMaks: maxScore,
      persentase: percentage,
      kesimpulan: kesimpulanKualitatif,
      saran: saranBimbingan
    });
  };

  // Compute stats on active assessment
  const classStats = currentAsesmen ? generateClassStats(currentAsesmen) : null;

  // Compute individual chart data if simulation completed
  const studentChartData = currentAsesmen ? currentAsesmen.pertanyaanSkala.map((item, idx) => {
    const selected = answers[idx] || "Setuju";
    let score = 3;
    if (selected.includes("Sangat Setuju")) score = 4;
    else if (selected.includes("Sangat Tidak Setuju")) score = 1;
    else if (selected.includes("Kurang Setuju")) score = 2;

    return {
      name: `Butir ${idx + 1}`,
      "Skor Sikap": score,
      fullText: item.teksPertanyaan
    };
  }) : [];

  return (
    <div className="space-y-8 animate-fade-in no-print">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Form Parameter Panel */}
        <div className="w-full lg:w-5/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit space-y-6">
          <div className="border-b border-rose-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-rose-500" /> Kreator Asesmen & Angket
            </h2>
            <p className="text-xs text-slate-400 mt-1">Buat lembar evaluasi hasil layanan bimbingan klasikal ataupun kuesioner diagnosis siswa secara terarah.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs font-medium">
            {/* Bidang Layanan */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bidang Layanan</label>
              <select 
                value={bidangLayanan}
                onChange={(e) => setBidangLayanan(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
              >
                <option value="Pribadi">Pribadi</option>
                <option value="Sosial">Sosial</option>
                <option value="Belajar">Belajar</option>
                <option value="Karir">Karir</option>
                <option value="Keluarga">Keluarga</option>
              </select>
            </div>

            {/* Jenis Evaluasi */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Jenis Instrumen Asesmen</label>
              <select 
                value={jenisAsesmen}
                onChange={(e) => setJenisAsesmen(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
              >
                <option value="Evaluasi Hasil Layanan (Likert 4 Pilihan)">Evaluasi Hasil Layanan (Likert 4 Pilihan)</option>
                <option value="Kuesioner Diagnosis Mandiri Siswa (Self-Assessment)">Angket Diagnosis Mandiri Siswa (Self-Assessment)</option>
                <option value="Lembar Komitmen Bulanan & Rencana Aksi">Lembar Komitmen Tindakan & Rencana Aksi (Action Plan)</option>
              </select>
            </div>

            {/* Tema / Topik */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tema / Topik Bimbingan <span className="text-red-500">*</span></label>
              <textarea 
                rows={3}
                value={topikTema}
                onChange={(e) => setTopikTema(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 font-normal"
                placeholder="Misal: 'Pentingnya Menjaga Tata Krama & Sopan Santun Sosial'"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isGenerating || !topikTema}
              className={`w-full py-3 px-4 rounded-lg font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isGenerating || !topikTema
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
                  <span>Merumuskan Indikator Soal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Rancang Instrumen Evaluasi</span>
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

          {/* Tips Guru BK */}
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-lg text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-rose-800 flex items-center gap-1">
              <Info className="w-4 h-4 text-rose-500" /> Tips Evaluasi Hasil:
            </span>
            <p className="leading-relaxed">
              Instrumen evaluasi menggunakan format 4 pilihan Skala Sikap (Sangat Setuju hingga Sangat Tidak Setuju) untuk menghindari kecenderungan siswa memilih jawaban netral yang bias.
            </p>
          </div>
        </div>

        {/* Right Preview, Simulation & Recharts Panel */}
        <div className="w-full lg:w-7/12 flex flex-col min-h-[480px]">
          {isGenerating ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                <HelpCircle className="w-6 h-6 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className="font-bold text-slate-700 text-sm">Menyusun Butir Asesmen</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistem sedang menyusun draf petunjuk pengerjaan yang ramah remaja, merakit butir-butir kuantitatif berjenjang (Skala Likert), dan menulis kuesioner kualitatif terbuka.
                </p>
              </div>
            </div>
          ) : currentAsesmen ? (
            <div className="space-y-4">
              
              {/* Operations Bar */}
              <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl p-3 shadow-md flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500 p-1 px-2 rounded font-extrabold uppercase tracking-wider text-[10px]">Asesmen</span>
                  <span className="font-semibold line-clamp-1 truncate max-w-[180px]">{currentAsesmen.judulAsesmen}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1 px-2 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-rose-450" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-1 px-2 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5 text-rose-450" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-white rounded-t-xl p-1 pb-0">
                <button
                  type="button"
                  onClick={() => setSubView("draft")}
                  className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                    subView === "draft" ? "border-rose-500 text-rose-700 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Draf Kuesioner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubView("simulation")}
                  className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                    subView === "simulation" ? "border-rose-500 text-rose-700 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Simulasi Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubView("analytics")}
                  className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                    subView === "analytics" ? "border-rose-500 text-rose-700 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LucideBarChart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Analisis Agregat Kelas</span>
                </button>
              </div>

              {/* VIEW 1: Formal assessment draft sheet */}
              {subView === "draft" && (
                <div className="bg-white border border-slate-200 rounded-b-xl p-6 shadow-sm text-xs leading-relaxed space-y-5">
                  {/* Assessment Header */}
                  <div className="text-center border-b border-slate-100 pb-3 space-y-1">
                    <h3 className="text-base font-extrabold text-slate-800 uppercase">{currentAsesmen.judulAsesmen}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Format BK Klasikal • Bidang Layanan: {bidangLayanan}</p>
                  </div>

                  {/* Instructions */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-0.5">📋 Petunjuk Pengisian:</span>
                    <p className="text-slate-600 italic leading-relaxed">{currentAsesmen.petunjukPengisian}</p>
                  </div>

                  {/* Quantitative Scale questions */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-[11px] tracking-wider uppercase text-slate-800 border-b border-slate-100 pb-1">Bagian I: Evaluasi Sikap & Pemahaman (Likert)</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-left">
                          <th className="py-2 pl-2 w-3/5 font-bold uppercase tracking-wider text-[10px]">Butir Pernyataan Evaluasi</th>
                          <th className="py-2 text-center w-2/5 font-bold uppercase tracking-wider text-[10px]">Skala Sikap / Pilihan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentAsesmen.pertanyaanSkala.map((item, id) => (
                          <tr key={id} className="border-b border-slate-100 font-medium">
                            <td className="py-3 pl-2 text-slate-700 flex items-start gap-1.5 pr-3">
                              <span className="font-bold text-slate-400">{id + 1}.</span>
                              <span className="leading-normal">{item.teksPertanyaan}</span>
                            </td>
                            <td className="py-3 text-center">
                              <div className="inline-flex gap-1 flex-wrap justify-center text-[9px] font-bold">
                                {item.pilihanSkala.map((s, sIdx) => (
                                  <span key={sIdx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] whitespace-nowrap">
                                    {s.split(" ")[0]}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Reflective qualitative questions */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-extrabold text-[11px] tracking-wider uppercase text-slate-800 border-b border-slate-100 pb-1">Bagian II: Pertanyaan Refleksi & Komitmen</h4>
                    <div className="space-y-3">
                      {currentAsesmen.pertanyaanTerbukaReflektif.map((pt, id) => (
                        <div key={id} className="p-3 bg-slate-50/50 rounded border border-slate-100 space-y-1.5">
                          <p className="font-semibold text-slate-700">{id + 1}. {pt}</p>
                          <div className="h-10 border border-slate-200 bg-white rounded-lg border-dashed" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: Student view emulation dashboard with individual Recharts visualization */}
              {subView === "simulation" && (
                <div className="space-y-4">
                  {simReport ? (
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 shadow-xl space-y-6 animate-fade-in">
                      
                      {/* Individual Report Head */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 bg-emerald-650 bg-emerald-700 rounded-full text-white">
                            <Award className="w-5 h-5 animate-pulse" />
                          </span>
                          <div>
                            <h4 className="font-bold text-sm">Laporan Hasil Refleksi Siswa (Individu)</h4>
                            <p className="text-[10px] text-slate-400">Analisis profil pemahaman siswa terhadap bimbingan klasikal.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSimReport(null)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded transition-colors font-bold cursor-pointer text-slate-250 border border-slate-700"
                        >
                          Isi Ulang
                        </button>
                      </div>

                      {/* Content metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
                          <p className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Indeks Penyerapan</p>
                          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{simReport.persentase}%</p>
                        </div>
                        <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
                          <p className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Nilai Kuesioner</p>
                          <p className="text-xl font-bold text-white mt-1.5">{simReport.skorTotal} / {simReport.skorMaks} Poin</p>
                        </div>
                        <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 col-span-2 md:col-span-1">
                          <p className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Predikat Sikap</p>
                          <p className="text-xs font-bold text-amber-400 mt-2 uppercase tracking-wide">{simReport.kesimpulan}</p>
                        </div>
                      </div>

                      {/* Visualisasi Recharts untuk Hasil Individu */}
                      <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                            <LucideBarChart className="w-4 h-4 text-emerald-400" /> Profil Skor Jawaban Per-Indikator
                          </h5>
                          <span className="text-[10px] text-slate-400">Skalasi: 1 (Rendah) s.d 4 (Prima)</span>
                        </div>
                        <div className="h-44 w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studentChartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                              <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} stroke="#9ca3af" fontSize={10} tickLine={false} />
                              <RechartsTooltip content={<IndividualTooltip />} cursor={{ fill: "#1f2937", opacity: 0.4 }} />
                              <Bar 
                                dataKey="Skor Sikap" 
                                fill="#10b981" 
                                radius={[4, 4, 0, 0]} 
                                maxBarSize={32}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 italic text-center">Arahkan kursor / sentuh batang grafik untuk melihat butir pertanyaan lengkap.</p>
                      </div>

                      {/* Qualitative insight guidance */}
                      <div className="p-4 bg-slate-850 rounded-lg space-y-2 border-l-4 border-emerald-500">
                        <span className="font-bold text-xs block text-emerald-400">Rekomendasi Tindak Lanjut Guru BK:</span>
                        <p className="text-xs text-slate-300 leading-relaxed text-justify">
                          {simReport.saran}
                        </p>
                      </div>

                      <p className="text-[9px] text-center text-slate-500">
                        *Laporan ini dirancang untuk dicetak secara instan sebagai bagian lampiran pengarsipan proses bimbingan siswa.
                      </p>
                    </div>
                  ) : (
                    /* The Questionnaire Form for simulation */
                    <form onSubmit={handleSimulateSubmit} className="bg-white border border-slate-200 rounded-b-xl p-6 shadow-sm text-xs leading-relaxed space-y-6">
                      
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800">Emulasi Angket Siswa</h3>
                          <p className="text-[10px] text-slate-400">Kerjakan kuesioner ini seakan Anda adalah murid di dalam kelas BK Klasikal.</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <User className="w-3" /> Peran: Siswa
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-5">
                        <span className="font-extrabold tracking-wider text-slate-800 uppercase block border-b border-slate-100 pb-1">Pilihlah salah satu opsi:</span>
                        {currentAsesmen.pertanyaanSkala.map((item, idx) => (
                          <div key={idx} className="space-y-2.5">
                            <p className="font-bold text-slate-700 leading-normal">{idx + 1}. {item.teksPertanyaan}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {item.pilihanSkala.map((opt, oIdx) => {
                                const isSelected = answers[idx] === opt;
                                return (
                                  <button 
                                    type="button"
                                    key={oIdx}
                                    onClick={() => handleSelectAnswer(idx, opt)}
                                    className={`p-2.5 rounded-lg border text-[10px] font-medium text-center cursor-pointer transition-all ${
                                      isSelected 
                                        ? "bg-slate-900 border-slate-900 text-white font-bold shadow-sm" 
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reflective input fields */}
                      <div className="space-y-4 pt-3 border-t border-slate-105 border-t-slate-100">
                        <span className="font-extrabold tracking-wider text-slate-800 uppercase block border-b border-slate-100 pb-1">Tulis tanggapan tertulis singkat Anda:</span>
                        {currentAsesmen.pertanyaanTerbukaReflektif.map((ptItem, idx) => (
                          <div key={idx} className="space-y-2">
                            <label className="font-bold text-slate-700 block">{idx + 1}. {ptItem}</label>
                            <textarea 
                              rows={2}
                              value={reflectiveAnswers[idx] || ""}
                              onChange={(e) => handleSelectReflective(idx, e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal"
                              placeholder="Tulis opini, perasaan nyata, atau komitmen tindakan konkret Anda di sini..."
                            />
                          </div>
                        ))}
                      </div>

                      {/* Submit Simulation */}
                      <button
                        type="submit"
                        className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white rounded-lg font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
                      >
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span>Kirim Angket & Analisis Indikator (Guru BK)</span>
                      </button>

                    </form>
                  )}
                </div>
              )}

              {/* VIEW 3: Recharts Class-wide Aggregate Dashboard Analytics (THE RECHARTS IMPLEMENTATION) */}
              {subView === "analytics" && classStats && (
                <div className="bg-white border border-slate-200 rounded-b-xl p-6 shadow-sm text-xs leading-relaxed space-y-6 animate-fade-in">
                  
                  {/* Dashboard Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-850 flex items-center gap-1.5">
                        <TrendingUp className="w-5 h-5 text-emerald-700" /> Analisis Evaluasi Kohort Kelas (Agregat)
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">Berdasarkan data umpan balik 36 siswa pasca-layanan</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="p-1 px-2.5 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[10px] border border-emerald-100">
                        Peserta: {classStats.numStudents} Siswa
                      </span>
                      <span className="p-1 px-2.5 bg-blue-50 text-blue-800 rounded-full font-bold text-[10px] border border-blue-100">
                        Partisipasi: 100%
                      </span>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    {/* CHART A: Item Indices (Bar Chart) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide">
                          Rata-Rata Indeks Persetujuan
                        </h5>
                        <p className="text-[10px] text-slate-400">Skor rata-rata per butir pernyataan bimbingan (Skala 1.0 - 4.0)</p>
                      </div>

                      <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={classStats.questionDetails} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                            <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} stroke="#64748b" fontSize={9} tickLine={false} />
                            <RechartsTooltip content={<ClassAverageTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.6 }} />
                            <Bar 
                              dataKey="Rata-Rata Skor" 
                              fill="#0d9488" // teal-600
                              radius={[4, 4, 0, 0]} 
                              maxBarSize={30}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[9px] text-slate-400 text-center italic mt-1">Arahkan kursor ke tiap batang untuk melihat butir dan rincian pilihan siswa.</p>
                    </div>

                    {/* CHART B: Category Distributions (Pie Chart) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide">
                          Tingkat Kematangan Sikap Siswa
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium">Segmentasi pemahaman kualitatif keseluruhan kelas</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        {/* Pie Chart display */}
                        <div className="h-32 w-32 relative flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={classStats.categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={28}
                                outerRadius={46}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {classStats.categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value) => [`${value} siswa`, 'Jumlah']} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legends with Custom metrics */}
                        <div className="space-y-1.5 w-full text-[10px]">
                          {classStats.categoryData.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="font-bold text-slate-600 truncate max-w-[100px]">{cat.name.split(" ")[0]} {cat.name.includes("Sangat") ? "Sangat Baik" : ""}</span>
                              </div>
                              <span className="font-bold text-slate-800">{cat.value} siswa ({Math.round((cat.value / 36) * 100)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 font-medium p-2 bg-white rounded text-center border border-slate-100">
                        Mayoritas kelas berada pada kategori <b>{classStats.categoryData[0]?.name.split(" ")[0]}</b>.
                      </div>
                    </div>

                  </div>

                  {/* ANALYTICS CONCLUSION & CLINICAL INTERVENTION RECOMMENDATIONS */}
                  <div className="bg-emerald-50 bg-opacity-20 border border-emerald-100 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5 leading-none">
                      <Award className="w-4 h-4 text-emerald-700" /> Interpretasi Program Kerja Guru BK (Rencana Tindak Lanjut)
                    </h5>
                    
                    <div className="space-y-2 text-slate-700 text-xs">
                      <p className="text-justify leading-relaxed">
                        Data agregat di atas menunjukkan tingkat keberhasilan program klasikal Anda pada tema <b>"{topikTema}"</b> telah terserap dengan baik. Berikut poin taktis pendampingan jangka pendek:
                      </p>
                      
                      <ul className="space-y-2 pl-2">
                        {classStats.questionDetails.map((item, idx) => {
                          const rating = item["Rata-Rata Skor"];
                          let recommendation = "";
                          let isUrgent = false;

                          if (rating >= 3.4) {
                            recommendation = `Butir ${idx + 1} (${rating}) mendapatkan respon prima. Berikan penguatan berkelanjutan lewat wali kelas.`;
                          } else if (rating >= 3.0) {
                            recommendation = `Butir ${idx + 1} (${rating}) dinilai cukup. Perlu pengawasan perilaku berkala di jam istirahat.`;
                          } else {
                            recommendation = `Butir ${idx + 1} (${rating}) memiliki nilai paling kritis. Direkomendasikan melakukan re-bimbingan pada sub-bahasan ini!`;
                            isUrgent = true;
                          }

                          return (
                            <li key={idx} className="flex items-start gap-2 text-[11px]">
                              <span className={`p-1 px-1.5 rounded-md font-bold text-[9px] ${
                                isUrgent ? "bg-red-150 text-red-750 bg-red-105 bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {item.name}
                              </span>
                              <div className="leading-relaxed">
                                <span className="font-extrabold text-slate-800">{item.fullText}: </span>
                                <span>{recommendation}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <span className="p-3.5 bg-slate-50 rounded-full text-slate-400">
                <Clipboard className="w-8 h-8 text-slate-300" />
              </span>
              <div className="space-y-1 max-w-sm">
                <p className="font-bold text-slate-600">Instrumen Belum Anggun</p>
                <p className="text-xs leading-relaxed">
                  Pilih topik dan tentukan parameter di sebelah kiri, lalu klik <b>"Rancang Instrumen Evaluasi"</b> untuk memeras butir kuesioner dan kuis kesadaran siswa.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Previously generated cards list */}
      {savedAsesmen.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-md font-bold text-slate-800">Daftar Angket & Asesmen Tersimpan</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedAsesmen.map((as) => (
              <div 
                key={as.id}
                onClick={() => {
                  setCurrentAsesmen(as);
                  setSubView("draft");
                }}
                className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow hover:border-emerald-300 hover:bg-emerald-50/5 transition-all text-xs cursor-pointer space-y-2"
              >
                <span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-700 bg-orange-500 rounded text-[9px] font-extrabold uppercase text-orange-850">
                  {as.pertanyaanSkala.length} Butir Likert
                </span>
                <h4 className="font-bold text-slate-800 line-clamp-1">{as.judulAsesmen}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2">{as.petunjukPengisian}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
