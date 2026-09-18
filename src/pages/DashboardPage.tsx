import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, NavigationTab } from '../components/Sidebar';
import { PatientsPage } from './PatientsPage';
import { PatientDetailModal } from '../components/PatientDetailModal';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats } from '../types/database';
import {
  Users,
  Calendar,
  ClockAlert,
  ChevronRight,
  RefreshCw,
  Menu,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = async (isManualRefresh = false) => {
    if (!user?.id) return;
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await dashboardService.getDashboardStats(user.id);
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user?.id]);

  // Formatação da data atual em português
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const hojeFormatado = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Menu Lateral Fixo */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        totalPacientes={stats.totalPacientes}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Topbar para Mobile */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Abrir menu lateral"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-extrabold text-slate-800 text-lg">
            Sistema <span className="text-emerald-600">Nutri</span>
          </span>
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
            {user?.nome ? user.nome.charAt(0).toUpperCase() : 'N'}
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {currentTab === 'pacientes' ? (
            <PatientsPage onSelectPatient={(id) => setSelectedPatientId(id)} />
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header de Boas-Vindas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>{hojeFormatado}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Olá, {user?.nome ? `Dr(a). ${user.nome}` : 'Nutricionista'} 👋
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Acompanhe o resumo em tempo real dos seus atendimentos e pacientes.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => loadStats(true)}
                    disabled={isRefreshing || isLoading}
                    className="text-xs flex items-center gap-2 py-2 px-3.5 bg-white shadow-2xs hover:bg-slate-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'
                      }`}
                    />
                    <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
                  </Button>
                </div>
              </div>

              {/* Grid com os 3 Cards Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1 — Total de pacientes ativos */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Users className="w-28 h-28 text-emerald-700" />
                  </div>

                  <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/80 shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Cadastrados
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total de Pacientes Ativos
                      </p>
                      <h3 className="text-4xl font-extrabold text-slate-900 mt-1 tracking-tight">
                        {isLoading ? (
                          <span className="inline-block w-12 h-9 bg-slate-100 rounded-lg animate-pulse" />
                        ) : (
                          stats.totalPacientes
                        )}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Pacientes sob seus cuidados</span>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('pacientes')}
                        className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        Ver lista <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2 — Consultas da semana */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Calendar className="w-28 h-28 text-teal-700" />
                  </div>

                  <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100/80 shadow-xs">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                        Semana Atual
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Consultas da Semana
                      </p>
                      <h3 className="text-4xl font-extrabold text-slate-900 mt-1 tracking-tight">
                        {isLoading ? (
                          <span className="inline-block w-12 h-9 bg-slate-100 rounded-lg animate-pulse" />
                        ) : (
                          stats.consultasSemana
                        )}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Atendimentos registrados nesta semana</span>
                    </div>
                  </div>
                </div>

                {/* Card 3 — Pacientes sem retorno (Destaque) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all md:col-span-2 lg:col-span-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/80 shadow-xs">
                          <ClockAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Pacientes sem Retorno</h4>
                          <p className="text-xs text-slate-400">Última consulta há +30 dias</p>
                        </div>
                      </div>
                      {stats.pacientesSemRetorno.length > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          {stats.pacientesSemRetorno.length}
                        </span>
                      )}
                    </div>

                    {/* Lista de pacientes ou estado vazio */}
                    <div className="space-y-2 mt-4 max-h-56 overflow-y-auto pr-1">
                      {isLoading ? (
                        <div className="py-6 text-center space-y-2">
                          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-slate-400">Verificando consultas...</p>
                        </div>
                      ) : stats.pacientesSemRetorno.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700">
                            Nenhum paciente sem retorno no momento
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Todos os retornos estão em dia ou agendados.
                          </p>
                        </div>
                      ) : (
                        stats.pacientesSemRetorno.map((paciente) => (
                          <button
                            key={paciente.id}
                            type="button"
                            onClick={() => setSelectedPatientId(paciente.id)}
                            className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between text-left group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {paciente.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                                  {paciente.nome}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Há {paciente.dias_sem_consulta} dias sem consulta
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transform group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Clique no paciente para ver prontuário</span>
                  </div>
                </div>
              </div>

              {/* Informações adicionais da conta & status da conexão */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100">
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{user?.nome}</h4>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Neon Database Conectado
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes / Prontuário do Paciente */}
      <PatientDetailModal
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
    </div>
  );
};
