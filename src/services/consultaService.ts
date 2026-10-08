import { neon } from '@neondatabase/serverless';
import { Consulta } from '../types/database';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';

let sql: any = null;
if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch (err) {
    console.warn('[ConsultaService] Não foi possível conectar ao Neon:', err);
  }
}

export interface CreateConsultaData {
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
}

export const consultaService = {
  /**
   * Busca todas as consultas de um paciente ordenadas cronologicamente (decrescente)
   */
  async getConsultasByPatient(patientId: string): Promise<Consulta[]> {
    if (!patientId || !sql) return [];

    try {
      const rows = await sql`
        SELECT 
          id,
          paciente_id,
          TO_CHAR(data_consulta, 'YYYY-MM-DD') as data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          TO_CHAR(proximo_retorno, 'YYYY-MM-DD') as proximo_retorno,
          created_at
        FROM public.consultas
        WHERE paciente_id = ${patientId}::uuid
        ORDER BY data_consulta DESC, created_at DESC;
      `;
      return rows || [];
    } catch (error) {
      console.error('[ConsultaService] Erro ao buscar consultas do paciente:', error);
      throw error;
    }
  },

  /**
   * Salva uma nova consulta no banco Neon
   */
  async createConsulta(data: CreateConsultaData): Promise<Consulta> {
    if (!sql) throw new Error('Banco de dados não disponível');

    try {
      const rows = await sql`
        INSERT INTO public.consultas (
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno
        ) VALUES (
          ${data.paciente_id}::uuid,
          ${data.data_consulta}::date,
          ${data.peso ?? null},
          ${data.cintura ?? null},
          ${data.quadril ?? null},
          ${data.percentual_gordura ?? null},
          ${data.observacoes || null},
          ${data.proximo_retorno ? data.proximo_retorno : null}
        )
        RETURNING 
          id,
          paciente_id,
          TO_CHAR(data_consulta, 'YYYY-MM-DD') as data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          TO_CHAR(proximo_retorno, 'YYYY-MM-DD') as proximo_retorno,
          created_at;
      `;

      if (!rows || rows.length === 0) {
        throw new Error('Nenhum registro retornado ao salvar consulta.');
      }

      return rows[0];
    } catch (error) {
      console.error('[ConsultaService] Erro ao criar consulta:', error);
      throw error;
    }
  },
};
