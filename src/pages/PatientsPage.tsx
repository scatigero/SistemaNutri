import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientService, PatientWithLastConsulta } from '../services/patientService';
import {
  Users,
  Search,
  Phone,
  Mail,
  ArrowRight,
  RefreshCw,
  Plus,
  Target,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

interface PatientsPageProps {
  onSelectPatient?: (patientId: string) => void;
  onNewPatient?: () => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({ onSelectPatient, onNewPatient }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithLastConsulta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await patientService.getPatients(user.id);
      setPatients(rows);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user?.id]);

  const filteredPatients = patients.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.whatsapp && p.whatsapp.includes(searchTerm))
  );

  const getObjetivoDisplay = (patient: PatientWithLastConsulta): string | null => {
    const parts: string[] = [];
    if (patient.objetivos && patient.objetivos.length > 0) {
      parts.push(patient.objetivos.join(', '));
    }
    if (patient.objetivo_texto) {
      parts.push(patient.objetivo_texto);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            Meus Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie prontuários, contatos e histórico clínico dos seus pacientes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchPatients}
            disabled={isLoading}
            className="text-xs flex items-center gap-2 py-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="primary"
            onClick={onNewPatient}
            className="text-xs flex items-center gap-2 py-2 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, e-mail ou WhatsApp..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
        />
      </div>

      {/* Patients List / Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Carregando pacientes do banco Neon...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 sm:p-14 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {searchTerm ? 'Nenhum paciente encontrado para esta busca' : 'Nenhum paciente cadastrado ainda'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente buscar com outros termos ou limpe a barra de pesquisa.'
              : 'Seus pacientes cadastrados aparecerão aqui com acesso direto aos prontuários e consultas.'}
          </p>
          {!searchTerm && onNewPatient && (
            <Button
              variant="primary"
              onClick={onNewPatient}
              className="text-sm flex items-center gap-2 mx-auto mt-2"
            >
              <Plus className="w-4 h-4" />
              Cadastrar primeiro paciente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const objetivo = getObjetivoDisplay(patient);

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient && onSelectPatient(patient.id)}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
              >
                {/* Nome e avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base border border-emerald-200">
                    {patient.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                      {patient.nome}
                    </h4>
                    <span className="text-xs text-slate-400">
                      Cadastrado em {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Objetivo e última consulta */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {objetivo && (
                    <div className="flex items-start gap-2">
                      <Target className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{objetivo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    <span>
                      {patient.ultima_consulta
                        ? `Última consulta: ${new Date(patient.ultima_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}`
                        : 'Sem consultas registradas'}
                    </span>
                  </div>
                  {patient.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{patient.whatsapp}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                  <span>Ver Prontuário</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
