import React from 'react';
import { UserProfile, PatientMeta, AnatomyNode } from '../../types';
import { PulmonologistView } from '../roles/PulmonologistView';
import { EngineerView } from '../roles/EngineerView';
import { ReviewerView } from '../roles/ReviewerView';
import { PatientView } from '../roles/PatientView';

interface ClinicalPanelProps {
  currentUser: UserProfile;
  patient: PatientMeta;
  selectedNode: AnatomyNode | null;
  isWireframe: boolean;
  onToggleWireframe: () => void;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onLodChange: (lod: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  onTuneParams: (params: Record<string, any>) => void;
  onAnnotateSuccess?: () => void;
  onOpenCTModal?: () => void;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
}

export function ClinicalPanel({
  currentUser,
  patient,
  selectedNode,
  isWireframe,
  onToggleWireframe,
  lodLevel,
  onLodChange,
  onTuneParams,
  onAnnotateSuccess,
  onOpenCTModal,
  onOpenKnowledgeGraph
}: ClinicalPanelProps) {
  switch (currentUser.role_code) {
    case 'twin_engineer':
      return (
        <EngineerView
          isWireframe={isWireframe}
          onToggleWireframe={onToggleWireframe}
          lodLevel={lodLevel}
          onLodChange={onLodChange}
          onTuneParams={onTuneParams}
        />
      );

    case 'reviewer':
      return <ReviewerView />;

    case 'patient_rep':
      return <PatientView onOpenKnowledgeGraph={onOpenKnowledgeGraph} />;

    case 'pulmonologist':
    default:
      return (
        <PulmonologistView
          patient={patient}
          onAnnotateSuccess={onAnnotateSuccess}
          onOpenCTModal={onOpenCTModal}
          onOpenKnowledgeGraph={onOpenKnowledgeGraph}
        />
      );
  }
}
