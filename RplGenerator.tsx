import React, { useState, useEffect } from "react";
import { RPLData, RPLTemplate } from "../types";
import { jsPDF } from "jspdf";
import { 
  BookOpen, 
  Sparkles, 
  Printer, 
  Copy, 
  Save, 
  Edit3, 
  Check, 
  RotateCcw, 
  Trash2, 
  ArrowRight, 
  FileText,
  AlertCircle,
  Download,
  Bookmark,
  LayoutTemplate
} from "lucide-react";

interface RplGeneratorProps {
  selectedTopicText: string;
  selectedBidang: string;
  onSavedRplsChange: (rpls: RPLData[]) => void;
  savedRpls: RPLData[];
  onTriggerSiblingModule: (module: "materi" | "icebreaker" | "asesmen", topic: string, bidang: string) => void;
}

export default function RplGenerator({ 
  selectedTopicText, 
  selectedBidang, 
  onSavedRplsChange, 
  savedRpls,
  onTriggerSiblingModule
}: RplGeneratorProps) {
  // Form states
  const [sekolah, setSekolah] = useState("SMP Negeri 1 Jakarta");
  const [kelas, setKelas] = useState("Kelas VII");
  const [semester, setSemester] = useState("1 (Ganjil)");
  const [bidangLayanan, setBidangLayanan] = useState("Pribadi");
  const [topikTema, setTopikTema] = useState("");
  const [alokasiWaktu, setAlokasiWaktu] = useState("1 JP (40 Menit)");
  const [metodeLayanan, setMetodeLayanan] = useState("Diskusi Kelompok, Ceramah, & Tanya Jawab");
  const [mediaAlat, setMediaAlat] = useState("LCD Proyektor, Slide Presentasi, Lembar Kerja Siswa");

  // App States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [currentRpl, setCurrentRpl] = useState<RPLData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Template States
  const [templates, setTemplates] = useState<RPLTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Load templates on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem("bk_rpl_templates");
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Gagal membaca templates dari LocalStorage:", e);
      }
    } else {
      // Provide standard defaults
      const defaultTemplates: RPLTemplate[] = [
        {
          id: "tpl_default_smp",
          name: "Template Standar SMP N 1",
          sekolah: "SMP Negeri 1 Jakarta",
          kelas: "Kelas VII",
          semester: "1 (Ganjil)",
          bidangLayanan: "Pribadi",
          alokasiWaktu: "1 JP (40 Menit)",
          metodeLayanan: "Diskusi Kelompok, Ceramah, & Tanya Jawab",
          mediaAlat: "LCD Proyektor, Slide Presentasi, Lembar Kerja Siswa",
          createdAt: new Date().toISOString()
        }
      ];
      setTemplates(defaultTemplates);
      localStorage.setItem("bk_rpl_templates", JSON.stringify(defaultTemplates));
    }
  }, []);

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const newTemplate: RPLTemplate = {
      id: "tpl_" + Date.now(),
      name: templateName.trim(),
      sekolah,
      kelas,
      semester,
      bidangLayanan,
      alokasiWaktu,
      metodeLayanan,
      mediaAlat,
      topikTema,
      createdAt: new Date().toISOString()
    };

    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    localStorage.setItem("bk_rpl_templates", JSON.stringify(updated));
    setTemplateName("");
    setIsSavingTemplate(false);
    setTemplateSuccess(true);
    setSelectedTemplateId(newTemplate.id);
    setTimeout(() => setTemplateSuccess(false), 3000);
  };

  const handleLoadTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      setSekolah(tpl.sekolah);
      setKelas(tpl.kelas);
      setSemester(tpl.semester);
      setBidangLayanan(tpl.bidangLayanan);
      setAlokasiWaktu(tpl.alokasiWaktu);
      setMetodeLayanan(tpl.metodeLayanan);
      setMediaAlat(tpl.mediaAlat);
      if (tpl.topikTema) {
        setTopikTema(tpl.topikTema);
      }
    }
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("bk_rpl_templates", JSON.stringify(updated));
    if (selectedTemplateId === id) {
      setSelectedTemplateId("");
    }
  };

  // Pre-fill when user selects a preset topic from the Dashboard
  useEffect(() => {
    if (selectedTopicText) {
      setTopikTema(selectedTopicText);
    }
    if (selectedBidang) {
      setBidangLayanan(selectedBidang);
    }
  }, [selectedTopicText, selectedBidang]);

  // Generate RPL using AI
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topikTema) {
      setGenerationError("Silakan isi Tema / Topik bimbingan terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setCurrentRpl(null);
    setSavedSuccess(false);

    try {
      const response = await fetch("/api/generate-rpl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sekolah,
          kelas,
          semester,
          bidangLayanan,
          topikTema,
          alokasiWaktu,
          metodeLayanan,
          mediaAlat
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || "Gagal menghubungi server.");
      }

      const data: RPLData = await response.json();
      setCurrentRpl(data);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gagal menyusun RPL otomatis. Silakan coba kembali beberapa saat lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy RPL Text to Clipboard (Formatted for Word copy-paste)
  const copyToClipboard = () => {
    if (!currentRpl) return;

    const rplText = `
RENCANA PELAKSANAAN LAYANAN (RPL)
BIMBINGAN KLASIKAL SEMESTER ${currentRpl.semester.toUpperCase()}

1. IDENTITAS LAYANAN
- Sekolah: ${currentRpl.sekolah}
- Kelas: ${currentRpl.kelas}
- Bidang Layanan: ${currentRpl.bidangLayanan}
- Topik / Tema: ${currentRpl.topikTema}
- Alokasi Waktu: ${currentRpl.alokasiWaktu}
- Metode Layanan: ${currentRpl.metodeLayanan}
- Media / Alat: ${currentRpl.mediaAlat}

2. TUJUAN LAYANAN
- Tujuan Umum: ${currentRpl.tujuanUmum}
- Tujuan Khusus:
  ${currentRpl.tujuanKhusus.map((tk, idx) => `${idx + 1}. ${tk}`).join("\n  ")}

3. LANGKAH-LANGKAH KEGIATAN
- Tahap Pendahuluan:
  ${currentRpl.kegiatanPendahuluan.map((kp, idx) => `- ${kp}`).join("\n  ")}
- Tahap Inti:
  ${currentRpl.kegiatanInti.map((ki, idx) => `- ${ki}`).join("\n  ")}
- Tahap Penutup:
  ${currentRpl.kegiatanPenutup.map((kp, idx) => `- ${kp}`).join("\n  ")}

4. EVALUASI DAN TINDAK LANJUT
- Evaluasi Proses:
  ${currentRpl.evaluasiProses.map((ep, idx) => `- ${ep}`).join("\n  ")}
- Evaluasi Hasil:
  ${currentRpl.evaluasiHasil.map((eh, idx) => `- ${eh}`).join("\n  ")}
- Sumber Bahan: ${currentRpl.sumberBahan}

Jakarta, ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
Mengetahui,
Kepala Sekolah                     Guru Bimbingan dan Konseling
    `;

    navigator.clipboard.writeText(rplText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save RPL locally in the browser
  const saveToLibrary = () => {
    if (!currentRpl) return;
    const itemToSave: RPLData = {
      ...currentRpl,
      id: currentRpl.id || "rpl_" + Date.now(),
      createdAt: currentRpl.createdAt || new Date().toISOString()
    };

    // Prevent duplicate entries of the same item if saved multiple times
    const existsIndex = savedRpls.findIndex((r) => r.id === itemToSave.id);
    let updated: RPLData[] = [];
    if (existsIndex > -1) {
      updated = [...savedRpls];
      updated[existsIndex] = itemToSave;
    } else {
      updated = [itemToSave, ...savedRpls];
    }

    onSavedRplsChange(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete an RPL from the library
  const deleteRpl = (id: string) => {
    const updated = savedRpls.filter((r) => r.id !== id);
    onSavedRplsChange(updated);
    if (currentRpl?.id === id) {
      setCurrentRpl(null);
    }
  };

  // Generate a clean, official, and professionally designed PDF file using jsPDF
  const generatePDF = () => {
    if (!currentRpl) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const margin = 15;
    const printWidth = 210 - (2 * margin); // 180mm
    const pageHeight = 297;
    let currentY = 15;

    const ensureSpace = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
    };

    // Set font to professional 'times' (similar to official government/academic documents in ID)
    doc.setFont("times", "normal");

    // 1. Document Main Title
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    const titleLine1 = "RENCANA PELAKSANAAN LAYANAN (RPL)";
    const titleLine1W = doc.getTextWidth(titleLine1);
    doc.text(titleLine1, (210 - titleLine1W) / 2, currentY);
    currentY += 5.5;

    doc.setFontSize(11);
    const titleLine2 = `BIMBINGAN KLASIKAL SEMESTER ${currentRpl.semester.toUpperCase()}`;
    const titleLine2W = doc.getTextWidth(titleLine2);
    doc.text(titleLine2, (210 - titleLine2W) / 2, currentY);
    currentY += 5;

    // Divider Line (Under Title Header)
    doc.setLineWidth(0.6);
    doc.setDrawColor(31, 41, 55); // slate-800
    doc.line(margin, currentY, 210 - margin, currentY);
    currentY += 6;

    // 2. Metadata Grid (Key-Value)
    const metadataList = [
      { key: "Sekolah", value: currentRpl.sekolah },
      { key: "Sasaran / Kelas", value: currentRpl.kelas },
      { key: "Bidang Layanan", value: currentRpl.bidangLayanan },
      { key: "Topik / Tema", value: currentRpl.topikTema },
      { key: "Alokasi Waktu", value: currentRpl.alokasiWaktu },
      { key: "Metode Layanan", value: currentRpl.metodeLayanan },
      { key: "Media & Alat", value: currentRpl.mediaAlat }
    ];

    doc.setFontSize(10);
    metadataList.forEach((item) => {
      ensureSpace(8);
      // Key label in bold
      doc.setFont("times", "bold");
      doc.text(item.key, margin, currentY);
      doc.text(":", margin + 35, currentY);

      // Body text in normal font (supports multi-line wrapping inside the grid width)
      doc.setFont("times", "normal");
      const wrappedVal = doc.splitTextToSize(item.value, printWidth - 38);
      for (let i = 0; i < wrappedVal.length; i++) {
        ensureSpace(5);
        doc.text(wrappedVal[i], margin + 38, currentY);
        if (i < wrappedVal.length - 1) {
          currentY += 5;
        }
      }
      currentY += 6;
    });

    currentY += 2; // Extra padding

    // 3. Custom Sections drawing utilities
    const drawSectionHeader = (sectTitle: string) => {
      ensureSpace(12);
      // Filled decorative banner background
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, currentY, printWidth, 6, "F");

      // Solid emerald edge border
      doc.setFillColor(4, 120, 87); // emerald-700
      doc.rect(margin, currentY, 1.2, 6, "F");

      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39); // slate-900
      doc.text(sectTitle, margin + 4, currentY + 4.3);

      doc.setTextColor(0, 0, 0); // reset color back to black
      currentY += 10;
    };

    const drawListItems = (items: string[]) => {
      items.forEach((item) => {
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        const wrapped = doc.splitTextToSize(item, printWidth - 8);
        ensureSpace(wrapped.length * 5 + 1.5);

        // Draw custom list character
        doc.text("-", margin + 2, currentY);
        for (let i = 0; i < wrapped.length; i++) {
          doc.text(wrapped[i], margin + 6, currentY);
          currentY += 5;
        }
        currentY += 1;
      });
      currentY += 2;
    };

    const drawParagraphItem = (headingLabel: string, textBody: string) => {
      const wrappedText = doc.splitTextToSize(textBody, printWidth);
      ensureSpace(wrappedText.length * 5 + 6);

      doc.setFont("times", "bold");
      doc.text(headingLabel, margin, currentY);
      currentY += 4.5;

      doc.setFont("times", "normal");
      for (let i = 0; i < wrappedText.length; i++) {
        ensureSpace(5);
        doc.text(wrappedText[i], margin + 3, currentY);
        currentY += 5;
      }
      currentY += 25; // padding below
    };

    // SECTION A
    drawSectionHeader("A. TUJUAN LAYANAN");
    
    // Tujuan Umum text
    const textTujuanUmum = currentRpl.tujuanUmum;
    const wrappedTujuanUmum = doc.splitTextToSize(textTujuanUmum, printWidth);
    ensureSpace(wrappedTujuanUmum.length * 5 + 6);
    doc.setFont("times", "bold");
    doc.text("1. Tujuan Umum:", margin, currentY);
    currentY += 4.5;
    doc.setFont("times", "normal");
    for (let i = 0; i < wrappedTujuanUmum.length; i++) {
      doc.text(wrappedTujuanUmum[i], margin + 3, currentY);
      currentY += 5;
    }
    currentY += 3;

    // Tujuan Khusus list
    ensureSpace(8);
    doc.setFont("times", "bold");
    doc.text("2. Tujuan Khusus:", margin, currentY);
    currentY += 4.5;
    drawListItems(currentRpl.tujuanKhusus);

    // SECTION B
    drawSectionHeader("B. LANGKAH-LANGKAH KEGIATAN");

    ensureSpace(8);
    doc.setFont("times", "bold");
    doc.text("1. Tahap Pendahuluan / Mulai (Opening)", margin, currentY);
    currentY += 4.5;
    drawListItems(currentRpl.kegiatanPendahuluan);

    ensureSpace(8);
    doc.setFont("times", "bold");
    doc.text("2. Tahap Inti / Kegiatan Utama (Body)", margin, currentY);
    currentY += 4.5;
    drawListItems(currentRpl.kegiatanInti);

    ensureSpace(8);
    doc.setFont("times", "bold");
    doc.text("3. Tahap Penutup / Refleksi Akhir (Closing)", margin, currentY);
    currentY += 4.5;
    drawListItems(currentRpl.kegiatanPenutup);

    // SECTION C
    drawSectionHeader("C. EVALUASI DAN TINDAK LANJUT");

    ensureSpace(8);
    doc.setFont("times", "bold");
    doc.text("1. Evaluasi Proses:", margin, currentY);
    currentY += 4.5;
    drawListItems(currentRpl.evaluasiProses);

    ensureSpace(8);
    doc.setFont("times", "bold");
    doc.text("2. Evaluasi Hasil:", margin, currentY);
    currentY += 4.5;
    drawListItems(currentRpl.evaluasiHasil);

    // Sumber / Pustaka
    const textSumber = currentRpl.sumberBahan;
    const wrappedSumber = doc.splitTextToSize(textSumber, printWidth);
    ensureSpace(wrappedSumber.length * 5 + 6);
    doc.setFont("times", "bold");
    doc.text("3. Sumber & Referensi Bahan:", margin, currentY);
    currentY += 4.5;
    doc.setFont("times", "normal");
    for (let i = 0; i < wrappedSumber.length; i++) {
      doc.text(wrappedSumber[i], margin + 3, currentY);
      currentY += 5;
    }
    currentY += 4;

    // 4. Academic/Official Signature Blocks
    ensureSpace(40);
    currentY += 6;

    const midPointX = 210 / 2;
    const textColLeft = margin + 8;
    const textColRight = midPointX + 8;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Mengetahui,", textColLeft, currentY);

    const regionPref = currentRpl.sekolah.split(" ")[0] || "Sekolah";
    const dateLine = `${regionPref}, ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}`;
    doc.text(dateLine, textColRight, currentY);
    currentY += 5.5;

    doc.text("Kepala Sekolah", textColLeft, currentY);
    doc.text("Guru Bimbingan dan Konseling", textColRight, currentY);

    // Height space before sign borders
    currentY += 18;
    ensureSpace(10);

    // Horizontal signature borderline
    doc.setLineWidth(0.25);
    doc.setDrawColor(156, 163, 175); // gray-400
    doc.line(textColLeft, currentY, textColLeft + 52, currentY);
    doc.line(textColRight, currentY, textColRight + 52, currentY);
    currentY += 4.5;

    doc.setFont("times", "bold");
    doc.text("NIP. .............................", textColLeft, currentY);
    doc.text("NIP. .............................", textColRight, currentY);

    // Download PDF directly from client browser
    const sanitizedTitle = currentRpl.topikTema.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`RPL_BK_1Lembar_${sanitizedTitle}.pdf`);
  };

  // Load an existing saved RPL for preview/editing
  const loadSavedRpl = (rpl: RPLData) => {
    setCurrentRpl(rpl);
    // Pre-fill forms so they can easily duplicate/edit
    setSekolah(rpl.sekolah);
    setKelas(rpl.kelas);
    setSemester(rpl.semester);
    setBidangLayanan(rpl.bidangLayanan);
    setTopikTema(rpl.topikTema);
    setAlokasiWaktu(rpl.alokasiWaktu);
    setMetodeLayanan(rpl.metodeLayanan);
    setMediaAlat(rpl.mediaAlat);
  };

  return (
    <div className="space-y-8 animate-fade-in no-print">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Side: RPL Generator Form */}
        <div className="w-full md:w-5/12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-fit space-y-6">
          <div className="border-b border-rose-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-500" /> Parameter RPL 1 Lembar
            </h2>
            <p className="text-xs text-slate-400 mt-1">Lengkapi parameter bimbingan di bawah ini untuk menghasilkan draf RPL otomatis.</p>
          </div>

          {/* Template Selection & Save Section */}
          <div className="bg-rose-50/10 border border-rose-100/60 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 leading-none">
                <Bookmark className="w-4 h-4 text-rose-500" /> Setelan Template Cepat
              </span>
              <button
                type="button"
                onClick={() => setIsSavingTemplate(!isSavingTemplate)}
                className="text-[10px] text-rose-650 hover:text-rose-800 font-extrabold hover:underline cursor-pointer flex items-center gap-1 transition-all"
              >
                {isSavingTemplate ? "Batal" : "Simpan Draf Template"}
              </button>
            </div>

            {/* Template Save Form */}
            {isSavingTemplate && (
              <div className="space-y-2 mt-2 pt-2 border-t border-rose-150">
                <p className="text-[10px] text-slate-500 font-medium font-sans">
                  Simpan setelan sekolah, kelas, metode, dan media rujukan form ini sebagai draf template baru.
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Nama Template (misal: SMAN 2 Kelas XII)"
                    className="flex-1 p-2 border border-slate-200 rounded text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim()}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      !templateName.trim()
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-rose-500 hover:bg-rose-600 text-white"
                    }`}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* Template selector / display list */}
            <div className="space-y-1.5">
              {templates.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((tpl) => {
                    const isActive = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleLoadTemplate(tpl.id)}
                        className={`group px-2.5 py-1.5 border rounded-lg text-[10px] font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                          isActive
                            ? "bg-rose-50 border-rose-450 text-rose-700 shadow-2xs font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-rose-50/30 hover:border-rose-200"
                        }`}
                        title={`Terapkan template: ${tpl.name}\nSekolah: ${tpl.sekolah}\nKelas: ${tpl.kelas}`}
                      >
                        <LayoutTemplate className={`w-3 h-3 ${isActive ? "text-rose-500" : "text-slate-400 group-hover:text-rose-500"}`} />
                        <span className="truncate max-w-[130px]">{tpl.name}</span>
                        
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                          className="text-slate-300 hover:text-red-500 hover:bg-rose-50 rounded p-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus template ini"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 leading-none">Belum ada draf template tersimpan.</p>
              )}
            </div>

            {templateSuccess && (
              <div className="p-2 bg-rose-50 border border-rose-105 rounded text-[10px] text-rose-800 font-bold flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3 text-rose-500" /> Template berhasil disimpan dan aktif!
              </div>
            )}
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            {/* Sekolah */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nama Sekolah</label>
              <input 
                type="text" 
                value={sekolah}
                onChange={(e) => setSekolah(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                placeholder="Misal: SMP Negeri 1 Jakarta / SMA"
              />
            </div>

            {/* Row: Kelas & Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sasaran Kelas</label>
                <select 
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                >
                  <option value="Kelas VII">Kelas VII (SMP)</option>
                  <option value="Kelas VIII">Kelas VIII (SMP)</option>
                  <option value="Kelas IX">Kelas IX (SMP)</option>
                  <option value="Kelas X">Kelas X (SMA/SMK)</option>
                  <option value="Kelas XI">Kelas XI (SMA/SMK)</option>
                  <option value="Kelas XII">Kelas XII (SMA/SMK)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Semester</label>
                <select 
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                >
                  <option value="1 (Ganjil)">1 (Ganjil)</option>
                  <option value="2 (Genap)">2 (Genap)</option>
                </select>
              </div>
            </div>

            {/* Row: Bidang Layanan & Alokasi Waktu */}
            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Alokasi Waktu</label>
                <select 
                  value={alokasiWaktu}
                  onChange={(e) => setAlokasiWaktu(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                >
                  <option value="1 JP (40 Menit)">1 JP (40 Menit)</option>
                  <option value="2 JP (80 Menit)">2 JP (80 Menit)</option>
                  <option value="1 JP (45 Menit)">1 JP (45 Menit)</option>
                  <option value="2 JP (90 Menit)">2 JP (90 Menit)</option>
                </select>
              </div>
            </div>

            {/* Tema / Topik */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tema / Topik Layanan <span className="text-red-500">*</span></label>
              <textarea 
                rows={3}
                value={topikTema}
                onChange={(e) => setTopikTema(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                placeholder="Tulis tema bimbingan secara bebas atau pilih draf dari perpustakaan bimbingan. Contoh: 'Pencegahan Bullying di Lingkungan Sekolah'"
              />
            </div>

            {/* Metode Layanan */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Metode Layanan</label>
              <input 
                type="text" 
                value={metodeLayanan}
                onChange={(e) => setMetodeLayanan(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                placeholder="Misal: Diskusi Kelompok, Curah Pendapat, dsb."
              />
            </div>

            {/* Alat & Media */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Alat & Media bimbingan</label>
              <input 
                type="text" 
                value={mediaAlat}
                onChange={(e) => setMediaAlat(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                placeholder="Misal: LCD Proyektor, Kartu Refleksi, Handout"
              />
            </div>

            {/* Submit Button */}
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
                  <span>Sedang Menyusun Draf...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Susun RPL Konseling</span>
                </>
              )}
            </button>
          </form>

          {generationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Gagal Menyusun RPL</p>
                <p className="mt-0.5 text-red-600 leading-relaxed">{generationError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: RPL Preview or Help instructions */}
        <div className="w-full md:w-7/12 flex flex-col min-h-[400px]">
          {isGenerating ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className="font-bold text-slate-700 text-sm">Menghubungkan ke Sistem Layanan Terpadu</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistem sedang merumuskan Standar Kompetensi, merancang tujuan layanan dengan KKO yang valid, dan memecah 3 tahap bimbingan (Pendahuluan, Inti, Penutup) secara sistematis.
                </p>
              </div>
            </div>
          ) : currentRpl ? (
            <div className="space-y-4">
              
              {/* RPL Operations Tool Bar */}
              <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl p-3 shadow-md flex-wrap gap-2 text-xs print-action-bar">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500 px-2 py-1 rounded text-white font-extrabold text-[10px]">RPL BK</span>
                  <span className="font-semibold truncate max-w-[200px]">{currentRpl.topikTema}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                    title="Edit Teks Langsung"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? "Kunci & Simpan" : "In-line Edit"}</span>
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                    title="Salin ke Clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-rose-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Tersalin!" : "Salin"}</span>
                  </button>
                  <button
                    onClick={saveToLibrary}
                    className="p-2 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                    title="Simpan ke Pustaka"
                  >
                    {savedSuccess ? <Check className="w-4 h-4 text-rose-400" /> : <Save className="w-4 h-4" />}
                    <span>{savedSuccess ? "Tersimpan" : "Simpan"}</span>
                  </button>
                  <button
                    onClick={generatePDF}
                    className="p-2 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-450 hover:from-rose-650 hover:to-pink-500 text-white rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    title="Unduh Berkas PDF Resmi"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 border border-slate-700"
                    title="Cetak Melalui Browser"
                  >
                    <Printer className="w-4 h-4 text-rose-400" />
                    <span>Cetak Layar</span>
                  </button>
                </div>
              </div>

              {/* Sibling Generator Shortcut Bar */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-800 print-action-bar">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" /> Lengkap draf Anda dengan komponen kelas lainnya:
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onTriggerSiblingModule("materi", currentRpl.topikTema, currentRpl.bidangLayanan)}
                    className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded font-bold text-rose-700 transition-colors cursor-pointer"
                  >
                    Materi Ajar
                  </button>
                  <button 
                    onClick={() => onTriggerSiblingModule("icebreaker", currentRpl.topikTema, currentRpl.bidangLayanan)}
                    className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded font-bold text-rose-700 transition-colors cursor-pointer"
                  >
                    Icebreaker Game
                  </button>
                  <button 
                    onClick={() => onTriggerSiblingModule("asesmen", currentRpl.topikTema, currentRpl.bidangLayanan)}
                    className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded font-bold text-rose-700 transition-colors cursor-pointer"
                  >
                    Lembar Asesmen
                  </button>
                </div>
              </div>

              {/* RPL Formal Document Layout */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-8 shadow-md text-xs leading-relaxed space-y-6 print-content overflow-y-auto max-h-[800px]">
                
                {/* Header Formal */}
                <div className="text-center border-b-2 border-slate-800 pb-4 space-y-2 relative">
                  <h1 className="text-sm font-extrabold tracking-wide uppercase">RENCANA PELAKSANAAN LAYANAN (RPL)</h1>
                  <h2 className="text-xs font-bold tracking-wider uppercase">BIMBINGAN KLASIKAL SEMESTER {semester.toUpperCase()}</h2>
                  <div className="absolute right-0 top-0 text-[10px] uppercase font-mono text-slate-400 no-print">Format 1 Lembar</div>
                </div>

                {/* Subheader Metadata table */}
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="w-1/4 py-1.5 font-bold uppercase text-slate-500">Sekolah</td>
                      <td className="w-3/4 py-1.5 font-semibold">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={currentRpl.sekolah}
                            onChange={(e) => setCurrentRpl({ ...currentRpl, sekolah: e.target.value })}
                            className="w-full p-1 border border-slate-200 rounded"
                          />
                        ) : currentRpl.sekolah}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold uppercase text-slate-500">Sasaran / Kelas</td>
                      <td className="py-1.5 font-semibold">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={currentRpl.kelas}
                            onChange={(e) => setCurrentRpl({ ...currentRpl, kelas: e.target.value })}
                            className="w-full p-1 border border-slate-200 rounded"
                          />
                        ) : currentRpl.kelas}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold uppercase text-slate-500">Bidang Layanan</td>
                      <td className="py-1.5 font-semibold">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={currentRpl.bidangLayanan}
                            onChange={(e) => setCurrentRpl({ ...currentRpl, bidangLayanan: e.target.value })}
                            className="w-full p-1 border border-slate-200 rounded"
                          />
                        ) : currentRpl.bidangLayanan}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold uppercase text-slate-500">Topik / Tema</td>
                      <td className="py-1.5 font-bold text-slate-800">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={currentRpl.topikTema}
                            onChange={(e) => setCurrentRpl({ ...currentRpl, topikTema: e.target.value })}
                            className="w-full p-1 border border-slate-200 rounded"
                          />
                        ) : currentRpl.topikTema}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold uppercase text-slate-500">Alokasi Waktu</td>
                      <td className="py-1.5 font-semibold">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={currentRpl.alokasiWaktu}
                            onChange={(e) => setCurrentRpl({ ...currentRpl, alokasiWaktu: e.target.value })}
                            className="w-full p-1 border border-slate-200 rounded"
                          />
                        ) : currentRpl.alokasiWaktu}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold uppercase text-slate-500">Metode & Alat</td>
                      <td className="py-1.5">
                        <span className="font-semibold">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={currentRpl.metodeLayanan}
                              onChange={(e) => setCurrentRpl({ ...currentRpl, metodeLayanan: e.target.value })}
                              className="w-full p-1 border border-slate-200 rounded mb-1"
                            />
                          ) : currentRpl.metodeLayanan}
                        </span>
                        <div className="text-slate-500 mt-0.5">
                          Media: {isEditing ? (
                            <input 
                              type="text" 
                              value={currentRpl.mediaAlat}
                              onChange={(e) => setCurrentRpl({ ...currentRpl, mediaAlat: e.target.value })}
                              className="w-full p-1 border border-slate-200 rounded"
                            />
                          ) : currentRpl.mediaAlat}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Tujuan Layanan */}
                <div className="space-y-2">
                  <h3 className="bg-slate-100 p-1 px-2 font-bold uppercase tracking-wider text-slate-800 text-[11px] border-l-4 border-emerald-700">A. TUJUAN LAYANAN</h3>
                  <div className="pl-2 space-y-2">
                    <p className="text-justify">
                      <strong className="text-slate-600 block mb-0.5">Tujuan Umum:</strong> 
                      {isEditing ? (
                        <textarea 
                          rows={2}
                          value={currentRpl.tujuanUmum}
                          onChange={(e) => setCurrentRpl({ ...currentRpl, tujuanUmum: e.target.value })}
                          className="w-full p-1 border border-slate-200 rounded"
                        />
                      ) : currentRpl.tujuanUmum}
                    </p>
                    <div>
                      <strong className="text-slate-600 block mb-1">Tujuan Khusus:</strong>
                      <ul className="list-disc pl-4 space-y-1">
                        {currentRpl.tujuanKhusus.map((tk, idx) => (
                          <li key={idx}>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={tk}
                                onChange={(e) => {
                                  const updatedTk = [...currentRpl.tujuanKhusus];
                                  updatedTk[idx] = e.target.value;
                                  setCurrentRpl({ ...currentRpl, tujuanKhusus: updatedTk });
                                }}
                                className="w-full p-1 border border-slate-200 rounded my-0.5"
                              />
                            ) : tk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Langkah-Langkah Kegiatan */}
                <div className="space-y-3">
                  <h3 className="bg-slate-100 p-1 px-2 font-bold uppercase tracking-wider text-slate-800 text-[11px] border-l-4 border-emerald-700">B. LANGKAH-LANGKAH KEGIATAN</h3>
                  <div className="pl-2 space-y-3">
                    
                    {/* Pendahuluan */}
                    <div>
                      <h4 className="font-bold text-slate-700 underline mb-1">1. Tahap Pendahuluan (Opening)</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {currentRpl.kegiatanPendahuluan.map((kp, idx) => (
                          <li key={idx}>
                            {isEditing ? (
                              <textarea 
                                rows={2}
                                value={kp}
                                onChange={(e) => {
                                  const updatedKp = [...currentRpl.kegiatanPendahuluan];
                                  updatedKp[idx] = e.target.value;
                                  setCurrentRpl({ ...currentRpl, kegiatanPendahuluan: updatedKp });
                                }}
                                className="w-full p-1 border border-slate-200 rounded my-0.5"
                              />
                            ) : kp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Inti */}
                    <div>
                      <h4 className="font-bold text-slate-700 underline mb-1">2. Tahap Inti (Body)</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {currentRpl.kegiatanInti.map((ki, idx) => (
                          <li key={idx}>
                            {isEditing ? (
                              <textarea 
                                rows={2}
                                value={ki}
                                onChange={(e) => {
                                  const updatedKi = [...currentRpl.kegiatanInti];
                                  updatedKi[idx] = e.target.value;
                                  setCurrentRpl({ ...currentRpl, kegiatanInti: updatedKi });
                                }}
                                className="w-full p-1 border border-slate-200 rounded my-0.5"
                              />
                            ) : ki}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Penutup */}
                    <div>
                      <h4 className="font-bold text-slate-700 underline mb-1">3. Tahap Penutup / Terminasi (Closing)</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {currentRpl.kegiatanPenutup.map((kp, idx) => (
                          <li key={idx}>
                            {isEditing ? (
                              <textarea 
                                rows={2}
                                value={kp}
                                onChange={(e) => {
                                  const updatedKp = [...currentRpl.kegiatanPenutup];
                                  updatedKp[idx] = e.target.value;
                                  setCurrentRpl({ ...currentRpl, kegiatanPenutup: updatedKp });
                                }}
                                className="w-full p-1 border border-slate-200 rounded my-0.5"
                              />
                            ) : kp}
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>

                {/* Evaluasi dan Tindak Lanjut */}
                <div className="space-y-3">
                  <h3 className="bg-slate-100 p-1 px-2 font-bold uppercase tracking-wider text-slate-800 text-[11px] border-l-4 border-emerald-700">C. EVALUASI DAN TINDAK LANJUT</h3>
                  <div className="pl-2 space-y-3">
                    {/* Evaluasi Proses */}
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">1. Evaluasi Proses:</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {currentRpl.evaluasiProses.map((ep, idx) => (
                          <li key={idx}>
                            {isEditing ? (
                              <textarea 
                                rows={2}
                                value={ep}
                                onChange={(e) => {
                                  const updatedEp = [...currentRpl.evaluasiProses];
                                  updatedEp[idx] = e.target.value;
                                  setCurrentRpl({ ...currentRpl, evaluasiProses: updatedEp });
                                }}
                                className="w-full p-1 border border-slate-200 rounded my-0.5"
                              />
                            ) : ep}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Evaluasi Hasil */}
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">2. Evaluasi Hasil:</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {currentRpl.evaluasiHasil.map((eh, idx) => (
                          <li key={idx}>
                            {isEditing ? (
                              <textarea 
                                rows={2}
                                value={eh}
                                onChange={(e) => {
                                  const updatedEh = [...currentRpl.evaluasiHasil];
                                  updatedEh[idx] = e.target.value;
                                  setCurrentRpl({ ...currentRpl, evaluasiHasil: updatedEh });
                                }}
                                className="w-full p-1 border border-slate-200 rounded my-0.5"
                              />
                            ) : eh}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sumber Bahan */}
                    <p className="text-justify">
                      <strong className="text-slate-600 block mb-0.5">Sumber & Pustaka:</strong> 
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={currentRpl.sumberBahan}
                          onChange={(e) => setCurrentRpl({ ...currentRpl, sumberBahan: e.target.value })}
                          className="w-full p-1 border border-slate-200 rounded"
                        />
                      ) : currentRpl.sumberBahan}
                    </p>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="pt-8 grid grid-cols-2 text-center text-xs">
                  <div className="space-y-16">
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <div className="w-40 border-t border-slate-700 mx-auto pt-1 font-bold text-slate-800">
                      NIP. .............................
                    </div>
                  </div>
                  
                  <div className="space-y-16">
                    <p>{sekolah.split(" ")[0] || "Sekolah"}, {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
                    <p>Guru Bimbingan dan Konseling</p>
                    <div className="w-40 border-t border-slate-700 mx-auto pt-1 font-bold text-slate-800">
                      NIP. .............................
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <span className="p-3.5 bg-slate-50 rounded-full text-slate-400">
                <FileText className="w-8 h-8 text-slate-300" />
              </span>
              <div className="space-y-1 max-w-sm">
                <p className="font-bold text-slate-600">Pratinjau RPL Belum Tersedia</p>
                <p className="text-xs leading-relaxed">
                  Isi formulir bimbingan klasikal di sebelah kiri, lalu klik tombol <b>"Susun RPL Konseling"</b> untuk menuangkan rancangan bimbingan kelas 1-Lembar Anda.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Area / Saved RPL List */}
      {savedRpls.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <RotateCcw className="w-4.5 h-4.5 text-rose-500" /> Pustaka RPL Lokal Disimpan
            </h3>
            <p className="text-xs text-slate-500 mt-1">Daftar draf Rencana Pelaksanaan Layanan yang telah Anda amankan.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedRpls.map((rpl) => (
              <div 
                key={rpl.id}
                className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow hover:border-slate-300 transition-all text-xs flex justify-between gap-3"
              >
                <div 
                  className="space-y-2 cursor-pointer flex-1"
                  onClick={() => loadSavedRpl(rpl)}
                >
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    rpl.bidangLayanan === "Pribadi" ? "bg-red-50 text-red-700" :
                    rpl.bidangLayanan === "Sosial" ? "bg-orange-50 text-orange-700" :
                    rpl.bidangLayanan === "Belajar" ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {rpl.bidangLayanan}
                  </span>
                  <h4 className="font-bold text-slate-800 line-clamp-1 hover:text-rose-600 hover:underline">
                    {rpl.topikTema}
                  </h4>
                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <p>{rpl.sekolah} • {rpl.kelas}</p>
                    <p>Dibuat: {new Date(rpl.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end border-l border-slate-100 pl-3">
                  <button
                    onClick={() => rpl.id && deleteRpl(rpl.id)}
                    className="p-1 px-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    title="Hapus RPL"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => loadSavedRpl(rpl)}
                    className="text-[10px] font-bold text-rose-500 hover:underline inline-flex items-center gap-0.5 hover:text-rose-750 cursor-pointer"
                  >
                    Buka <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
