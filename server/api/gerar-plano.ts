import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Connect } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Lê diretamente do arquivo .env em tempo real se não estiver no process.env
 */
function getApiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY.trim();
  if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY.trim();
  if (process.env.VITE_GOOGLE_API_KEY) return process.env.VITE_GOOGLE_API_KEY.trim();

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GEMINI_API_KEY=')) {
          return trimmed.replace('GEMINI_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
        }
        if (trimmed.startsWith('GOOGLE_API_KEY=')) {
          return trimmed.replace('GOOGLE_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
        }
        if (trimmed.startsWith('VITE_GEMINI_API_KEY=')) {
          return trimmed.replace('VITE_GEMINI_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao ler .env manualmente:', e);
  }

  return '';
}

export async function handleGerarPlano(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Método não permitido. Use POST.' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      let parsedBody: any = {};
      try {
        parsedBody = JSON.parse(body || '{}');
      } catch (parseError) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Formato JSON inválido no corpo da requisição.' }));
        return;
      }

      const { dados_do_paciente } = parsedBody;

      if (!dados_do_paciente) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'O campo dados_do_paciente é obrigatório.' }));
        return;
      }

      const apiKey = getApiKey();

      if (!apiKey) {
        console.error('[/api/gerar-plano] Chave GEMINI_API_KEY não configurada no backend.');
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error:
              'A chave GEMINI_API_KEY não foi encontrada no arquivo .env. Por favor, adicione GEMINI_API_KEY no seu arquivo .env.',
          })
        );
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      // Schema estruturado para garantir 100% de integridade no retorno JSON
      const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
          plano_semanal: {
            type: SchemaType.ARRAY,
            description: 'Lista com o cardápio estruturado para os dias da semana',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                dia: {
                  type: SchemaType.STRING,
                  description: 'Dia da semana (ex: Segunda-feira, Terça-feira, etc.)',
                },
                refeicoes: {
                  type: SchemaType.OBJECT,
                  properties: {
                    cafe_da_manha: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: '5 opções saudáveis de alimentos/preparações',
                    },
                    lanche_manha: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: '5 opções saudáveis de alimentos/preparações',
                    },
                    almoco: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: '5 opções saudáveis de alimentos/preparações',
                    },
                    lanche_tarde: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: '5 opções saudáveis de alimentos/preparações',
                    },
                    jantar: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: '5 opções saudáveis de alimentos/preparações',
                    },
                  },
                  required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
                },
              },
              required: ['dia', 'refeicoes'],
            },
          },
        },
        required: ['plano_semanal'],
      };

      // Modelo configurado com Structured Outputs
      let model;
      try {
        model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema as any,
            temperature: 0.7,
          },
        });
      } catch {
        model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema as any,
            temperature: 0.7,
          },
        });
      }

      const promptText = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${typeof dados_do_paciente === 'string' ? dados_do_paciente : JSON.stringify(dados_do_paciente, null, 2)}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`.trim();

      const result = await model.generateContent(promptText);
      const rawResponse = result.response.text();

      // Limpeza preventiva caso venha qualquer marcação
      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const jsonParsed = JSON.parse(cleanJson);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(jsonParsed));
    } catch (error: any) {
      console.error('[/api/gerar-plano] Erro ao processar geração com IA:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            error?.message ||
            'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        })
      );
    }
  });
}

/**
 * Middleware para integração com Vite dev server
 */
export function viteGerarPlanoPlugin() {
  return {
    name: 'vite-plugin-gerar-plano',
    configureServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/gerar-plano') {
          handleGerarPlano(req, res);
          return;
        }
        next();
      });
    },
  };
}
