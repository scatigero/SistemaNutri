import React, { useState, useEffect } from 'react';
import { Paciente, PlanoAlimentar, ConteudoPlanoAlimentar, RefeicoesDia } from '../types/database';
import { planoService } from '../services/planoService';
import {
  Sparkles,
  Utensils,
  Calendar,
  Save,
  Check,
  AlertCircle,
  Clock,
  Plus,
  ArrowLeft,
  Edit3,
  Coffee,
  Apple,
  Sun,
  Cookie,
  Moon,
  Loader2,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from './ui/Button';

interface PlanosAlimentaresSectionProps {
  patient: Paciente;
}

const REFEICOES_CONFIG = [
  { key: 'cafe_da_manha' as keyof RefeicoesDia, label: 'Café da Manhã', icon: Coffee, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'lanche_manha' as keyof RefeicoesDia, label: 'Lanche da Manhã', icon: Apple, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'almoco' as keyof RefeicoesDia, label: 'Almoço', icon: Sun, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { key: 'lanche_tarde' as keyof RefeicoesDia, label: 'Lanche da Tarde', icon: Cookie, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { key: 'jantar' as keyof RefeicoesDia, label: 'Jantar', icon: Moon, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
];

export const PlanosAlimentaresSection: React.FC<PlanosAlimentaresSectionProps> = ({ patient }) => {
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Estados de Geração e Edição
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando Inteligência Artificial...');
  const [isSaving, setIsSaving] = useState(false);

  // Estado do plano ativo sendo criado / editado
  const [currentPlano, setCurrentPlano] = useState<ConteudoPlanoAlimentar | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Visualização de plano do histórico
  const [viewingPlano, setViewingPlano] = useState<PlanoAlimentar | null>(null);
  const [viewingDayIndex, setViewingDayIndex] = useState(0);

  // Feedback e Toasts
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Carregar histórico de planos salvos no banco Neon
  const loadPlanos = async () => {
    if (!patient?.id) return;
    setIsLoadingHistory(true);
    try {
      const data = await planoService.getPlanosByPatient(patient.id);
      setPlanos(data);
    } catch (err: any) {
      console.error('Erro ao carregar histórico de planos:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPlanos();
  }, [patient?.id]);

  // Mensagens dinâmicas no loading
  useEffect(() => {
    if (!isGenerating) return;

    const messages = [
      'Buscando dados e objetivos do paciente...',
      'Analisando restrições alimentares e alergias...',
      'IA calculando cardápio saudável e variado...',
      'Estruturando 5 opções por refeição...',
      'Finalizando plano alimentar personalizado...',
    ];

    let current = 0;
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      current = (current + 1) % messages.length;
      setLoadingMessage(messages[current]);
    }, 2400);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // ── AÇÃO: GERAR PLANO COM IA ──
  const handleGerarPlanoIA = async () => {
    setIsGenerating(true);
    setToastMessage(null);

    try {
      // Monta dados do paciente completos para a IA
      const dadosDoPaciente = {
        nome: patient.nome,
        idade: patient.data_nascimento
          ? new Date().getFullYear() - new Date(patient.data_nascimento).getFullYear()
          : 'Não informada',
        sexo: patient.sexo || 'Não informado',
        peso_atual_kg: patient.peso_inicial || 'Não informado',
        altura_cm: patient.altura || 'Não informada',
        objetivos: patient.objetivos && patient.objetivos.length > 0 ? patient.objetivos : [patient.objetivo_texto || 'Saúde e reeducação alimentar'],
        nivel_atividade_fisica: patient.nivel_atividade || 'Moderado',
        pratica_exercicio: patient.atividade_fisica ? patient.atividade_fisica_descricao || 'Sim' : 'Não',
        restricoes_alimentares: patient.restricoes_alimentares || [],
        alergias_alimentares: patient.alergias || [],
        patologias: patient.patologias || [],
        medicamentos: patient.medicamentos || 'Nenhum',
        suplementos: patient.suplementos || 'Nenhum',
        refeicoes_por_dia: patient.refeicoes_por_dia || 5,
        rotina: {
          horario_acorda: patient.horario_acorda || '06:30',
          horario_dorme: patient.horario_dorme || '22:30',
          litros_agua: patient.litros_agua || 2.5,
        },
        observacoes_adicionais: patient.observacoes || 'Nenhuma',
      };

      const planoGerado = await planoService.gerarPlanoComIA(dadosDoPaciente);
      setCurrentPlano(planoGerado);
      setActiveDayIndex(0);
      setViewingPlano(null);
      showToast('Plano alimentar gerado com sucesso pela IA! Você pode editá-lo abaixo.', 'success');
    } catch (err: any) {
      console.error('Erro ao gerar plano alimentar com IA:', err);
      showToast(
        err.message || 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ── AÇÃO: CRIAR PLANO MANUAL ──
  const handleCriarPlanoManual = () => {
    const planoVazio = planoService.criarPlanoManualVazio();
    setCurrentPlano(planoVazio);
    setActiveDayIndex(0);
    setViewingPlano(null);
    showToast('Modo de criação manual iniciado. Preencha as opções de cada dia.', 'success');
  };

  // ── AÇÃO: ATUALIZAR ITEM DE REFEIÇÃO (INPUT EDITÁVEL) ──
  const handleOptionChange = (dayIdx: number, mealKey: keyof RefeicoesDia, optionIdx: number, value: string) => {
    if (!currentPlano) return;

    const newPlano = JSON.parse(JSON.stringify(currentPlano)) as ConteudoPlanoAlimentar;
    if (newPlano.plano_semanal[dayIdx]?.refeicoes[mealKey]) {
      newPlano.plano_semanal[dayIdx].refeicoes[mealKey][optionIdx] = value;
      setCurrentPlano(newPlano);
    }
  };

  // ── AÇÃO: SALVAR PLANO ALIMENTAR NO BANCO NEON ──
  const handleSalvarPlano = async () => {
    if (!currentPlano || !patient.id) return;

    setIsSaving(true);
    try {
      await planoService.savePlano(patient.id, currentPlano);
      showToast('Plano alimentar salvo com sucesso no banco de dados!', 'success');
      setCurrentPlano(null);
      await loadPlanos();
    } catch (err: any) {
      console.error('Erro ao salvar plano alimentar:', err);
      showToast('Erro ao salvar plano alimentar no banco Neon. Tente novamente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const activeDay = currentPlano?.plano_semanal[activeDayIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── TOAST DE NOTIFICAÇÃO / ALERTA ── */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <div className="p-1.5 bg-emerald-100 rounded-xl">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            ) : (
              <div className="p-1.5 bg-rose-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
            )}
            <p className="text-xs sm:text-sm font-semibold">{toastMessage.text}</p>
          </div>

          {toastMessage.type === 'error' && !currentPlano && (
            <Button
              variant="outline"
              onClick={handleCriarPlanoManual}
              className="text-xs py-1.5 px-3 bg-white text-rose-700 border-rose-200 hover:bg-rose-100"
            >
              Criar Manual
            </Button>
          )}
        </div>
      )}

      {/* ── CARD 1: CABEÇALHO COM BOTÃO "✨ GERAR PLANO COM IA" ── */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>Geração Automatizada com Gemini AI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Planos Alimentares
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Gere cardápios semanais completos e balanceados para <b>{patient.nome}</b> com base em seus objetivos, alergias e preferências.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Button
              variant="secondary"
              onClick={handleGerarPlanoIA}
              disabled={isGenerating || isSaving}
              className="bg-white text-emerald-900 hover:bg-emerald-50 text-sm font-bold py-3.5 px-6 rounded-2xl shadow-lg border-0 flex items-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Gerando cardápio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>✨ Gerar Plano com IA</span>
                </>
              )}
            </Button>

            {!currentPlano && (
              <Button
                variant="outline"
                onClick={handleCriarPlanoManual}
                disabled={isGenerating || isSaving}
                className="bg-emerald-900/40 text-white border-white/20 hover:bg-emerald-900/60 text-xs font-semibold py-3 px-4 rounded-2xl backdrop-blur-xs flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Manual</span>
              </Button>
            )}
          </div>
        </div>

        {/* Loading Visual com Mensagens Dinâmicas */}
        {isGenerating && (
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-emerald-200 animate-spin" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-sm font-bold text-white">{loadingMessage}</p>
              <p className="text-xs text-emerald-200 mt-0.5">
                Consultando o modelo Gemini estruturado para nutrição brasileira...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD 2: INTERFACE DE EDIÇÃO INTERATIVA (SE HOUVER PLANO EM EDIÇÃO) ── */}
      {currentPlano && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500/80 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Header da Área de Edição */}
          <div className="p-6 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Editar Plano Alimentar Semanal
                </h3>
                <p className="text-xs text-slate-500">
                  Altere qualquer uma das 5 opções de refeição antes de salvar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                onClick={() => setCurrentPlano(null)}
                disabled={isSaving}
                className="text-xs"
              >
                Descartar
              </Button>
              <Button
                variant="primary"
                onClick={handleSalvarPlano}
                disabled={isSaving}
                className="text-xs sm:text-sm font-bold flex items-center gap-2 py-2.5 px-5 shadow-md shadow-emerald-600/30"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando no Neon...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Plano Alimentar</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Abas (Tabs) para separar os Dias da Semana */}
          <div className="border-b border-slate-100 bg-slate-50/60 p-2 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              {currentPlano.plano_semanal.map((diaObj, idx) => {
                const isActive = activeDayIndex === idx;
                return (
                  <button
                    key={diaObj.dia || idx}
                    type="button"
                    onClick={() => setActiveDayIndex(idx)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                        : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/80'
                    }`}
                  >
                    {diaObj.dia}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo do Dia Ativo — 5 Refeições com 5 Inputs Editáveis cada */}
          {activeDay && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Cardápio de {activeDay.dia}
                </h4>
                <span className="text-xs text-slate-400">
                  5 opções por refeição
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {REFEICOES_CONFIG.map((refeicao) => {
                  const MealIcon = refeicao.icon;
                  const optionsList: string[] =
                    activeDay.refeicoes[refeicao.key] || ['', '', '', '', ''];

                  return (
                    <div
                      key={refeicao.key}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3"
                    >
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
                        <div className={`p-1.5 rounded-xl border ${refeicao.color}`}>
                          <MealIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">
                          {refeicao.label}
                        </span>
                      </div>

                      {/* 5 inputs de texto preenchidos pela IA ou em branco */}
                      <div className="space-y-2">
                        {[0, 1, 2, 3, 4].map((optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                              {optIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={optionsList[optIdx] || ''}
                              onChange={(e) =>
                                handleOptionChange(
                                  activeDayIndex,
                                  refeicao.key,
                                  optIdx,
                                  e.target.value
                                )
                              }
                              placeholder={`Opção ${optIdx + 1} de ${refeicao.label.toLowerCase()}...`}
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/10 transition-all shadow-2xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de Salvar no rodapé da edição */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeDayIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveDayIndex((prev) => prev - 1)}
                      className="text-xs"
                    >
                      ← Dia anterior
                    </Button>
                  )}
                  {activeDayIndex < currentPlano.plano_semanal.length - 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveDayIndex((prev) => prev + 1)}
                      className="text-xs"
                    >
                      Próximo dia →
                    </Button>
                  )}
                </div>

                <Button
                  variant="primary"
                  onClick={handleSalvarPlano}
                  disabled={isSaving}
                  className="text-xs sm:text-sm font-bold flex items-center gap-2 py-2.5 px-6 shadow-md shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Plano Alimentar</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CARD 3: HISTÓRICO DE PLANOS ALIMENTARES SALVOS NO BANCO NEON ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Histórico de Planos Salvos</h3>
              <p className="text-xs text-slate-400">
                {planos.length} {planos.length === 1 ? 'plano registrado' : 'planos registrados'} no Neon
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={loadPlanos}
            disabled={isLoadingHistory}
            className="text-xs py-1.5 px-3"
          >
            Atualizar
          </Button>
        </div>

        {isLoadingHistory ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Buscando histórico no Neon...</p>
          </div>
        ) : planos.length === 0 ? (
          <div className="py-14 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Utensils className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">
                Nenhum plano alimentar gerado ainda
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clique no botão <b>"✨ Gerar Plano com IA"</b> acima para criar um plano semanal completo e personalizado.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planos.map((plano, idx) => {
              const dataFormatada = new Date(plano.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const qtdDias = plano.conteudo?.plano_semanal?.length || 7;

              return (
                <div
                  key={plano.id || idx}
                  onClick={() => {
                    setViewingPlano(plano);
                    setViewingDayIndex(0);
                  }}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group space-y-3 bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          Plano Semanal #{planos.length - idx}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {dataFormatada}
                      </span>
                    </div>

                    <span className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      {qtdDias} dias estruturados
                    </span>
                    <span className="font-semibold text-emerald-600 group-hover:underline">
                      Ver detalhes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL DE VISUALIZAÇÃO COMPLETA DE PLANO SALVO ── */}
      {viewingPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingPlano(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-lg font-bold">Plano Alimentar Salvo</h3>
                  <p className="text-xs text-emerald-100">
                    Paciente: {patient.nome} · Gerado em{' '}
                    {new Date(viewingPlano.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPlano(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Abas dos dias no modal */}
            <div className="border-b border-slate-100 bg-slate-50 p-2 overflow-x-auto">
              <div className="flex gap-1.5 min-w-max">
                {viewingPlano.conteudo.plano_semanal.map((diaObj, idx) => {
                  const isActive = viewingDayIndex === idx;
                  return (
                    <button
                      key={diaObj.dia || idx}
                      type="button"
                      onClick={() => setViewingDayIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {diaObj.dia}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visualização das refeições do dia */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {viewingPlano.conteudo.plano_semanal[viewingDayIndex] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REFEICOES_CONFIG.map((refeicao) => {
                    const MealIcon = refeicao.icon;
                    const optionsList: string[] =
                      viewingPlano.conteudo.plano_semanal[viewingDayIndex].refeicoes[
                        refeicao.key
                      ] || [];

                    const filteredOptions = optionsList.filter((opt) => opt && opt.trim() !== '');

                    return (
                      <div
                        key={refeicao.key}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 pb-1.5 border-b border-slate-200/80">
                          <div className={`p-1.5 rounded-lg border ${refeicao.color}`}>
                            <MealIcon className="w-3.5 h-3.5" />
                          </div>
                          <span>{refeicao.label}</span>
                        </div>

                        {filteredOptions.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Nenhuma opção registrada.
                          </p>
                        ) : (
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {filteredOptions.map((opt, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="flex-1 leading-relaxed">{opt}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentPlano(JSON.parse(JSON.stringify(viewingPlano.conteudo)));
                  setViewingPlano(null);
                }}
                className="text-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Carregar e Editar este Plano</span>
              </Button>
              <Button variant="secondary" onClick={() => setViewingPlano(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
