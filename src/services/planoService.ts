import { neon } from '@neondatabase/serverless';
import { PlanoAlimentar, ConteudoPlanoAlimentar, DiaPlano } from '../types/database';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';

let sql: any = null;
if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch (err) {
    console.warn('[PlanoService] Não foi possível conectar ao Neon:', err);
  }
}

/**
 * Garante que a tabela `planos_alimentares` exista no banco Neon
 */
async function ensurePlanosTableExists() {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.planos_alimentares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
        conteudo JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (err) {
    console.warn('[PlanoService] Setup table:', err);
  }
}

ensurePlanosTableExists();

export const planoService = {
  /**
   * Busca todos os planos alimentares de um paciente no banco Neon em ordem decrescente
   */
  async getPlanosByPatient(patientId: string): Promise<PlanoAlimentar[]> {
    if (!patientId || !sql) return [];

    try {
      await ensurePlanosTableExists();

      const rows = await sql`
        SELECT 
          id,
          paciente_id,
          conteudo,
          TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
        FROM public.planos_alimentares
        WHERE paciente_id = ${patientId}::uuid
        ORDER BY created_at DESC;
      `;

      return (rows || []).map((row: any) => {
        let parsedConteudo = row.conteudo;
        if (typeof parsedConteudo === 'string') {
          try {
            parsedConteudo = JSON.parse(parsedConteudo);
          } catch {
            parsedConteudo = { plano_semanal: [] };
          }
        }
        return {
          id: row.id,
          paciente_id: row.paciente_id,
          conteudo: parsedConteudo as ConteudoPlanoAlimentar,
          created_at: row.created_at,
        };
      });
    } catch (error) {
      console.error('[PlanoService] Erro ao buscar planos alimentares:', error);
      throw error;
    }
  },

  /**
   * Salva um plano alimentar no banco de dados Neon
   */
  async savePlano(patientId: string, conteudo: ConteudoPlanoAlimentar): Promise<PlanoAlimentar> {
    if (!patientId || !sql) {
      throw new Error('Banco de dados não disponível ou ID de paciente inválido.');
    }

    try {
      await ensurePlanosTableExists();

      const rows = await sql`
        INSERT INTO public.planos_alimentares (
          paciente_id,
          conteudo
        ) VALUES (
          ${patientId}::uuid,
          ${JSON.stringify(conteudo)}::jsonb
        )
        RETURNING 
          id,
          paciente_id,
          conteudo,
          TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at;
      `;

      if (!rows || rows.length === 0) {
        throw new Error('Erro ao salvar plano alimentar: nenhum registro retornado.');
      }

      const row = rows[0];
      let parsed = row.conteudo;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = conteudo;
        }
      }

      return {
        id: row.id,
        paciente_id: row.paciente_id,
        conteudo: parsed,
        created_at: row.created_at,
      };
    } catch (error) {
      console.error('[PlanoService] Erro ao salvar plano alimentar no Neon:', error);
      throw error;
    }
  },

  /**
   * Chama a Serverless Function /api/gerar-plano para gerar o cardápio semanal com Gemini
   */
  async gerarPlanoComIA(dadosDoPaciente: Record<string, any>): Promise<ConteudoPlanoAlimentar> {
    const response = await fetch('/api/gerar-plano', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dados_do_paciente: dadosDoPaciente }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.error ||
          'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?'
      );
    }

    if (!data.plano_semanal || !Array.isArray(data.plano_semanal)) {
      throw new Error('Formato de plano alimentar inválido retornado pela IA.');
    }

    return data as ConteudoPlanoAlimentar;
  },

  /**
   * Gera a estrutura padrão para criação de Plano Manual
   */
  criarPlanoManualVazio(): ConteudoPlanoAlimentar {
    const dias = [
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
      'Domingo',
    ];

    const plano_semanal: DiaPlano[] = dias.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', ''],
      },
    }));

    return { plano_semanal };
  },
};
