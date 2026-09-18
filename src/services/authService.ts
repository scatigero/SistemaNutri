import { neon } from '@neondatabase/serverless';
import { Nutricionista, LoginCredentials, RegisterCredentials } from '../types/auth';

const STORAGE_KEY_USER = 'nutrisystem_user';
const STORAGE_KEY_TOKEN = 'nutrisystem_token';
const STORAGE_KEY_LOCAL_USERS = 'nutrisystem_registered_users';

// Database connection string from environment if provided
const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';

// Initialize Neon SQL client safely if connection string is configured
let sql: any = null;
if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch (err) {
    console.warn('[Neon Database] Não foi possível inicializar conexão remota, usando fallback local.', err);
  }
}

/**
 * Garante que a tabela `nutricionistas` e a coluna `senha` existam caso o banco Neon esteja configurado.
 */
async function ensureNeonTableExists() {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS nutricionistas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      ALTER TABLE nutricionistas ADD COLUMN IF NOT EXISTS senha TEXT;
    `;
  } catch (err) {
    console.warn('[Neon Table Setup]', err);
  }
}

// Inicializa a tabela no Neon em background
ensureNeonTableExists();

// Helper para gerenciar fallback em LocalStorage para testes e persistência local segura
function getLocalUsers(): (Nutricionista & { senha: string })[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUser(user: Nutricionista & { senha: string }) {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(users));
}

export const authService = {
  /**
   * Realiza login do nutricionista
   */
  async login(credentials: LoginCredentials): Promise<Nutricionista> {
    const email = credentials.email.trim().toLowerCase();
    const senha = credentials.senha;

    if (!email || !senha) {
      throw new Error('Por favor, preencha todos os campos.');
    }

    // Tenta autenticar no Neon caso configurado
    if (sql) {
      try {
        const rows = await sql`
          SELECT id, nome, email, created_at 
          FROM nutricionistas 
          WHERE LOWER(email) = ${email} AND senha = ${senha}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const user: Nutricionista = {
            id: rows[0].id,
            nome: rows[0].nome,
            email: rows[0].email,
            created_at: rows[0].created_at,
          };
          this.setSession(user, `neon_token_${Date.now()}`);
          return user;
        }
      } catch (neonErr: any) {
        console.warn('Erro na consulta Neon Postgres:', neonErr);
        // Prossegue para checar banco local/fallback
      }
    }

    // Fallback: Local Storage Users
    const localUsers = getLocalUsers();
    const found = localUsers.find(
      (u) => u.email.toLowerCase() === email && u.senha === senha
    );

    if (found) {
      const user: Nutricionista = {
        id: found.id,
        nome: found.nome,
        email: found.email,
        created_at: found.created_at,
      };
      this.setSession(user, `local_token_${Date.now()}`);
      return user;
    }

    throw new Error('E-mail ou senha incorretos. Verifique seus dados.');
  },

  /**
   * Realiza cadastro do nutricionista
   */
  async register(credentials: RegisterCredentials): Promise<Nutricionista> {
    const nome = credentials.nome.trim();
    const email = credentials.email.trim().toLowerCase();
    const senha = credentials.senha;
    const confirmarSenha = credentials.confirmarSenha;

    if (!nome || !email || !senha || !confirmarSenha) {
      throw new Error('Todos os campos são obrigatórios.');
    }

    if (senha.length < 9) {
      throw new Error('A senha deve ter no mínimo 9 caracteres.');
    }

    if (senha !== confirmarSenha) {
      throw new Error('As senhas não coincidem. Por favor, verifique.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Por favor, informe um e-mail válido.');
    }

    // Verifica duplicação local
    const localUsers = getLocalUsers();
    if (localUsers.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    // Tenta salvar no Neon Postgres
    if (sql) {
      try {
        await ensureNeonTableExists();
        const existing = await sql`
          SELECT id FROM nutricionistas WHERE LOWER(email) = ${email} LIMIT 1;
        `;
        if (existing && existing.length > 0) {
          throw new Error('Este e-mail já está cadastrado no banco de dados.');
        }

        const inserted = await sql`
          INSERT INTO nutricionistas (nome, email, senha)
          VALUES (${nome}, ${email}, ${senha})
          RETURNING id, nome, email, created_at;
        `;

        if (inserted && inserted.length > 0) {
          const user: Nutricionista = {
            id: inserted[0].id,
            nome: inserted[0].nome,
            email: inserted[0].email,
            created_at: inserted[0].created_at,
          };
          // Salva também cópia local para consistência
          saveLocalUser({ ...user, senha });
          this.setSession(user, `neon_token_${Date.now()}`);
          return user;
        }
      } catch (err: any) {
        console.warn('Erro ao salvar no Neon Postgres:', err);
        if (err.message && err.message.includes('já está cadastrado')) {
          throw err;
        }
      }
    }

    // Fallback: Salva localmente
    const newUser: Nutricionista & { senha: string } = {
      id: crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`,
      nome,
      email,
      senha,
      created_at: new Date().toISOString(),
    };

    saveLocalUser(newUser);

    const user: Nutricionista = {
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.email,
      created_at: newUser.created_at,
    };

    this.setSession(user, `local_token_${Date.now()}`);
    return user;
  },

  /**
   * Salva a sessão ativa no localStorage
   */
  setSession(user: Nutricionista, token: string) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  },

  /**
   * Obtém a sessão salva
   */
  getSession(): { user: Nutricionista | null; token: string | null } {
    try {
      const userRaw = localStorage.getItem(STORAGE_KEY_USER);
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (userRaw && token) {
        return { user: JSON.parse(userRaw), token };
      }
    } catch {
      // Ignora erro de parsing
    }
    return { user: null, token: null };
  },

  /**
   * Encerra a sessão
   */
  logout() {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
};
