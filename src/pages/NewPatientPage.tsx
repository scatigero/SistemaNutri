import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientService, CreatePatientData } from '../services/patientService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  ArrowLeft,
  User,
  Stethoscope,
  Heart,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Calculator,
  Sparkles,
} from 'lucide-react';

type TabId = 'pessoal' | 'clinico' | 'habitos';

interface NewPatientPageProps {
  onBack: () => void;
  onPatientCreated: (patientId: string) => void;
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

// ── Componentes auxiliares internos ──────────────────────────

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
    <div className="space-y-2.5">
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

      {/* Chips custom já adicionados */}
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
            className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
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

// ── Componente principal ────────────────────────────────────

export const NewPatientPage: React.FC<NewPatientPageProps> = ({ onBack, onPatientCreated }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('pessoal');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Estado do formulário ──
  const [formData, setFormData] = useState({
    // Pessoal
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    // Clínico
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
    // Hábitos
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
  });

  // ── Setters helpers ──
  const updateField = useCallback(<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Cálculos automáticos ──
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

  const horarioAcordaFormatted = useMemo(() => formatTimeFromNumber(formData.horario_acorda), [formData.horario_acorda]);
  const horarioDormeFormatted = useMemo(() => formatTimeFromNumber(formData.horario_dorme), [formData.horario_dorme]);

  // ── Tabs config ──
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'pessoal', label: 'Pessoal', icon: <User className="w-4 h-4" /> },
    { id: 'clinico', label: 'Clínico', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'habitos', label: 'Hábitos', icon: <Heart className="w-4 h-4" /> },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);

  const goNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };
  const goPrev = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  // ── Salvar paciente ──
  const handleSave = async () => {
    if (!formData.nome.trim()) {
      setError('O nome completo é obrigatório.');
      setActiveTab('pessoal');
      return;
    }
    if (!user?.id) {
      setError('Usuário não autenticado.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const payload: CreatePatientData = {
        nutricionista_id: user.id,
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
        horario_acorda: horarioAcordaFormatted || null,
        horario_dorme: horarioDormeFormatted || null,
        litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao: formData.atividade_fisica_descricao || null,
        observacoes: formData.observacoes || null,
      };

      const newPatient = await patientService.createPatient(payload);

      setSuccessMessage(`Paciente "${newPatient.nome}" cadastrado com sucesso!`);

      // Redireciona para o perfil do paciente após breve delay
      setTimeout(() => {
        onPatientCreated(newPatient.id);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar paciente. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header com botão voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Novo Paciente
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Preencha os dados para cadastrar um novo paciente.
            </p>
          </div>
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold">{successMessage}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Redirecionando para o prontuário...</p>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Card principal do formulário */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-1.5 sm:p-2">
          <div className="flex gap-1">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const isCompleted = idx < currentTabIndex;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                      : isCompleted
                        ? 'text-emerald-600 hover:bg-white/60'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <span
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* ───── ABA PESSOAL ───── */}
          {activeTab === 'pessoal' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Dados Pessoais
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Informações básicas de contato e identificação.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nome (obrigatório) */}
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

                {/* Data de nascimento */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Data de nascimento
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => updateField('data_nascimento', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                    {idade !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        {idade} anos
                      </span>
                    )}
                  </div>
                </div>

                {/* Sexo */}
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

                {/* Telefone */}
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => updateField('telefone', formatPhone(e.target.value))}
                  maxLength={15}
                />

                {/* WhatsApp */}
                <Input
                  label="WhatsApp"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => updateField('whatsapp', formatPhone(e.target.value))}
                  maxLength={15}
                />

                {/* Email */}
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

          {/* ───── ABA CLÍNICO ───── */}
          {activeTab === 'clinico' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  Dados Clínicos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Medidas corporais, objetivos e condições de saúde.</p>
              </div>

              {/* Peso, Altura e IMC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Peso atual
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 72.5"
                      value={formData.peso_inicial}
                      onChange={(e) => updateField('peso_inicial', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Ex: 168"
                      value={formData.altura}
                      onChange={(e) => updateField('altura', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                {/* IMC calculado */}
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
                  className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1"
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
                    className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none"
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
                    className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ───── ABA HÁBITOS ───── */}
          {activeTab === 'habitos' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600" />
                  Hábitos e Rotina
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Rotina alimentar, horários e estilo de vida.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Refeições por dia */}
                <Input
                  label="Quantas refeições faz por dia"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ex: 5"
                  value={formData.refeicoes_por_dia}
                  onChange={(e) => updateField('refeicoes_por_dia', e.target.value)}
                />

                {/* Litros de água */}
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
                      className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      litros
                    </span>
                  </div>
                </div>

                {/* Horário que acorda */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Horário que acorda
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 6 ou 630"
                      value={formData.horario_acorda}
                      onChange={(e) => updateField('horario_acorda', e.target.value.replace(/[^\d]/g, ''))}
                      maxLength={4}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 pr-20"
                    />
                    {horarioAcordaFormatted && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        {horarioAcordaFormatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Horário que dorme */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Horário que dorme
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 23 ou 2230"
                      value={formData.horario_dorme}
                      onChange={(e) => updateField('horario_dorme', e.target.value.replace(/[^\d]/g, ''))}
                      maxLength={4}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 pr-20"
                    />
                    {horarioDormeFormatted && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        {horarioDormeFormatted}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Atividade física */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Pratica atividade física?
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateField('atividade_fisica', true)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all select-none ${
                      formData.atividade_fisica
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
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
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all select-none ${
                      !formData.atividade_fisica
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    Não
                  </button>
                </div>

                {formData.atividade_fisica && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <textarea
                      placeholder="Qual atividade e frequência semanal? Ex: Musculação 4x/semana, Corrida 2x/semana..."
                      value={formData.atividade_fisica_descricao}
                      onChange={(e) => updateField('atividade_fisica_descricao', e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Observações gerais */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Observações gerais
                </label>
                <textarea
                  placeholder="Anotações adicionais sobre o paciente..."
                  value={formData.observacoes}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer com navegação de abas e botão salvar */}
        <div className="px-6 sm:px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            {currentTabIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                className="text-xs flex items-center gap-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {tabs[currentTabIndex - 1].label}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentTabIndex < tabs.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={goNext}
                className="text-xs flex items-center gap-2"
              >
                <span>Próximo: {tabs[currentTabIndex + 1].label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={!formData.nome.trim() || isSaving || !!successMessage}
                className="text-xs flex items-center gap-2 px-6"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Paciente</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
