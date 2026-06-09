import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data_store.json");

interface UserData {
  uid: string;
  email: string;
  passwordHash: string;
}

interface UserSyncData {
  rpls: any[];
  icebreakers: any[];
  materi: any[];
  asesmen: any[];
}

interface DBStructure {
  users: Record<string, UserData>; // Key is normalized email
  syncData: Record<string, UserSyncData>; // Key is uid
}

function initDB(): DBStructure {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Gagal membaca database file, membuat baru:", e);
  }
  
  const defaultDB: DBStructure = { users: {}, syncData: {} };
  saveDB(defaultDB);
  return defaultDB;
}

function saveDB(db: DBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menulis database file:", e);
  }
}

export const dbStore = {
  getDB: initDB,
  
  registerUser: (email: string, passwordPlain: string): { uid: string; email: string } | null => {
    const db = initDB();
    const normUser = email.toLowerCase().trim();
    if (db.users[normUser]) {
      return null; // User already exists
    }
    
    const uid = "usr_" + Math.random().toString(36).substr(2, 9);
    db.users[normUser] = {
      uid,
      email: normUser,
      passwordHash: passwordPlain // Storing simply for demonstration/internal use in teacher workspace
    };
    
    db.syncData[uid] = {
      rpls: [],
      icebreakers: [],
      materi: [],
      asesmen: []
    };
    
    saveDB(db);
    return { uid, email: normUser };
  },
  
  loginUser: (email: string, passwordPlain: string): { uid: string; email: string } | null => {
    const db = initDB();
    const normUser = email.toLowerCase().trim();
    const user = db.users[normUser];
    if (user && user.passwordHash === passwordPlain) {
      return { uid: user.uid, email: user.email };
    }
    return null;
  },
  
  getSyncData: (uid: string): UserSyncData => {
    const db = initDB();
    if (!db.syncData[uid]) {
      db.syncData[uid] = {
        rpls: [],
        icebreakers: [],
        materi: [],
        asesmen: []
      };
      saveDB(db);
    }
    return db.syncData[uid];
  },
  
  saveSyncData: (uid: string, data: UserSyncData): boolean => {
    const db = initDB();
    db.syncData[uid] = {
      rpls: Array.isArray(data.rpls) ? data.rpls : [],
      icebreakers: Array.isArray(data.icebreakers) ? data.icebreakers : [],
      materi: Array.isArray(data.materi) ? data.materi : [],
      asesmen: Array.isArray(data.asesmen) ? data.asesmen : []
    };
    saveDB(db);
    return true;
  }
};
