import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Paciente, Consulta } from '../types/database';
import { patientService, UpdatePatientData } from '../services/patientService';
import { consultaService, CreateConsultaData } from '../services/consultaService';
import { ConsultasSection } from '../components/ConsultasSection';
import { PlanosAlimentaresSection } from '../components/PlanosAlimentaresSection';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  ArrowLeft,
  User,
  Stethoscope,
  Heart,
  Calendar,
  Utensils,
  Save,
  Check,
  AlertCircle,
  Calculator,
  RefreshCw,
} from 'lucide-react';

type MainSectionId = 'dados' | 'consultas' | 'planos';
type FormSubTab = 'pessoal' | 'clinico' | 'habitos';

interface PatientProfilePageProps {
  patientId: string;
  onBack: () => void;
}

// ── Formatadores ──────────────────────────────────────────────
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const formatTimeFromNumber = (value: string): string => {
  const num = parseInt(value.replace(/\D/g, ''), 10);
  if (isNaN(num) || value.trim() === '') return '';
  if (num < 100) {
    return `${String(Math.min(num, 23)).padStart(2, '0')}:00`;
  }
  const hours = Math.floor(num / 100);
  const minutes = num % 100;
  return `${String(Math.min(hours, 23)).padStart(2, '0')}:${String(Math.min(minutes, 59)).padStart(2, '0')}`;
};

// ── Opções de multi-select ────────────────────────────────────
const OBJETIVOS_OPTIONS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEL_ATIVIDADE_OPTIONS = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
];

const PATOLOGIAS_OPTIONS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_OPTIONS = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_OPTIONS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

const SEXO_OPTIONS = ['Feminino', 'Masculino', 'Outro'];

// ── Componente ChipSelector ───────────────────────────────────
interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  hasNone?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
  multiSelect?: boolean;
}

const ChipSelector: React.FC<ChipSelectorProps> = ({
  options,
  selected,
  onChange,
  hasNone = false,
  allowCustom = false,
  customPlaceholder = 'Adicionar outro...',
  multiSelect = true,
}) => {
  const [customInput, setCustomInput] = useState('');
  const isNoneSelected = selected.includes('Nenhum');

  const toggle = (item: string) => {
    if (item === 'Nenhum') {
      onChange(isNoneSelected ? [] : ['Nenhum']);
      return;
    }
    if (!multiSelect) {
      onChange([item]);
      return;
    }
    const withoutNone = selected.filter((s) => s !== 'Nenhum');
    if (withoutNone.includes(item)) {
      onChange(withoutNone.filter((s) => s !== item));
    } else {
      onChange([...withoutNone, item]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      const withoutNone = selected.filter((s) => s !== 'Nenhum');
      onChange([...withoutNone, trimmed]);
      setCustomInput('');
    }
  };

  const allOptions = hasNone ? ['Nenhum', ...options] : options;

  return (
    <div className="space-y-2.5 text-left">
      <div className="flex flex-wrap gap-2">
        {allOptions.map((opt) => {
          const isSelected = selected.includes(opt);
          const isDisabled = opt !== 'Nenhum' && isNoneSelected;

          return (
            <button
              key={opt}
              type="button"
              disabled={isDisabled}
              onClick={() => toggle(opt)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 select-none ${
                isSelected
                  ? opt === 'Nenhum'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                    : 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : isDisabled
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
              {opt}
            </button>
          );
        })}
      </div>

      {selected.filter((s) => !allOptions.includes(s)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected
            .filter((s) => !allOptions.includes(s))
            .map((custom) => (
              <span
                key={custom}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 text-white border border-teal-600 flex items-center gap-1.5"
              >
                {custom}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((s) => s !== custom))}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}

      {allowCustom && !isNoneSelected && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder={customPlaceholder}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
};

// ── Componente Principal do Perfil do Paciente ────────────────
export const PatientProfilePage: React.FC<PatientProfilePageProps> = ({ patientId, onBack }) => {
  const [activeSection, setActiveSection] = useState<MainSectionId>('dados');
  const [activeFormTab, setActiveFormTab] = useState<FormSubTab>('pessoal');

  const [patient, setPatient] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulário editável dos dados do paciente
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [] as string[],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [] as string[],
    restricoes_alimentares: [] as string[],
    alergias: [] as string[],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
  });

  const updateField = useCallback(<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Carregar paciente e consultas em tempo real do banco Neon
  const loadData = async () => {
    if (!patientId) return;

    setIsLoadingPatient(true);
    setIsLoadingConsultas(true);
    setError(null);

    try {
      const p = await patientService.getPatientById(patientId);
      if (p) {
        setPatient(p);
        const birthStr = p.data_nascimento
          ? typeof p.data_nascimento === 'string'
            ? p.data_nascimento.split('T')[0]
            : new Date(p.data_nascimento).toISOString().split('T')[0]
          : '';

        setFormData({
          nome: p.nome || '',
          data_nascimento: birthStr,
          sexo: p.sexo || '',
          telefone: p.telefone || '',
          whatsapp: p.whatsapp || '',
          email: p.email || '',
          peso_inicial: p.peso_inicial !== null && p.peso_inicial !== undefined ? String(p.peso_inicial) : '',
          altura: p.altura !== null && p.altura !== undefined ? String(p.altura) : '',
          objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
          objetivo_texto: p.objetivo_texto || '',
          nivel_atividade: p.nivel_atividade || '',
          patologias: Array.isArray(p.patologias) ? p.patologias : [],
          restricoes_alimentares: Array.isArray(p.restricoes_alimentares) ? p.restricoes_alimentares : [],
          alergias: Array.isArray(p.alergias) ? p.alergias : [],
          medicamentos: p.medicamentos || '',
          suplementos: p.suplementos || '',
          refeicoes_por_dia: p.refeicoes_por_dia !== null && p.refeicoes_por_dia !== undefined ? String(p.refeicoes_por_dia) : '',
          horario_acorda: p.horario_acorda || '',
          horario_dorme: p.horario_dorme || '',
          litros_agua: p.litros_agua !== null && p.litros_agua !== undefined ? String(p.litros_agua) : '',
          atividade_fisica: Boolean(p.atividade_fisica),
          atividade_fisica_descricao: p.atividade_fisica_descricao || '',
          observacoes: p.observacoes || '',
        });
      }

      const cList = await consultaService.getConsultasByPatient(patientId);
      setConsultas(cList || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados do paciente:', err);
      setError(err?.message || 'Erro ao carregar dados do banco Neon.');
    } finally {
      setIsLoadingPatient(false);
      setIsLoadingConsultas(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  // Cálculos automáticos de idade e IMC
  const idade = useMemo(() => {
    if (!formData.data_nascimento) return null;
    const birth = new Date(formData.data_nascimento + 'T00:00:00');
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  }, [formData.data_nascimento]);

  const imc = useMemo(() => {
    const peso = parseFloat(formData.peso_inicial);
    const alturaM = parseFloat(formData.altura) / 100;
    if (peso > 0 && alturaM > 0) {
      return (peso / (alturaM * alturaM)).toFixed(1);
    }
    return null;
  }, [formData.peso_inicial, formData.altura]);

  const imcClassification = useMemo(() => {
    if (!imc) return null;
    const val = parseFloat(imc);
    if (val < 18.5) return { label: 'Abaixo do peso', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (val < 25) return { label: 'Peso normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (val < 30) return { label: 'Sobrepeso', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (val < 35) return { label: 'Obesidade I', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    if (val < 40) return { label: 'Obesidade II', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    return { label: 'Obesidade III', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }, [imc]);

  // Salvar alterações dos dados do paciente no Neon
  const handleSaveChanges = async () => {
    if (!patientId || !formData.nome.trim()) {
      setError('O nome completo do paciente é obrigatório.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updateData: UpdatePatientData = {
        nome: formData.nome.trim(),
        data_nascimento: formData.data_nascimento || null,
        sexo: formData.sexo || null,
        telefone: formData.telefone || null,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        objetivos: formData.objetivos.filter((o) => o !== 'Nenhum'),
        objetivo_texto: formData.objetivo_texto || null,
        nivel_atividade: formData.nivel_atividade || null,
        patologias: formData.patologias.filter((p) => p !== 'Nenhum'),
        restricoes_alimentares: formData.restricoes_alimentares.filter((r) => r !== 'Nenhum'),
        alergias: formData.alergias.filter((a) => a !== 'Nenhum'),
        medicamentos: formData.medicamentos || null,
        suplementos: formData.suplementos || null,
        refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : null,
        horario_acorda: formatTimeFromNumber(formData.horario_acorda) || formData.horario_acorda || null,
        horario_dorme: formatTimeFromNumber(formData.horario_dorme) || formData.horario_dorme || null,
        litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao: formData.atividade_fisica_descricao || null,
        observacoes: formData.observacoes || null,
      };

      const updated = await patientService.updatePatient(patientId, updateData);
      setPatient(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erro ao atualizar paciente:', err);
      setError(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar nova consulta e atualizar lista/gráfico automaticamente
  const handleSaveConsulta = async (data: CreateConsultaData) => {
    await consultaService.createConsulta(data);
    // Recarrega as consultas do Neon em tempo real
    const cList = await consultaService.getConsultasByPatient(patientId);
    setConsultas(cList);
  };

  if (isLoadingPatient && !patient) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500">
          Carregando prontuário e dados do paciente...
        </p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
        <p className="text-base font-bold text-slate-800">Paciente não encontrado.</p>
        <Button variant="outline" onClick={onBack} className="mx-auto">
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── HEADER SUPERIOR DO PACIENTE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-xs"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold flex items-center justify-center text-xl shadow-sm">
              {patient.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {patient.nome}
              </h1>
              <p className="text-xs text-slate-400">
                Cadastrado em {new Date(patient.created_at).toLocaleDateString('pt-BR')} · Prontuário ativo
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoadingPatient || isLoadingConsultas}
            className="text-xs flex items-center gap-2 py-2"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingPatient || isLoadingConsultas ? 'animate-spin text-emerald-600' : ''
              }`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ── NAVEGAÇÃO PRINCIPAL DAS 3 SEÇÕES (Prompt 5) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs">
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveSection('dados')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeSection === 'dados'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">1. Dados do Paciente</span>
            <span className="sm:hidden">Dados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('consultas')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeSection === 'consultas'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">2. Consultas</span>
            <span className="sm:hidden">Consultas</span>
            {consultas.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeSection === 'consultas'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {consultas.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('planos')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeSection === 'planos'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span className="hidden sm:inline">3. Planos Alimentares</span>
            <span className="sm:hidden">Planos</span>
          </button>
        </div>
      </div>

      {/* ── MENSAGENS DE SUCESSO OU ERRO ── */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold">Alterações salvas com sucesso!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Os dados de {patient.nome} foram atualizados no Neon Database.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SEÇÃO 1 — DADOS DO PACIENTE (3 ABAS: PESSOAL, CLÍNICO, HÁBITOS)
         ══════════════════════════════════════════════════════════ */}
      {activeSection === 'dados' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in duration-200">
          {/* Sub-abas do formulário */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-2 flex items-center justify-between">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveFormTab('pessoal')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeFormTab === 'pessoal'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Pessoal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('clinico')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeFormTab === 'clinico'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Clínico</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('habitos')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeFormTab === 'habitos'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Heart className="w-4 h-4 text-emerald-600" />
                <span>Hábitos</span>
              </button>
            </div>

            <Button
              variant="primary"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="text-xs flex items-center gap-2 py-2 px-4 shadow-sm shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar alterações'}</span>
            </Button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* ── ABA PESSOAL ── */}
            {activeFormTab === 'pessoal' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Input
                      label="Nome completo *"
                      placeholder="Ex: Maria Silva"
                      value={formData.nome}
                      onChange={(e) => updateField('nome', e.target.value)}
                      icon={<User className="w-4 h-4" />}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Data de nascimento
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => updateField('data_nascimento', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      />
                      {idade !== null && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          {idade} anos
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Sexo
                    </label>
                    <ChipSelector
                      options={SEXO_OPTIONS}
                      selected={formData.sexo ? [formData.sexo] : []}
                      onChange={(sel) => updateField('sexo', sel[0] || '')}
                      multiSelect={false}
                    />
                  </div>

                  <Input
                    label="Telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => updateField('telefone', formatPhone(e.target.value))}
                    maxLength={15}
                  />

                  <Input
                    label="WhatsApp"
                    placeholder="(00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={(e) => updateField('whatsapp', formatPhone(e.target.value))}
                    maxLength={15}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="E-mail"
                      type="email"
                      placeholder="paciente@exemplo.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA CLÍNICO ── */}
            {activeFormTab === 'clinico' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Peso inicial (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Ex: 72.5"
                        value={formData.peso_inicial}
                        onChange={(e) => updateField('peso_inicial', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        kg
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Altura (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Ex: 168"
                        value={formData.altura}
                        onChange={(e) => updateField('altura', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                      IMC (automático)
                    </label>
                    <div
                      className={`rounded-xl border px-3.5 py-2.5 text-sm font-bold transition-all ${
                        imc
                          ? 'bg-slate-50 border-slate-200 text-slate-900'
                          : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400'
                      }`}
                    >
                      {imc ? (
                        <div className="flex items-center justify-between">
                          <span>{imc}</span>
                          {imcClassification && (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${imcClassification.color}`}
                            >
                              {imcClassification.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        'Preencha peso e altura'
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Objetivos
                  </label>
                  <ChipSelector
                    options={OBJETIVOS_OPTIONS}
                    selected={formData.objetivos}
                    onChange={(sel) => updateField('objetivos', sel)}
                  />
                  <input
                    type="text"
                    placeholder="Objetivo adicional (texto livre)..."
                    value={formData.objetivo_texto}
                    onChange={(e) => updateField('objetivo_texto', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1"
                  />
                </div>

                {/* Nível de atividade */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Nível de atividade física
                  </label>
                  <ChipSelector
                    options={NIVEL_ATIVIDADE_OPTIONS}
                    selected={formData.nivel_atividade ? [formData.nivel_atividade] : []}
                    onChange={(sel) => updateField('nivel_atividade', sel[0] || '')}
                    multiSelect={false}
                  />
                </div>

                {/* Patologias */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Patologias ou condições de saúde
                  </label>
                  <ChipSelector
                    options={PATOLOGIAS_OPTIONS}
                    selected={formData.patologias}
                    onChange={(sel) => updateField('patologias', sel)}
                    hasNone
                    allowCustom
                    customPlaceholder="Adicionar outra condição..."
                  />
                </div>

                {/* Restrições alimentares */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Restrições alimentares
                  </label>
                  <ChipSelector
                    options={RESTRICOES_OPTIONS}
                    selected={formData.restricoes_alimentares}
                    onChange={(sel) => updateField('restricoes_alimentares', sel)}
                    hasNone
                    allowCustom
                    customPlaceholder="Adicionar outra restrição..."
                  />
                </div>

                {/* Alergias */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Alergias alimentares
                  </label>
                  <ChipSelector
                    options={ALERGIAS_OPTIONS}
                    selected={formData.alergias}
                    onChange={(sel) => updateField('alergias', sel)}
                    hasNone
                    allowCustom
                    customPlaceholder="Adicionar outra alergia..."
                  />
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Medicamentos contínuos
                    </label>
                    <textarea
                      placeholder="Ex: Metformina 500mg 2x/dia..."
                      value={formData.medicamentos}
                      onChange={(e) => updateField('medicamentos', e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Suplementos em uso
                    </label>
                    <textarea
                      placeholder="Ex: Whey Protein, Creatina, Vitamina D..."
                      value={formData.suplementos}
                      onChange={(e) => updateField('suplementos', e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA HÁBITOS ── */}
            {activeFormTab === 'habitos' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Quantas refeições faz por dia"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Ex: 5"
                    value={formData.refeicoes_por_dia}
                    onChange={(e) => updateField('refeicoes_por_dia', e.target.value)}
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Quantidade de água por dia
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Ex: 2.5"
                        value={formData.litros_agua}
                        onChange={(e) => updateField('litros_agua', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        litros
                      </span>
                    </div>
                  </div>

                  <Input
                    label="Horário que acorda"
                    placeholder="Ex: 06:30"
                    value={formData.horario_acorda}
                    onChange={(e) => updateField('horario_acorda', e.target.value)}
                  />

                  <Input
                    label="Horário que dorme"
                    placeholder="Ex: 22:30"
                    value={formData.horario_dorme}
                    onChange={(e) => updateField('horario_dorme', e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Pratica atividade física?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('atividade_fisica', true)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                        formData.atividade_fisica
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('atividade_fisica', false);
                        updateField('atividade_fisica_descricao', '');
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                        !formData.atividade_fisica
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Não
                    </button>
                  </div>

                  {formData.atividade_fisica && (
                    <div className="animate-in fade-in duration-200 mt-2">
                      <Input
                        label="Qual atividade e frequência semanal"
                        placeholder="Ex: Musculação 4x na semana, Corrida aos sábados..."
                        value={formData.atividade_fisica_descricao}
                        onChange={(e) => updateField('atividade_fisica_descricao', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Observações gerais
                  </label>
                  <textarea
                    placeholder="Histórico alimentar, preferências, rotina de trabalho..."
                    value={formData.observacoes}
                    onChange={(e) => updateField('observacoes', e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Rodapé da seção de dados */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
              <Button
                variant="primary"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="text-xs sm:text-sm font-bold flex items-center gap-2 py-2.5 px-6 shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando alterações...' : 'Salvar alterações'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SEÇÃO 2 — CONSULTAS + EVOLUÇÃO DE PESO EM DESTAQUE
         ══════════════════════════════════════════════════════════ */}
      {activeSection === 'consultas' && (
        <ConsultasSection
          patient={patient}
          consultas={consultas}
          isLoading={isLoadingConsultas}
          onSaveConsulta={handleSaveConsulta}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          SEÇÃO 3 — PLANOS ALIMENTARES
         ══════════════════════════════════════════════════════════ */}
      {activeSection === 'planos' && <PlanosAlimentaresSection patient={patient} />}
    </div>
  );
};
