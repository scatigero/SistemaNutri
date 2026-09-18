import React, { useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { Paciente, Consulta } from '../types/database';
import { X, Phone, Mail, Calendar, Weight, Ruler } from 'lucide-react';
import { Button } from './ui/Button';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || '';
let sql: any = null;
if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch (e) {
    console.warn(e);
  }
}

interface PatientDetailModalProps {
  patientId: string | null;
  onClose: () => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !sql) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const pRows = await sql`
          SELECT * FROM public.pacientes WHERE id = ${patientId}::uuid LIMIT 1;
        `;
        if (pRows && pRows.length > 0) {
          setPatient(pRows[0]);
        }

        const cRows = await sql`
          SELECT * FROM public.consultas WHERE paciente_id = ${patientId}::uuid ORDER BY data_consulta DESC;
        `;
        setConsultas(cRows || []);
      } catch (err) {
        console.error('Erro ao carregar detalhes do paciente:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  if (!patientId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-bold border border-white/20">
              {patient?.nome ? patient.nome.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{patient?.nome || 'Carregando...'}</h3>
              <p className="text-xs text-emerald-100">Prontuário e Histórico Clínico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">Buscando dados no Neon Database...</p>
            </div>
          ) : !patient ? (
            <div className="py-8 text-center text-slate-500">Paciente não encontrado.</div>
          ) : (
            <>
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">E-mail</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{patient.email || 'Não informado'}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">WhatsApp</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{patient.whatsapp || 'Não informado'}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Weight className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Peso Inicial</p>
                    <p className="text-sm font-medium text-slate-800">
                      {patient.peso_inicial ? `${patient.peso_inicial} kg` : 'Não informado'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Ruler className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Altura</p>
                    <p className="text-sm font-medium text-slate-800">
                      {patient.altura ? `${patient.altura} cm` : 'Não informada'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Histórico de Consultas */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Histórico de Consultas ({consultas.length})
                </h4>

                {consultas.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    Nenhuma consulta registrada para este paciente até o momento.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {consultas.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            Consulta em {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {c.peso ? `Peso: ${c.peso}kg ` : ''}
                            {c.percentual_gordura ? `| % Gordura: ${c.percentual_gordura}%` : ''}
                          </p>
                        </div>
                        {c.proximo_retorno ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                            Retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200 text-[11px]">
                            Sem retorno agendado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
