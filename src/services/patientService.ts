import { neon } from '@neondatabase/serverless';
import { Paciente } from '../types/database';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';

let sql: any = null;
if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch (err) {
    console.warn('[PatientService] Não foi possível conectar ao Neon:', err);
  }
}

export interface PatientWithLastConsulta extends Paciente {
  ultima_consulta?: string | null;
}

export interface CreatePatientData {
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
}

export interface UpdatePatientData extends Partial<CreatePatientData> {}

export const patientService = {
  /**
   * Lista todos os pacientes da nutricionista com a data da última consulta
   */
  async getPatients(nutricionistaId: string): Promise<PatientWithLastConsulta[]> {
    if (!nutricionistaId || !sql) return [];

    try {
      const rows = await sql`
        SELECT 
          p.*,
          TO_CHAR(uc.ultima_data, 'YYYY-MM-DD') as ultima_consulta
        FROM public.pacientes p
        LEFT JOIN (
          SELECT paciente_id, MAX(data_consulta) as ultima_data
          FROM public.consultas
          GROUP BY paciente_id
        ) uc ON uc.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutricionistaId}::uuid
        ORDER BY p.created_at DESC;
      `;
      return rows || [];
    } catch (error) {
      console.error('[PatientService] Erro ao listar pacientes:', error);
      throw error;
    }
  },

  /**
   * Busca os dados completos de um único paciente por ID
   */
  async getPatientById(patientId: string): Promise<Paciente | null> {
    if (!patientId || !sql) return null;

    try {
      const rows = await sql`
        SELECT 
          id,
          nutricionista_id,
          nome,
          TO_CHAR(data_nascimento, 'YYYY-MM-DD') as data_nascimento,
          sexo,
          telefone,
          whatsapp,
          email,
          peso_inicial,
          altura,
          objetivos,
          objetivo_texto,
          nivel_atividade,
          patologias,
          restricoes_alimentares,
          alergias,
          medicamentos,
          suplementos,
          refeicoes_por_dia,
          horario_acorda,
          horario_dorme,
          litros_agua,
          atividade_fisica,
          atividade_fisica_descricao,
          observacoes,
          TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
        FROM public.pacientes
        WHERE id = ${patientId}::uuid
        LIMIT 1;
      `;

      if (!rows || rows.length === 0) return null;
      return rows[0];
    } catch (error) {
      console.error('[PatientService] Erro ao buscar paciente por ID:', error);
      throw error;
    }
  },

  /**
   * Cria um novo paciente no banco de dados e retorna o paciente criado
   */
  async createPatient(data: CreatePatientData): Promise<Paciente> {
    if (!sql) throw new Error('Banco de dados não disponível');

    try {
      const rows = await sql`
        INSERT INTO public.pacientes (
          nutricionista_id, nome, data_nascimento, sexo, telefone, whatsapp, email,
          peso_inicial, altura, objetivos, objetivo_texto, nivel_atividade,
          patologias, restricoes_alimentares, alergias,
          medicamentos, suplementos,
          refeicoes_por_dia, horario_acorda, horario_dorme, litros_agua,
          atividade_fisica, atividade_fisica_descricao, observacoes
        ) VALUES (
          ${data.nutricionista_id}::uuid,
          ${data.nome},
          ${data.data_nascimento || null},
          ${data.sexo || null},
          ${data.telefone || null},
          ${data.whatsapp || null},
          ${data.email || null},
          ${data.peso_inicial ?? null},
          ${data.altura ?? null},
          ${data.objetivos && data.objetivos.length > 0 ? data.objetivos : null},
          ${data.objetivo_texto || null},
          ${data.nivel_atividade || null},
          ${data.patologias && data.patologias.length > 0 ? data.patologias : null},
          ${data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null},
          ${data.alergias && data.alergias.length > 0 ? data.alergias : null},
          ${data.medicamentos || null},
          ${data.suplementos || null},
          ${data.refeicoes_por_dia ?? null},
          ${data.horario_acorda || null},
          ${data.horario_dorme || null},
          ${data.litros_agua ?? null},
          ${data.atividade_fisica ?? null},
          ${data.atividade_fisica_descricao || null},
          ${data.observacoes || null}
        )
        RETURNING *;
      `;

      if (!rows || rows.length === 0) {
        throw new Error('Erro ao salvar paciente: nenhum registro retornado.');
      }

      return rows[0];
    } catch (error) {
      console.error('[PatientService] Erro ao criar paciente:', error);
      throw error;
    }
  },

  /**
   * Atualiza os dados de um paciente existente
   */
  async updatePatient(patientId: string, data: UpdatePatientData): Promise<Paciente> {
    if (!patientId || !sql) throw new Error('Banco de dados não disponível');

    try {
      const rows = await sql`
        UPDATE public.pacientes
        SET
          nome = ${data.nome},
          data_nascimento = ${data.data_nascimento || null},
          sexo = ${data.sexo || null},
          telefone = ${data.telefone || null},
          whatsapp = ${data.whatsapp || null},
          email = ${data.email || null},
          peso_inicial = ${data.peso_inicial ?? null},
          altura = ${data.altura ?? null},
          objetivos = ${data.objetivos && data.objetivos.length > 0 ? data.objetivos : null},
          objetivo_texto = ${data.objetivo_texto || null},
          nivel_atividade = ${data.nivel_atividade || null},
          patologias = ${data.patologias && data.patologias.length > 0 ? data.patologias : null},
          restricoes_alimentares = ${data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null},
          alergias = ${data.alergias && data.alergias.length > 0 ? data.alergias : null},
          medicamentos = ${data.medicamentos || null},
          suplementos = ${data.suplementos || null},
          refeicoes_por_dia = ${data.refeicoes_por_dia ?? null},
          horario_acorda = ${data.horario_acorda || null},
          horario_dorme = ${data.horario_dorme || null},
          litros_agua = ${data.litros_agua ?? null},
          atividade_fisica = ${data.atividade_fisica ?? null},
          atividade_fisica_descricao = ${data.atividade_fisica_descricao || null},
          observacoes = ${data.observacoes || null}
        WHERE id = ${patientId}::uuid
        RETURNING *;
      `;

      if (!rows || rows.length === 0) {
        throw new Error('Paciente não encontrado para atualização.');
      }

      return rows[0];
    } catch (error) {
      console.error('[PatientService] Erro ao atualizar paciente:', error);
      throw error;
    }
  },
};
