export interface RPLData {
  id?: string;
  sekolah: string;
  kelas: string;
  semester: string;
  bidangLayanan: "Pribadi" | "Sosial" | "Belajar" | "Karir" | string;
  topikTema: string;
  alokasiWaktu: string;
  metodeLayanan: string;
  mediaAlat: string;
  tujuanUmum: string;
  tujuanKhusus: string[];
  kegiatanPendahuluan: string[];
  kegiatanInti: string[];
  kegiatanPenutup: string[];
  evaluasiProses: string[];
  evaluasiHasil: string[];
  sumberBahan: string;
  createdAt: string;
}

export interface IcebreakerData {
  id?: string;
  topikTema: string;
  namaGame: string;
  estimasiWaktu: string;
  alatBahan: string[];
  caraBermain: string[];
  maknaRefleksi: string;
  pertanyaanDebriefing: string[];
  createdAt: string;
}

export interface PoinMateri {
  subJudul: string;
  deskripsi: string;
  tipsPraktis: string[];
}

export interface StudiKasus {
  cerita: string;
  pertanyaanDiskusi: string[];
}

export interface MateriData {
  id?: string;
  topikTema: string;
  judulMateri: string;
  pengantar: string;
  poinMateri: PoinMateri[];
  studiKasusInteraktif: StudiKasus;
  kesimpulan: string;
  createdAt: string;
}

export interface PertanyaanSkala {
  teksPertanyaan: string;
  pilihanSkala: string[];
}

export interface AsesmenData {
  id?: string;
  topikTema: string;
  judulAsesmen: string;
  petunjukPengisian: string;
  pertanyaanSkala: PertanyaanSkala[];
  pertanyaanTerbukaReflektif: string[];
  createdAt: string;
}

export interface PredefinedTopic {
  id: string;
  bidang: "Pribadi" | "Sosial" | "Belajar" | "Karir" | "Keluarga";
  topik: string;
  deskripsi: string;
  sasaranKelas: string;
  estimasiWaktu: string;
}

export interface RPLTemplate {
  id: string;
  name: string;
  sekolah: string;
  kelas: string;
  semester: string;
  bidangLayanan: string;
  alokasiWaktu: string;
  metodeLayanan: string;
  mediaAlat: string;
  topikTema?: string;
  createdAt: string;
}

