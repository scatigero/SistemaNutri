import React, { useState } from 'react';
import { Paciente, Consulta } from '../types/database';
import { CreateConsultaData } from '../services/consultaService';
import {
  Calendar,
  Weight,
  Ruler,
  TrendingDown,
  TrendingUp,
  Percent,
  Plus,
  X,
  FileText,
  CalendarCheck,
  Sparkles,
  AlertCircle,
  Activity,
  History,
} from 'lucide-react';
import { Button } from './ui/Button';

interface ConsultasSectionProps {
  patient: Paciente;
  consultas: Consulta[];
  isLoading: boolean;
  onSaveConsulta: (data: CreateConsultaData) => Promise<void>;
}

export const ConsultasSection: React.FC<ConsultasSectionProps> = ({
  patient,
  consultas,
  isLoading,
  onSaveConsulta,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [dataConsulta, setDataConsulta] = useState(today);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');

  const openModal = () => {
    setDataConsulta(new Date().toISOString().split('T')[0]);
    setPeso('');
    setCintura('');
    setQuadril('');
    setPercentualGordura('');
    setObservacoes('');
    setProximoRetorno('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataConsulta) {
      setError('A data da consulta é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSaveConsulta({
        paciente_id: patient.id,
        data_consulta: dataConsulta,
        peso: peso ? parseFloat(peso) : null,
        cintura: cintura ? parseFloat(cintura) : null,
        quadril: quadril ? parseFloat(quadril) : null,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura) : null,
        observacoes: observacoes.trim() || null,
        proximo_retorno: proximoRetorno || null,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar consulta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preparar dados do gráfico em ordem cronológica ascendente
  // Começamos com peso inicial (se houver) e depois cada consulta que tenha peso registrado
  const weightPoints: { date: string; displayDate: string; weight: number; isInitial?: boolean }[] = [];

  if (patient.peso_inicial && patient.created_at) {
    const initialDateStr = patient.created_at.split('T')[0];
    weightPoints.push({
      date: initialDateStr,
      displayDate: new Date(patient.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weight: Number(patient.peso_inicial),
      isInitial: true,
    });
  }

  // Ordenar consultas cronologicamente (mais antiga para mais recente) para o gráfico
  const sortedAscConsultas = [...consultas].sort(
    (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
  );

  sortedAscConsultas.forEach((c) => {
    if (c.peso !== null && c.peso !== undefined && !isNaN(Number(c.peso))) {
      weightPoints.push({
        date: c.data_consulta,
        displayDate: new Date(c.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        weight: Number(c.peso),
      });
    }
  });

  // Estatísticas de evolução
  const latestWeight =
    sortedAscConsultas.filter((c) => c.peso).slice(-1)[0]?.peso || patient.peso_inicial || null;
  const initialWeight = patient.peso_inicial || (sortedAscConsultas[0]?.peso ?? null);
  const weightDiff =
    latestWeight && initialWeight ? (Number(latestWeight) - Number(initialWeight)).toFixed(1) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── CARD 1: GRÁFICO DE EVOLUÇÃO DE PESO EM DESTAQUE ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
              <Activity className="w-4 h-4" />
              <span>Acompanhamento Antropométrico</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Evolução de Peso
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Resumo da variação */}
            {weightDiff !== null && weightPoints.length > 1 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  Number(weightDiff) <= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {Number(weightDiff) <= 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                )}
                <span>
                  {Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg desde o início
                </span>
              </div>
            )}

            <Button
              variant="primary"
              onClick={openModal}
              className="text-xs flex items-center gap-2 py-2.5 px-4 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Nova Consulta
            </Button>
          </div>
        </div>

        {/* Gráfico SVG customizado, dinâmico e responsivo */}
        <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-4 sm:p-6">
          {weightPoints.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-dashed border-slate-300 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                <Weight className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                Nenhuma consulta registrada ainda
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cadastre a primeira consulta clicando em "Nova Consulta" acima para visualizar o gráfico de evolução.
              </p>
            </div>
          ) : weightPoints.length === 1 ? (
            <div className="py-10 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>1º registro: {weightPoints[0].weight} kg ({weightPoints[0].displayDate})</span>
              </div>
              <p className="text-xs text-slate-400">
                Adicione mais consultas para traçar a linha de progresso do peso.
              </p>
            </div>
          ) : (
            <WeightChart points={weightPoints} />
          )}
        </div>
      </div>

      {/* ── CARD 2: LISTA DE TODAS AS CONSULTAS ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Histórico de Consultas</h3>
              <p className="text-xs text-slate-400">
                {consultas.length} {consultas.length === 1 ? 'consulta realizada' : 'consultas realizadas'}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Buscando consultas no banco Neon...</p>
          </div>
        ) : consultas.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</p>
            <p className="text-xs text-slate-400">
              Clique no botão "Nova Consulta" para registrar a primeira avaliação.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultas.map((consulta, index) => {
              const formattedDate = new Date(consulta.data_consulta + 'T00:00:00').toLocaleDateString(
                'pt-BR',
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
              );
              const formattedRetorno = consulta.proximo_retorno
                ? new Date(consulta.proximo_retorno + 'T00:00:00').toLocaleDateString('pt-BR')
                : null;

              return (
                <div
                  key={consulta.id || index}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-xs transition-all space-y-4"
                >
                  {/* Cabeçalho do card de consulta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="font-bold text-slate-900 text-sm capitalize">
                        {formattedDate}
                      </h4>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                          Mais recente
                        </span>
                      )}
                    </div>

                    {formattedRetorno ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 self-start sm:self-auto">
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Próximo Retorno: {formattedRetorno}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 self-start sm:self-auto">
                        Sem retorno definido
                      </span>
                    )}
                  </div>

                  {/* Medidas da consulta */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5 text-emerald-600" /> Peso
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {consulta.peso ? `${consulta.peso} kg` : '—'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-teal-600" /> Cintura
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {consulta.cintura ? `${consulta.cintura} cm` : '—'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-teal-600" /> Quadril
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {consulta.quadril ? `${consulta.quadril} cm` : '—'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-indigo-600" /> % Gordura
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {consulta.percentual_gordura ? `${consulta.percentual_gordura}%` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Observações */}
                  {consulta.observacoes && (
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Observações da consulta:
                      </p>
                      <p className="whitespace-pre-line leading-relaxed text-slate-600 pl-5">
                        {consulta.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL NOVA CONSULTA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Nova Consulta</h3>
                  <p className="text-xs text-emerald-100">
                    Paciente: <span className="font-semibold">{patient.nome}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Data da consulta */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Data da Consulta *
                </label>
                <input
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              {/* Peso & % Gordura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Peso atual em kg
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 70.5"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    % de gordura (opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="Ex: 18.5"
                      value={percentualGordura}
                      onChange={(e) => setPercentualGordura(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all pr-10"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Cintura & Quadril */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Cintura em cm (opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Ex: 82"
                      value={cintura}
                      onChange={(e) => setCintura(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Quadril em cm (opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Ex: 98"
                      value={quadril}
                      onChange={(e) => setQuadril(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Observações e anotações clínicas
                </label>
                <textarea
                  rows={3}
                  placeholder="Relato do paciente, adaptações da dieta, sintomas, evolução..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                />
              </div>

              {/* Próximo Retorno */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Próximo Retorno (opcional)
                </label>
                <input
                  type="date"
                  value={proximoRetorno}
                  onChange={(e) => setProximoRetorno(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Consulta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── COMPONENTE DO GRÁFICO SVG COM INTERAÇÃO ──
interface ChartPoint {
  date: string;
  displayDate: string;
  weight: number;
  isInitial?: boolean;
}

const WeightChart: React.FC<{ points: ChartPoint[] }> = ({ points }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = (maxW - minW) * 0.2 || 2;
  const chartMin = Math.max(0, Math.floor(minW - padding));
  const chartMax = Math.ceil(maxW + padding);

  const width = 600;
  const height = 220;
  const padX = 50;
  const padY = 30;

  const getX = (index: number) => {
    if (points.length === 1) return width / 2;
    return padX + (index / (points.length - 1)) * (width - padX * 2);
  };

  const getY = (weight: number) => {
    if (chartMax === chartMin) return height / 2;
    return height - padY - ((weight - chartMin) / (chartMax - chartMin)) * (height - padY * 2);
  };

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.weight)}`)
    .join(' ');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - padY} L ${getX(0)} ${
    height - padY
  } Z`;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[480px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 sm:h-56 select-none">
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontais */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = chartMin + (chartMax - chartMin) * (1 - ratio);
            const y = padY + ratio * (height - padY * 2);
            return (
              <g key={ratio}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  {val.toFixed(0)} kg
                </text>
              </g>
            );
          })}

          {/* Área preenchida */}
          <path d={areaD} fill="url(#weightAreaGrad)" />

          {/* Linha principal da curva */}
          <path d={pathD} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" />

          {/* Pontos de dados e labels de data */}
          {points.map((p, i) => {
            const x = getX(i);
            const y = getY(p.weight);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={i}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Linha vertical tracejada ao passar o mouse */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padY}
                    x2={x}
                    y2={height - padY}
                    stroke="#10b981"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                  />
                )}

                {/* Círculo do ponto */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 5}
                  fill={p.isInitial ? '#0d9488' : '#059669'}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150 drop-shadow-sm"
                />

                {/* Label da data no eixo X */}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? '#059669' : '#64748b'}
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {p.displayDate}
                </text>

                {/* Badge com o valor de peso acima do ponto */}
                <g transform={`translate(${x}, ${y - 14})`}>
                  <rect
                    x="-20"
                    y="-14"
                    width="40"
                    height="16"
                    rx="6"
                    fill={isHovered ? '#064e3b' : '#059669'}
                    className="transition-colors"
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                  >
                    {p.weight} kg
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
