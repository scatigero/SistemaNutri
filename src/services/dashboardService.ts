import { neon } from '@neondatabase/serverless';
import { DashboardStats, PacienteSemRetorno } from '../types/database';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';

let sql: any = null;
if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch (err) {
    console.warn('[DashboardService] Não foi possível conectar ao Neon:', err);
  }
}

export const dashboardService = {
  /**
   * Obtém as estatísticas do dashboard em tempo real para a nutricionista logada
   */
  async getDashboardStats(nutricionistaId: string): Promise<DashboardStats> {
    if (!nutricionistaId) {
      return {
        totalPacientes: 0,
        consultasSemana: 0,
        pacientesSemRetorno: [],
      };
    }

    if (!sql) {
      console.warn('[DashboardService] Neon SQL não disponível, retornando estatísticas vazias.');
      return {
        totalPacientes: 0,
        consultasSemana: 0,
        pacientesSemRetorno: [],
      };
    }

    try {
      // 1. Total de pacientes cadastrados pela nutricionista
      const pacientesQuery = await sql`
        SELECT count(*)::int as total
        FROM public.pacientes
        WHERE nutricionista_id = ${nutricionistaId}::uuid;
      `;
      const totalPacientes = pacientesQuery?.[0]?.total ? Number(pacientesQuery[0].total) : 0;

      // 2. Consultas registradas na semana atual (segunda a domingo da semana corrente)
      const consultasSemanaQuery = await sql`
        SELECT count(*)::int as total
        FROM public.consultas c
        JOIN public.pacientes p ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${nutricionistaId}::uuid
          AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
          AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + interval '6 days 23 hours 59 minutes');
      `;
      const consultasSemana = consultasSemanaQuery?.[0]?.total ? Number(consultasSemanaQuery[0].total) : 0;

      // 3. Pacientes cuja última consulta foi há mais de 30 dias e não possuem próximo retorno agendado
      const pacientesSemRetornoQuery = await sql`
        WITH ultimas_consultas AS (
          SELECT 
            c.paciente_id,
            MAX(c.data_consulta) as ultima_data,
            MAX(c.proximo_retorno) as max_proximo_retorno
          FROM public.consultas c
          JOIN public.pacientes p ON p.id = c.paciente_id
          WHERE p.nutricionista_id = ${nutricionistaId}::uuid
          GROUP BY c.paciente_id
        )
        SELECT 
          p.id,
          p.nome,
          p.email,
          p.whatsapp,
          TO_CHAR(uc.ultima_data, 'YYYY-MM-DD') as ultima_consulta,
          (CURRENT_DATE - uc.ultima_data)::int as dias_sem_consulta
        FROM ultimas_consultas uc
        JOIN public.pacientes p ON p.id = uc.paciente_id
        WHERE (uc.max_proximo_retorno IS NULL OR uc.max_proximo_retorno < CURRENT_DATE)
          AND uc.ultima_data < (CURRENT_DATE - INTERVAL '30 days')
        ORDER BY uc.ultima_data ASC;
      `;

      const pacientesSemRetorno: PacienteSemRetorno[] = (pacientesSemRetornoQuery || []).map((row: any) => ({
        id: row.id,
        nome: row.nome,
        email: row.email || null,
        whatsapp: row.whatsapp || null,
        ultima_consulta: row.ultima_consulta,
        dias_sem_consulta: Number(row.dias_sem_consulta) || 0,
      }));

      return {
        totalPacientes,
        consultasSemana,
        pacientesSemRetorno,
      };
    } catch (error) {
      console.error('[DashboardService] Erro ao carregar estatísticas do Neon:', error);
      throw error;
    }
  },
};
