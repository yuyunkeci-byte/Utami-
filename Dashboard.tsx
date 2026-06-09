import React, { useState } from "react";
import { PREDEFINED_TOPICS } from "../data";
import { PredefinedTopic } from "../types";
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  HelpCircle, 
  Search, 
  Smile, 
  Share2, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Brain,
  Compass,
  GraduationCap,
  Heart
} from "lucide-react";

interface DashboardProps {
  onSelectTopic: (topic: PredefinedTopic) => void;
  stats: {
    totalRPL: number;
    totalIcebreakers: number;
    totalMateri: number;
    totalAsesmen: number;
  };
}

export default function Dashboard({ onSelectTopic, stats }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBidangFilter, setActiveBidangFilter] = useState<string>("Semua");

  const filterBidangs = ["Semua", "Pribadi", "Sosial", "Belajar", "Karir", "Keluarga"];

  const filteredTopics = PREDEFINED_TOPICS.filter((topic) => {
    const matchesSearch = 
      topic.topik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.sasaranKelas.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBidang = activeBidangFilter === "Semua" || topic.bidang === activeBidangFilter;

    return matchesSearch && matchesBidang;
  });

  const getBidangStyles = (bidang: string) => {
    switch (bidang) {
      case "Pribadi":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          badge: "bg-red-100 text-red-800",
          icon: <Brain className="w-5 h-5 text-red-600" />
        };
      case "Sosial":
        return {
          bg: "bg-orange-50 text-orange-700 border-orange-200",
          badge: "bg-orange-100 text-orange-800",
          icon: <Users className="w-5 h-5 text-orange-600" />
        };
      case "Belajar":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          badge: "bg-blue-100 text-blue-800",
          icon: <Smile className="w-5 h-5 text-blue-600" />
        };
      case "Karir":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          badge: "bg-emerald-100 text-emerald-800",
          icon: <Compass className="w-5 h-5 text-emerald-600" />
        };
      case "Keluarga":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          badge: "bg-rose-100 text-rose-800",
          icon: <Heart className="w-5 h-5 text-rose-600" />
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          badge: "bg-slate-100 text-slate-800",
          icon: <BookOpen className="w-5 h-5 text-slate-600" />
        };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-450 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 C30,40 70,60 100,0 L100,100 Z" fill="white" />
          </svg>
        </div>
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full border border-white/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Asisten Guru BK Digital
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans">
            Solusi Praktis Layanan Bimbingan Klasikal
          </h1>
          <p className="text-rose-50 text-sm md:text-base font-normal leading-relaxed">
            Selamat datang di Workspace BK Klasikal! Rancang Rencana Pelaksanaan Layanan (RPL BK 1 Lembar) secara terpadu, buat icebreaker seru berdampak moral, susun materi presentasi kelas menarik, serta instrumen evaluasi bimbingan secara instan.
          </p>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-rose-100/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total RPL Disimpan</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalRPL}</h3>
            </div>
            <span className="p-2.5 bg-rose-50 rounded-lg text-rose-500">
              <BookOpen className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Daftar RPL bimbingan aktif</p>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Koleksi Icebreaker</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalIcebreakers}</h3>
            </div>
            <span className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <Sparkles className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Permainan kelas adaptif</p>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Bahan Ajar Siap</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalMateri}</h3>
            </div>
            <span className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Smile className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Slide presentasi & studi kasus</p>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Asesmen Terdaftar</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalAsesmen}</h3>
            </div>
            <span className="p-2.5 bg-orange-50 rounded-lg text-orange-600">
              <HelpCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Kuesioner & Angket BK</p>
        </div>
      </div>

      {/* Guide & Concepts */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-rose-500" /> Mengenal 5 Bidang Layanan BK Klasikal
        </h2>
        <div className="grid md:grid-cols-5 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 space-y-1">
            <span className="font-bold text-red-800 block">1. Pribadi</span>
            <p className="text-red-700 leading-relaxed">Fokus pada pengenalan potensi diri, konsep diri positif, regulasi emosi, kepercayaan diri, kebiasaan baik, dan kerohanian.</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 space-y-1">
            <span className="font-bold text-orange-800 block">2. Sosial</span>
            <p className="text-orange-700 leading-relaxed">Membangun hubungan asertif dangan sesama, resolusi konflik/bullying, sopan santun budaya, tanggung jawab sosial, dan internet sehat.</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 space-y-1">
            <span className="font-bold text-blue-800 block">3. Belajar</span>
            <p className="text-blue-700 leading-relaxed">Peningkatan motivasi akademik, mengatasi rasa malas belajar, kesiapan ujian, pengenalan gaya belajar, serta efisiensi belajar mandiri.</p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 space-y-1">
            <span className="font-bold text-emerald-800 block">4. Karir</span>
            <p className="text-emerald-700 leading-relaxed">Eksplorasi pilihan studi lanjut (SMA vs SMK), dunia kerja, cita-cita, penjurusan, minat bakat, dan Holland RIASEC Code.</p>
          </div>
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-100 space-y-1">
            <span className="font-bold text-rose-800 block">5. Keluarga</span>
            <p className="text-rose-700 leading-relaxed">Meningkatkan keselarasan hubungan keluarga, pemeliharaan komunikasi asertif anak-orangtua, dan mengatasi tantangan domestik.</p>
          </div>
        </div>
      </div>

      {/* Preset Library Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-500" /> Pustaka Topik Klasikal Populer
            </h2>
            <p className="text-sm text-slate-500 mt-1">Pilih salah satu topik standar dan langsung jadikan rancangan RPL otomatis secara instan.</p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari topik bimbingan..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-450 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex flex-wrap gap-2 pb-1">
          {filterBidangs.map((bidang) => (
            <button
              key={bidang}
              onClick={() => setActiveBidangFilter(bidang)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                activeBidangFilter === bidang
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {bidang === "Semua" ? "✨ Semua Bidang" : bidang}
            </button>
          ))}
        </div>

        {/* Preset Layout Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => {
              const styles = getBidangStyles(topic.bidang);
              return (
                <div 
                  key={topic.id}
                  className="flex flex-col bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group overflow-hidden"
                >
                  {/* Decorative indicator block */}
                  <div className={`h-1.5 w-full ${
                    topic.bidang === "Pribadi" ? "bg-red-500" :
                    topic.bidang === "Sosial" ? "bg-orange-500" :
                    topic.bidang === "Belajar" ? "bg-blue-500" :
                    topic.bidang === "Karir" ? "bg-emerald-500" :
                    topic.bidang === "Keluarga" ? "bg-rose-500" : "bg-slate-500"
                  }`} />
                  
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Bidang Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${styles.badge}`}>
                          {styles.icon} {topic.bidang}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Users className="w-3 h-3" /> {topic.sasaranKelas}
                        </span>
                      </div>
                      
                      {/* Title & Desc */}
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-rose-600 transition-colors line-clamp-1">
                        {topic.topik}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {topic.deskripsi}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {topic.estimasiWaktu}
                      </span>
                      <button 
                        onClick={() => onSelectTopic(topic)}
                        className="inline-flex items-center gap-1 font-bold text-rose-500 hover:text-rose-700 hover:underline transition-colors cursor-pointer group-hover:translate-x-1 duration-200"
                      >
                        Pilih Modul <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white border border-dashed border-slate-200 rounded-xl space-y-3">
              <span className="p-3 bg-slate-50 rounded-full text-slate-400">
                <Search className="w-6 h-6" />
              </span>
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Topik Tidak Ditemukan</p>
                <p className="text-xs text-slate-400 max-w-sm">Coba masukkan kata kunci yang berbeda seperti 'Bullying', 'Studi', atau 'Komunikasi'.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
