import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  salt: string;
  role: "traveler" | "admin";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DbSession {
  id: string;
  token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface DbUserProfile {
  user_id: string;
  full_name: string;
  email: string;
  home_currency: string;
  travel_pace: string;
  interests: string[];
  travel_style: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  version: number;
  users: DbUser[];
  sessions: DbSession[];
  profiles: DbUserProfile[];
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DATA_DIR, "app-db.json");

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

class AppDatabase {
  private data: DatabaseSchema;
  private initialized = false;

  constructor() {
    this.data = {
      version: 1,
      users: [],
      sessions: [],
      profiles: [],
    };
    this.init();
  }

  private init() {
    if (this.initialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error("[Database] Failed to initialize file database:", err);
      this.seedInitialData();
      this.initialized = true;
    }
  }

  private seedInitialData() {
    const now = new Date().toISOString();

    // 1. Seed Demo Traveler Account
    const demoSalt = crypto.randomBytes(16).toString("hex");
    const demoUser: DbUser = {
      id: "demo-user-123",
      email: "demo@tripwise.ai",
      full_name: "Demo Traveler",
      salt: demoSalt,
      password_hash: hashPassword("password123", demoSalt),
      role: "traveler",
      created_at: now,
      updated_at: now,
    };

    // 2. Seed Admin Planner Account
    const adminSalt = crypto.randomBytes(16).toString("hex");
    const adminUser: DbUser = {
      id: "admin-user-001",
      email: "admin@tripwise.ai",
      full_name: "TripWise Administrator",
      salt: adminSalt,
      password_hash: hashPassword("admin123", adminSalt),
      role: "admin",
      created_at: now,
      updated_at: now,
    };

    this.data = {
      version: 1,
      users: [demoUser, adminUser],
      sessions: [
        {
          id: "session-demo-001",
          token: "demo-user-123",
          user_id: "demo-user-123",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: now,
        },
      ],
      profiles: [
        {
          user_id: "demo-user-123",
          full_name: "Demo Traveler",
          email: "demo@tripwise.ai",
          home_currency: "INR",
          travel_pace: "moderate",
          interests: ["Heritage", "Nature", "Beaches", "Culinary"],
          travel_style: "balanced",
          onboarding_completed: true,
          created_at: now,
          updated_at: now,
        },
        {
          user_id: "admin-user-001",
          full_name: "TripWise Administrator",
          email: "admin@tripwise.ai",
          home_currency: "INR",
          travel_pace: "packed",
          interests: ["All India Circuits", "Safety", "Logistics"],
          travel_style: "luxury",
          onboarding_completed: true,
          created_at: now,
          updated_at: now,
        },
      ],
    };
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error("[Database] Error persisting data to disk:", err);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
      } catch (e) {
        console.error("[Database] Direct write error:", e);
      }
    }
  }

  // --- User Operations ---

  public findUserByEmail(email: string): DbUser | null {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    return this.data.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  }

  public findUserById(id: string): DbUser | null {
    this.init();
    return this.data.users.find((u) => u.id === id) || null;
  }

  public registerUser(params: {
    email: string;
    password: string;
    fullName: string;
    role?: "traveler" | "admin";
  }): { success: boolean; user?: Omit<DbUser, "password_hash" | "salt">; error?: string } {
    this.init();
    const cleanEmail = params.email.trim().toLowerCase();

    if (!cleanEmail || !params.password) {
      return { success: false, error: "Email and password are required." };
    }

    if (params.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const existing = this.findUserByEmail(cleanEmail);
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const password_hash = hashPassword(params.password, salt);
    const now = new Date().toISOString();
    const id = `user-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;

    const newUser: DbUser = {
      id,
      email: cleanEmail,
      full_name: params.fullName.trim() || cleanEmail.split("@")[0],
      password_hash,
      salt,
      role: params.role || "traveler",
      created_at: now,
      updated_at: now,
    };

    const newProfile: DbUserProfile = {
      user_id: id,
      full_name: newUser.full_name,
      email: cleanEmail,
      home_currency: "INR",
      travel_pace: "moderate",
      interests: [],
      travel_style: "balanced",
      onboarding_completed: false,
      created_at: now,
      updated_at: now,
    };

    this.data.users.push(newUser);
    this.data.profiles.push(newProfile);
    this.persist();

    const safeUser: Omit<DbUser, "password_hash" | "salt"> = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      avatar_url: newUser.avatar_url,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
    };
    return { success: true, user: safeUser };
  }

  public verifyCredentials(
    email: string,
    password: string
  ): { success: boolean; user?: Omit<DbUser, "password_hash" | "salt">; error?: string } {
    this.init();
    const user = this.findUserByEmail(email);
    if (!user) {
      return { success: false, error: "No account found with this email address. Please register first." };
    }

    const testHash = hashPassword(password, user.salt);
    if (testHash !== user.password_hash) {
      return { success: false, error: "Incorrect password. Please verify your credentials." };
    }

    const safeUser: Omit<DbUser, "password_hash" | "salt"> = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
    return { success: true, user: safeUser };
  }

  // --- Session Operations ---

  public createSession(userId: string): DbSession {
    this.init();
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const token = `tok-${userId}-${crypto.randomBytes(16).toString("hex")}`;

    const session: DbSession = {
      id: `sess-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      token,
      user_id: userId,
      expires_at: expires.toISOString(),
      created_at: now.toISOString(),
    };

    this.data.sessions.push(session);
    this.persist();
    return session;
  }

  public getSession(tokenOrUserId: string): DbSession | null {
    this.init();
    const now = new Date().toISOString();
    return (
      this.data.sessions.find(
        (s) =>
          (s.token === tokenOrUserId || s.user_id === tokenOrUserId) &&
          s.expires_at > now
      ) || null
    );
  }

  public deleteSession(tokenOrUserId: string): void {
    this.init();
    this.data.sessions = this.data.sessions.filter(
      (s) => s.token !== tokenOrUserId && s.user_id !== tokenOrUserId
    );
    this.persist();
  }

  // --- Profile Operations ---

  public getProfile(userId: string): DbUserProfile | null {
    this.init();
    return this.data.profiles.find((p) => p.user_id === userId) || null;
  }

  public updateProfile(
    userId: string,
    updates: Partial<DbUserProfile>
  ): DbUserProfile | null {
    this.init();
    const profile = this.data.profiles.find((p) => p.user_id === userId);
    if (!profile) return null;

    Object.assign(profile, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return profile;
  }

  public getStats() {
    this.init();
    return {
      usersCount: this.data.users.length,
      sessionsCount: this.data.sessions.length,
      profilesCount: this.data.profiles.length,
      databaseFile: DB_FILE,
    };
  }
}

// Global Singleton for Hot Module Reloading in Next.js development
const globalForDb = globalThis as unknown as { __appDb?: AppDatabase };
export const appDb = globalForDb.__appDb || new AppDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.__appDb = appDb;
