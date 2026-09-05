import React from 'react';
import { 
  FileEdit, 
  Send, 
  Search, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  FileCheck, 
  Archive 
} from 'lucide-react';
import { DOSSIER_STATUS } from '../constants/dossierStatus';

export default function StatusBadge({ status }) {
  const icons = {
    BROUILLON: {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: FileEdit
    },
    SOUMIS: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Send
    },
    EN_VERIFICATION: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse',
      icon: Search
    },
    CORRECTION_DEMANDEE: {
      bg: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
      icon: AlertTriangle
    },
    RESOUMIS: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: RotateCcw
    },
    VALIDE: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
      icon: CheckCircle2
    },
    ATTESTATION_GENEREE: {
      bg: 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm',
      icon: FileCheck
    },
    ARCHIVE: {
      bg: 'bg-slate-200 text-slate-600 border-slate-300',
      icon: Archive
    }
  };

  const config = {
    ...(DOSSIER_STATUS[status] || DOSSIER_STATUS.BROUILLON),
    ...(icons[status] || icons.BROUILLON)
  };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${config.bg} transition-all`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
