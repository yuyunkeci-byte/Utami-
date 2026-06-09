import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { dbStore } from "./server/dbStore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Auto-seed the requested account
try {
  dbStore.registerUser("dhanijie66@gmail.com", "123456");
  console.log("Seeded user 'dhanijie66@gmail.com' successfully.");
} catch (e) {
  // Safe to ignore if already exists
}

// REST API for User Authentication & Workspace Synchronization
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }
  const result = dbStore.registerUser(email, password);
  if (!result) {
    return res.status(400).json({ error: "Akun email ini sudah terdaftar." });
  }
  return res.json({ success: true, message: "Pendaftaran berhasil!", user: result });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }
  const result = dbStore.loginUser(email, password);
  if (!result) {
    return res.status(401).json({ error: "Email atau password salah." });
  }
  return res.json({ success: true, message: "Berhasil masuk!", user: result });
});

app.get("/api/sync/:userId", (req, res) => {
  const { userId } = req.params;
  const syncData = dbStore.getSyncData(userId);
  return res.json(syncData);
});

app.post("/api/sync/:userId", (req, res) => {
  const { userId } = req.params;
  const { rpls, icebreakers, materi, asesmen } = req.body;
  const success = dbStore.saveSyncData(userId, { rpls, icebreakers, materi, asesmen });
  return res.json({ success });
});

// Lazy-initialization utility for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY is not defined. AI generation features will rely on descriptive fallbacks.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Endpoint: Generate Rencana Pelaksanaan Layanan (RPL)
app.post("/api/generate-rpl", async (req, res) => {
  try {
    const { sekolah, kelas, semester, bidangLayanan, topikTema, alokasiWaktu, metodeLayanan, mediaAlat } = req.body;

    if (!topikTema || !bidangLayanan) {
      return res.status(400).json({ error: "Topik/Tema dan Bidang Layanan diperlukan." });
    }

    const ai = getGenAI();
    
    const prompt = `Buatkan Rencana Pelaksanaan Layanan (RPL) Bimbingan Klasikal BK (Bimbingan Kelompok Kelas) yang sangat lengkap, profesional, dan realistis untuk sekolah tingkat Indonesia dengan detail berikut:
- Nama Sekolah: ${sekolah || "SMP/SMA Negeri"}
- Kelas/Semester: ${kelas || "Pilihan"} / ${semester || "1 (Ganjil)"}
- Bidang Layanan: ${bidangLayanan} (Pilihan: Pribadi, Sosial, Belajar, Karir, Keluarga)
- Topik / Tema: ${topikTema}
- Alokasi Waktu: ${alokasiWaktu || "1 JP (40 Menit)"}
- Metode Layanan: ${metodeLayanan || "Diskusi Kelompok & Game Refleksi"}
- Media / Alat: ${mediaAlat || "LCD, Slide Presentasi, Alat Tulis"}

Harap kembalikan respon dalam format JSON yang valid dengan struktur berikut:
{
  "sekolah": "Nama sekolah",
  "kelas": "Kelas",
  "semester": "Semester",
  "bidangLayanan": "Bidang Layanan",
  "topikTema": "Topik atau Tema",
  "alokasiWaktu": "Alokasi waktu",
  "metodeLayanan": "Metode yang digunakan",
  "mediaAlat": "Media atau alat yang diperlukan",
  "tujuanUmum": "Berisi 1 paragraf tujuan umum bimbingan ini yang dikaitkan dengan Tugas Perkembangan Siswa",
  "tujuanKhusus": ["Minimal 3 pernyataan tujuan khusus yang spesifik menggunakan kata kerja operasional (KKO) seperti Mengidentifikasi, Menganalisis, Memilih, Merancang, Mengatasi"],
  "kegiatanPendahuluan": ["Poin-poin langkah pendahuluan secara urut (biasanya: salam, absensi, membina hubungan baik, icebreaker, menyampaikan tujuan, menjelaskan aturan main)"],
  "kegiatanInti": ["Poin-poin langkah inti secara urut yang selaras dengan metode terpilih. Guru memantik diskusi, siswa aktif, refleksi mandiri, dsb."],
  "kegiatanPenutup": ["Poin-poin langkah penutup secara urut (menyimpulkan materi, merefleksikan nilai positif, memberikan penguatan, menutup dengan doa/salam)"],
  "evaluasiProses": ["Kriteria observasi selama proses bimbingan berlangsung (misal: keterlibatan aktif, antusiasme, kerja sama kelompok)"],
  "evaluasiHasil": ["Komentar cara mengukur pencapaian setelah bimbingan selesai (misal: pemahaman baru siswa, perasaan positif, rencana tindakan ke depan)"],
  "sumberBahan": "Sumber atau referensi pustaka yang kredibel"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "sekolah", "kelas", "semester", "bidangLayanan", "topikTema", "alokasiWaktu",
            "metodeLayanan", "mediaAlat", "tujuanUmum", "tujuanKhusus",
            "kegiatanPendahuluan", "kegiatanInti", "kegiatanPenutup",
            "evaluasiProses", "evaluasiHasil", "sumberBahan"
          ],
          properties: {
            sekolah: { type: Type.STRING },
            kelas: { type: Type.STRING },
            semester: { type: Type.STRING },
            bidangLayanan: { type: Type.STRING },
            topikTema: { type: Type.STRING },
            alokasiWaktu: { type: Type.STRING },
            metodeLayanan: { type: Type.STRING },
            mediaAlat: { type: Type.STRING },
            tujuanUmum: { type: Type.STRING },
            tujuanKhusus: { type: Type.ARRAY, items: { type: Type.STRING } },
            kegiatanPendahuluan: { type: Type.ARRAY, items: { type: Type.STRING } },
            kegiatanInti: { type: Type.ARRAY, items: { type: Type.STRING } },
            kegiatanPenutup: { type: Type.ARRAY, items: { type: Type.STRING } },
            evaluasiProses: { type: Type.ARRAY, items: { type: Type.STRING } },
            evaluasiHasil: { type: Type.ARRAY, items: { type: Type.STRING } },
            sumberBahan: { type: Type.STRING }
          }
        },
        temperature: 0.7,
      },
    });

    if (!response.text) {
      throw new Error("Tanggapan AI kosong.");
    }

    const rplData = JSON.parse(response.text);
    return res.json(rplData);

  } catch (error: any) {
    console.error("Error generating RPL:", error);
    return res.status(500).json({ 
      error: "Gagal membuat RPL otomatis.", 
      details: error.message 
    });
  }
});

// 2. Endpoint: Generate Icebreaker BK
app.post("/api/generate-icebreaker", async (req, res) => {
  try {
    const { topikTema, bidangLayanan, durasi } = req.body;

    if (!topikTema) {
      return res.status(400).json({ error: "Topik atau Tema bimbingan diperlukan." });
    }

    const ai = getGenAI();
    const prompt = `Buatkan panduan Icebreaker interaktif, seru, dan mengandung refleksi konseling yang sangat relevan dengan tema bimbingan berikut:
- Tema/Topik: ${topikTema}
- Bidang Layanan: ${bidangLayanan || "Pribadi/Sosial/Keluarga"}
- Perkiraan Durasi Game: ${durasi || "10 menit"}

Permainan ini harus ramah ruang kelas (bisa dilakukan di sela-sela bangku sekolah), memupuk kerja sama atau kesadaran diri siswa, dan selaras dengan topik BK.

Harap kembalikan respon dalam format JSON yang valid dengan struktur berikut:
{
  "namaGame": "Nama Permainan Icebreaker yang menarik",
  "estimasiWaktu": "Perkiraan waktu permainan",
  "alatBahan": ["Alat dan bahan yang dibutuhkan (jika ada, atau sebutkan Tanpa Alat)"],
  "caraBermain": ["Tahap demi tahap instruksi bermain untuk Guru BK menerapkannya di kelas"],
  "maknaRefleksi": "Analisis psikologis singkat: Apa makna permainan ini berkaitan dengan dinamika kelas atau topik bimbingan?",
  "pertanyaanDebriefing": ["Minimal 3 pertanyaan reflektif yang bisa diajukan Guru BK ke siswa setelah permainan selesai untuk memunculkan insight positif"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["namaGame", "estimasiWaktu", "alatBahan", "caraBermain", "maknaRefleksi", "pertanyaanDebriefing"],
          properties: {
            namaGame: { type: Type.STRING },
            estimasiWaktu: { type: Type.STRING },
            alatBahan: { type: Type.ARRAY, items: { type: Type.STRING } },
            caraBermain: { type: Type.ARRAY, items: { type: Type.STRING } },
            maknaRefleksi: { type: Type.STRING },
            pertanyaanDebriefing: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        temperature: 0.8,
      },
    });

    if (!response.text) {
      throw new Error("Tanggapan AI kosong.");
    }

    const icebreakerData = JSON.parse(response.text);
    return res.json(icebreakerData);

  } catch (error: any) {
    console.error("Error generating Icebreaker:", error);
    return res.status(500).json({ error: "Gagal membuat Icebreaker otomatis.", details: error.message });
  }
});

// 3. Endpoint: Generate Materi Bimbingan
app.post("/api/generate-materi", async (req, res) => {
  try {
    const { topikTema, bidangLayanan, audiens } = req.body;

    if (!topikTema) {
      return res.status(400).json({ error: "Topik atau Tema bimbingan diperlukan." });
    }

    const ai = getGenAI();
    const prompt = `Buatkan materi bimbingan klasikal yang menarik, informatif, dan komunikatif untuk siswa kelas/tingkat: ${audiens || "SMP/SMA"}.
- Topik/Tema: ${topikTema}
- Bidang Layanan: ${bidangLayanan || "Pribadi/Sosial/Belajar/Karir/Keluarga"}

Materi harus dikemas secara empatik, edukatif, dan berisi penjelasan ilmiah namun mudah dipahami anak remaja serta memandu perubahan perilaku positif.

Harap kembalikan respon dalam format JSON yang valid dengan struktur berikut:
{
  "judulMateri": "Judul Materi Presentasi/Bimbingan yang Menarik",
  "pengantar": "Pengantar empatik singkat mengenai pentingnya topik ini bagi kehidupan remaja",
  "poinMateri": [
    {
      "subJudul": "Nama Sub-materi 1 (misal: Mengenal apa itu Bullying / Mengapa waktu berharga)",
      "deskripsi": "Ulasan edukatif lengkap berisikan 2-3 kalimat penjelasan mendalam",
      "tipsPraktis": ["Dua atau tiga tips aplikatif langsung bagi siswa"]
    }
  ],
  "studiKasusInteraktif": {
    "cerita": "Sebuah kasus fiktif pendek yang relevan dengan kehidupan siswa sehari-hari untuk bahan curah pendapat",
    "pertanyaanDiskusi": ["Sebutkan 2-3 pertanyaan pemantik diskusi kelompok mengenai cerita di atas"]
  },
  "kesimpulan": "Pesan penutup (take-home message) yang inspiratif untuk memotivasi siswa"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["judulMateri", "pengantar", "poinMateri", "studiKasusInteraktif", "kesimpulan"],
          properties: {
            judulMateri: { type: Type.STRING },
            pengantar: { type: Type.STRING },
            poinMateri: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["subJudul", "deskripsi", "tipsPraktis"],
                properties: {
                  subJudul: { type: Type.STRING },
                  deskripsi: { type: Type.STRING },
                  tipsPraktis: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            studiKasusInteraktif: {
              type: Type.OBJECT,
              required: ["cerita", "pertanyaanDiskusi"],
              properties: {
                cerita: { type: Type.STRING },
                pertanyaanDiskusi: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            kesimpulan: { type: Type.STRING }
          }
        },
        temperature: 0.7,
      },
    });

    if (!response.text) {
      throw new Error("Tanggapan AI kosong.");
    }

    const materiData = JSON.parse(response.text);
    return res.json(materiData);

  } catch (error: any) {
    console.error("Error generating Materi:", error);
    return res.status(500).json({ error: "Gagal membuat materi bimbingan otomatis.", details: error.message });
  }
});

// 4. Endpoint: Generate Asesmen / Evaluasi Lembar Kerja Siswa
app.post("/api/generate-asesmen", async (req, res) => {
  try {
    const { topikTema, bidangLayanan, jenisAsesmen } = req.body;

    if (!topikTema) {
      return res.status(400).json({ error: "Topik atau Tema bimbingan diperlukan." });
    }

    const ai = getGenAI();
    const prompt = `Buatkan kuesioner instrumen asesmen atau evaluasi bimbingan klasikal BK dengan detail berikut:
- Topik/Tema bimbingan: ${topikTema}
- Bidang Layanan: ${bidangLayanan || "Pribadi/Sosial/Belajar/Karir/Keluarga"}
- Jenis Asesmen: ${jenisAsesmen || "Evaluasi Hasil & Refleksi Diri"}

Asesmen ini ditujukan agar siswa bisa mengukur tingkat pemahaman, perubahan sikap, dan komitmen pribadi mereka terkait topik setelah mengikuti layanan klasikal BK.

Harap kembalikan respon dalam format JSON yang valid dengan struktur berikut:
{
  "judulAsesmen": "Judul Instrumen Asesmen (Contoh: Evaluasi Hasil Layanan BK - Manajemen Waktu)",
  "petunjukPengisian": "Petunjuk pengerjaan singkat yang ramah dan suportif bagi siswa",
  "pertanyaanSkala": [
    {
      "teksPertanyaan": "Butir pernyataan sikap/pemahaman (misal: Saya mampu membedakan kebutuhan mendesak dan penting)",
      "pilihanSkala": ["Sangat Setuju", "Setuju", "Kurang Setuju", "Sangat Tidak Setuju"]
    }
  ],
  "pertanyaanTerbukaReflektif": ["Pernyataan/pertanyaan esai reflektif terbuka (minimal 3 butir) untuk menangkap komitmen baru siswa"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["judulAsesmen", "petunjukPengisian", "pertanyaanSkala", "pertanyaanTerbukaReflektif"],
          properties: {
            judulAsesmen: { type: Type.STRING },
            petunjukPengisian: { type: Type.STRING },
            pertanyaanSkala: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["teksPertanyaan", "pilihanSkala"],
                properties: {
                  teksPertanyaan: { type: Type.STRING },
                  pilihanSkala: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            pertanyaanTerbukaReflektif: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        temperature: 0.7,
      },
    });

    if (!response.text) {
      throw new Error("Tanggapan AI kosong.");
    }

    const asesmenData = JSON.parse(response.text);
    return res.json(asesmenData);

  } catch (error: any) {
    console.error("Error generating Asesmen:", error);
    return res.status(500).json({ error: "Gagal membuat instrumen asesmen.", details: error.message });
  }
});

async function startBootstrap() {
  // Configure Vite middleware for dev or Serve static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startBootstrap();
