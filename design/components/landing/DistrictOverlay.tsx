'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  ExternalLink, 
  AlertTriangle, 
  BarChart2, 
  Upload, 
  FileText, 
  ArrowRight,
  Database,
  Users,
  CheckCircle2,
  FileCode,
  DollarSign,
  Activity,
  Compass,
  FileCheck
} from 'lucide-react';

interface DistrictOverlayProps {
  progress: number;
  riceImpact: number;
  setRiceImpact: (val: number) => void;
  riceConfidence: number;
  setRiceConfidence: (val: number) => void;
  gate1Approved: boolean;
  setGate1Approved: (val: boolean) => void;
  gate2Approved: boolean;
  setGate2Approved: (val: boolean) => void;
  showFeedbackLoop: boolean;
  setShowFeedbackLoop: (val: boolean) => void;
}

export default function DistrictOverlay({
  progress,
  riceImpact,
  setRiceImpact,
  riceConfidence,
  setRiceConfidence,
  gate1Approved,
  setGate1Approved,
  gate2Approved,
  setGate2Approved,
  showFeedbackLoop,
  setShowFeedbackLoop
}: DistrictOverlayProps) {
  const [prototypeType, setPrototypeType] = useState<'software' | 'physical'>('software');
  const [showExportModal, setShowExportModal] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [csvFile, setCsvFile] = useState<string | null>(null);

  // Parallax offset for specular reflections
  const parallaxOffset = (progress * 160) - 80;

  // Determine stage based on scroll progress bounds
  const getActiveStage = () => {
    if (progress < 0.15) return 'intake';
    if (progress < 0.30) return 'discovery';
    if (progress < 0.60) return 'definition';
    if (progress < 0.75) return 'prototype';
    if (progress < 0.90) return 'gtm';
    return 'tracking';
  };

  const activeStage = getActiveStage();

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0].name);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 font-sans text-[#F2F3F7] select-none z-10">
      {/* SVG Squircle Clip Path (Normalized Coordinates) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="squircle-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.08, 0 
                     C 0.03, 0  0, 0.03  0, 0.08 
                     L 0, 0.92 
                     C 0, 0.97  0.03, 1  0.08, 1 
                     L 0.92, 1 
                     C 0.97, 1  1, 0.97  1, 0.92 
                     L 1, 0.08 
                     C 1, 0.03  0.97, 0  0.92, 0 
                     Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Inline styles for specular edge gradients and glass blur */}
      <style>{`
        .glass-card-cyan {
          background: linear-gradient(
            135deg,
            rgba(79, 184, 199, 0.05),
            rgba(12, 15, 20, 0.5)
          ), rgba(12, 15, 20, 0.35);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid transparent;
          border-image: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.20),
            rgba(255, 255, 255, 0.03) 40%,
            rgba(255, 255, 255, 0) 100-percent
          ) 1;
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.5), 
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .glass-card-violet {
          background: linear-gradient(
            135deg,
            rgba(108, 97, 201, 0.05),
            rgba(12, 15, 20, 0.5)
          ), rgba(12, 15, 20, 0.35);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid transparent;
          border-image: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.20),
            rgba(255, 255, 255, 0.03) 40%,
            rgba(255, 255, 255, 0) 100%
          ) 1;
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.5), 
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .glass-panel-active {
          backdrop-filter: blur(42px) saturate(170%);
          background-color: rgba(12, 15, 20, 0.55);
          transition: backdrop-filter 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-panel-idle {
          backdrop-filter: blur(22px) saturate(150%);
          background-color: rgba(12, 15, 20, 0.35);
          transition: backdrop-filter 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <header className="w-full flex justify-between items-center pointer-events-auto bg-[#0c0f14]/80 backdrop-blur-md border border-[#F2F3F7]/10 px-6 py-4 rounded-xl shadow-lg z-30">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-[3.5px] shrink-0">
            <div className="h-[2px] rounded-full" style={{ width: '5px', background: '#5FD4E3', opacity: 0.5, boxShadow: '0 0 4px #5FD4E3' }} />
            <div className="h-[2px] rounded-full" style={{ width: '10px', background: '#5FD4E3', opacity: 0.8, boxShadow: '0 0 6px #5FD4E3' }} />
            <div className="h-[2px] rounded-full" style={{ width: '16px', background: '#5FD4E3', boxShadow: '0 0 8px #5FD4E3' }} />
          </div>
          <h1 className="text-[17px] font-semibold tracking-tight text-[#F2F3F7] opacity-92">AURA AGENT</h1>
          <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase px-2 py-0.5 bg-[#F2F3F7]/5 rounded">
            ValueForge Pipeline
          </span>
        </div>

        {/* Global Progress Track */}
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            {['Intake', 'Discovery', 'Definition', 'Prototype', 'GTM', 'Tracking'].map((stage, idx) => {
              const stages = ['intake', 'discovery', 'definition', 'prototype', 'gtm', 'tracking'];
              const currentIdx = stages.indexOf(activeStage);
              const isActive = idx === currentIdx;
              return (
                <div key={stage} className="flex flex-col items-center">
                  <span className={`text-[10px] font-mono uppercase tracking-wider transition-opacity duration-300 ${isActive ? 'text-[#5FD4E3] opacity-92' : 'text-[#F2F3F7] opacity-38'}`}>
                    0{idx+1}
                  </span>
                  <div className={`h-1 w-12 rounded mt-1.5 transition-all duration-300 ${isActive ? 'bg-[#5FD4E3] w-14' : 'bg-[#F2F3F7]/10'}`} />
                </div>
              );
            })}
          </div>
          <div className="h-6 w-[1px] bg-[#F2F3F7]/10" />
          <span className="text-[12px] font-mono text-[#5FD4E3] opacity-92 bg-[#0c0f14]/40 px-2.5 py-1 rounded border border-[#5FD4E3]/20">
            {Math.round(progress * 100)}% RUNWAY
          </span>
        </div>
      </header>

      {/* Main Info Panels Container */}
      <div className="flex-1 w-full relative flex items-center justify-center py-12 z-20">
        
        {/* ========================================================
            STAGE 1: INTAKE ZONE (progress < 0.15)
            ======================================================== */}
        {activeStage === 'intake' && (
          <div className="glass-card-cyan w-[480px] p-8 rounded-3xl flex flex-col gap-5 transform translate-y-0 opacity-100 transition-all duration-500 pointer-events-auto">
            <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
              STAGE 01 / CONVERSATIONAL GATEWAY
            </span>
            <h2 className="text-2xl font-medium tracking-tight text-[#F2F3F7] opacity-92 leading-tight">
              Guided Scoping & Brief Generation
            </h2>
            <p className="text-[14px] text-[#F2F3F7] opacity-58 leading-relaxed">
              Aura initiates a multi-turn structural dialogue to build a comprehensive project model. Rather than utilizing basic forms, it dynamically audits target vectors and engineering constraints.
            </p>
            <div className="p-4 rounded-xl bg-[#0c0f14]/30 border border-[#F2F3F7]/5 flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#F2F3F7] opacity-38">
                Generated Artifact
              </span>
              <div className="flex justify-between items-center bg-[#0C0F14]/20 px-3 py-2 rounded-lg border border-[#F2F3F7]/5">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#5FD4E3]" />
                  <span className="text-[12px] font-mono text-[#F2F3F7] opacity-92">project_brief.json</span>
                </div>
                <span className="text-[10px] font-mono text-[#5FD4E3] opacity-92">READY</span>
              </div>
            </div>
            <div className="text-[11px] text-[#F2F3F7] opacity-38 italic flex items-center gap-1.5 mt-1">
              <ArrowRight className="w-3.5 h-3.5 text-[#5FD4E3]" /> Scroll down to initiate Whitespace validation
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 2: DISCOVERY / VALUEFORGE (0.15 <= progress < 0.30)
            ======================================================== */}
        {activeStage === 'discovery' && (
          <div className="w-full max-w-5xl flex gap-6 px-12 transform translate-y-0 opacity-100 transition-all duration-500 pointer-events-auto">
            {/* ValueForge Research Panel */}
            <div className="glass-card-cyan flex-1 p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  STAGE 02 / VALUEFORGE ENGINE
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#F2F3F7] opacity-92 leading-tight">
                  Whitespace Analysis & Validation
                </h2>
                <p className="text-[14px] text-[#F2F3F7] opacity-58 leading-relaxed">
                  Deep intelligence modeling cross-references competitor saturation matrices with CPG market reports from the <strong>Ai Palette API</strong> alongside live queries.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="p-3 bg-[#0c0f14]/20 rounded-xl border border-[#F2F3F7]/5 flex flex-col gap-1">
                    <span className="text-[10px] text-[#F2F3F7] opacity-38 font-mono">PRICE MATRIX</span>
                    <span className="text-[13px] font-medium text-[#F2F3F7] opacity-92">Desaturated</span>
                  </div>
                  <div className="p-3 bg-[#0c0f14]/20 rounded-xl border border-[#F2F3F7]/5 flex flex-col gap-1">
                    <span className="text-[10px] text-[#F2F3F7] opacity-38 font-mono">PSYCHOGRAPHICS</span>
                    <span className="text-[13px] font-medium text-[#F2F3F7] opacity-92">Validated</span>
                  </div>
                  <div className="p-3 bg-[#0c0f14]/20 rounded-xl border border-[#F2F3F7]/5 flex flex-col gap-1">
                    <span className="text-[10px] text-[#F2F3F7] opacity-38 font-mono">CREDIBILITY</span>
                    <span className="text-[13px] font-medium text-[#F2F3F7] opacity-92">High Margin</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F2F3F7]/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#F2F3F7] opacity-38 uppercase">
                  ValueForge API Status
                </span>
                <span className="text-[11px] font-mono text-[#5FD4E3] opacity-92 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 animate-spin" /> ACTIVE INDEXING
                </span>
              </div>
            </div>

            {/* Failure Simulation (Precedent matching) */}
            <div className="glass-card-cyan w-[380px] p-8 rounded-3xl flex flex-col gap-4">
              <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                RISK SIMULATION
              </span>
              <h3 className="text-[18px] font-medium text-[#F2F3F7] opacity-92 tracking-tight">
                Historical Precedent Check
              </h3>
              <p className="text-[13px] text-[#F2F3F7] opacity-58 leading-relaxed">
                Aura runs positioning simulation matrices matching against historical product failures to predict traps before they block your launch.
              </p>
              
              <div className="flex flex-col gap-2.5 mt-2">
                <div className="flex items-center gap-3 p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                  <div className="p-1.5 rounded-lg bg-[#E0954A] text-[#0C0F14] shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-[#F2F3F7] opacity-92">Competitor Saturation</span>
                    <span className="text-[11px] text-[#F2F3F7] opacity-58">High risk in mid-tier pricing</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl">
                  <div className="p-1.5 rounded-lg bg-[#5FD4E3] text-[#0C0F14] shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-[#F2F3F7] opacity-92">Psychographic Drivers</span>
                    <span className="text-[11px] text-[#F2F3F7] opacity-58">Targeting underserved wellness niche</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 3: DEFINITION / PRIORITIZATION (0.30 <= progress < 0.60)
            ======================================================== */}
        {activeStage === 'definition' && (
          <div className="w-full max-w-5xl flex gap-6 px-12 transform translate-y-0 opacity-100 transition-all duration-500 pointer-events-auto">
            {/* PRD Scope & Features */}
            <div className="glass-card-violet flex-1 p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  STAGE 03 / FEATURE COMPILATION
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#F2F3F7] opacity-92 leading-tight">
                  PRD Scoping & User Personas
                </h2>
                <p className="text-[14px] text-[#F2F3F7] opacity-58 leading-relaxed">
                  Whitespace profiles translate into target customer personas and core roadmap parameters. Aura prioritizes engineering tasks using estimates.
                </p>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center p-3 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-[#6C61C9]" />
                      <span className="text-[13px] font-medium text-[#F2F3F7] opacity-92">Priya (FMCG Brand Manager)</span>
                    </div>
                    <span className="text-[11px] text-[#F2F3F7] opacity-58 font-mono bg-[#0c0f14]/40 px-2 py-0.5 rounded">PRIMARY PERSONA</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#6C61C9]" />
                      <span className="text-[13px] font-medium text-[#F2F3F7] opacity-92">Product Specification Sheet</span>
                    </div>
                    <span className="text-[11px] text-[#F2F3F7] opacity-58 font-mono bg-[#0c0f14]/40 px-2 py-0.5 rounded">PRD SPEC</span>
                  </div>
                </div>
              </div>

              <div className="text-[12px] text-[#F2F3F7] opacity-38 italic flex items-center gap-2 mt-4">
                <ArrowRight className="w-3.5 h-3.5 text-[#6C61C9]" /> Recalculate priority scores using the RICE slider deck
              </div>
            </div>

            {/* RICE / Priority Estimator */}
            <div className="glass-card-violet w-[380px] p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-5">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  ESTIMATOR
                </span>
                <h3 className="text-[18px] font-medium text-[#F2F3F7] opacity-92 tracking-tight">
                  Scoping & Effort Matrix
                </h3>
                
                {/* Impact Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#F2F3F7] opacity-58">Dynamic Impact</span>
                    <span className="font-mono text-[#5FD4E3]">{riceImpact}/10</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={riceImpact} 
                    onChange={(e) => setRiceImpact(Number(e.target.value))}
                    className="w-full accent-[#5FD4E3] bg-[#0c0f14]/50 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                </div>

                {/* Confidence Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#F2F3F7] opacity-58">Confidence Factor</span>
                    <span className="font-mono text-[#5FD4E3]">{riceConfidence * 10}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={riceConfidence} 
                    onChange={(e) => setRiceConfidence(Number(e.target.value))}
                    className="w-full accent-[#5FD4E3] bg-[#0c0f14]/50 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                </div>

                {/* Scrim protected monospace score calculation */}
                <div className="p-4 rounded-xl bg-[#0c0f14]/30 border border-[#F2F3F7]/5 flex justify-between items-center">
                  <span className="text-[11px] uppercase tracking-wider text-[#F2F3F7] opacity-38 font-mono">Computed Score</span>
                  <div className="bg-[#0C0F14]/20 px-3 py-1 rounded-md border border-[#F2F3F7]/10">
                    <span className="font-mono text-[14px] font-medium text-[#5FD4E3]">
                      {Math.round(((riceImpact * (riceConfidence / 10) * 100) / 4) * 10) / 10} RICE
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-[#F2F3F7] opacity-38 font-mono mt-4 block text-center uppercase tracking-widest">
                Scoring feeds dynamic priority layout
              </span>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 4: SYSTEM PROTOTYPING (0.60 <= progress < 0.75)
            ======================================================== */}
        {activeStage === 'prototype' && (
          <div className="w-full max-w-5xl flex gap-6 px-12 transform translate-y-0 opacity-100 transition-all duration-500 pointer-events-auto">
            {/* Build Panel */}
            <div className="glass-card-cyan flex-1 p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  STAGE 04 / SYSTEM PROTOTYPING
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#F2F3F7] opacity-92 leading-tight">
                  Interactive Clickable Builds
                </h2>
                <p className="text-[14px] text-[#F2F3F7] opacity-58 leading-relaxed">
                  Aura compiles full software stacks or designs physical specification blueprints directly from the ValueForge brief parameters.
                </p>

                {/* Prototype toggle deck */}
                <div className="flex p-1 bg-[#0c0f14]/40 border border-[#F2F3F7]/5 rounded-xl mt-2 w-fit">
                  <button 
                    onClick={() => setPrototypeType('software')}
                    className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all ${prototypeType === 'software' ? 'bg-[#5FD4E3] text-[#0C0F14] shadow' : 'text-[#F2F3F7] opacity-58 hover:opacity-92'}`}
                  >
                    Interactive Software Stack
                  </button>
                  <button 
                    onClick={() => setPrototypeType('physical')}
                    className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all ${prototypeType === 'physical' ? 'bg-[#5FD4E3] text-[#0C0F14] shadow' : 'text-[#F2F3F7] opacity-58 hover:opacity-92'}`}
                  >
                    Physical Product Packaging
                  </button>
                </div>
              </div>

              {prototypeType === 'software' ? (
                <div className="flex items-center gap-3 p-4 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-2xl mt-4">
                  <FileCode className="w-5 h-5 text-[#5FD4E3]" />
                  <div className="flex-1 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[#F2F3F7] opacity-92">Next.js + Tailwind Sandbox</span>
                      <span className="text-[11px] text-[#F2F3F7] opacity-58">Live mock workspace environment active</span>
                    </div>
                    <button className="px-3.5 py-1.5 bg-[#5FD4E3] text-[#0C0F14] font-medium text-[12px] rounded-lg flex items-center gap-1">
                      LAUNCH BUILD <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex items-center gap-3 p-4 bg-[#0C0F14]/40 border border-[#E0954A]/30 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-[#E0954A] shrink-0" />
                    <div className="flex-1 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-[#F2F3F7] opacity-92">Physical Spec Warning</span>
                        <span className="text-[11px] text-[#F2F3F7] opacity-58">Physical outputs are concept-only; not engineering-validated</span>
                      </div>
                      <button 
                        onClick={() => setShowExportModal(true)}
                        className="px-3.5 py-1.5 bg-[#5FD4E3] text-[#0C0F14] font-medium text-[12px] rounded-lg"
                      >
                        EXPORT SPEC SHEET
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Spec Sheets Details */}
            <div className="glass-card-cyan w-[380px] p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  COMPILATION FILES
                </span>
                <h3 className="text-[18px] font-medium text-[#F2F3F7] opacity-92 tracking-tight">
                  Package Index
                </h3>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-3 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl">
                    <span className="text-[12px] text-[#F2F3F7] opacity-92">components/Dashboard.tsx</span>
                    <span className="text-[10px] font-mono text-[#5FD4E3]">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl">
                    <span className="text-[12px] text-[#F2F3F7] opacity-92">schemas/inventory.sql</span>
                    <span className="text-[10px] font-mono text-[#5FD4E3]">ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Spec sheet info placard */}
              <div className="p-3 bg-slate-950/40 border border-amber-500/20 rounded-xl flex gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E0954A] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#F2F3F7] opacity-58 leading-normal">
                  All physical designs require non-dismissible warning stickers to prevent direct packaging prints.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 5: GTM & FINANCIAL ARCHITECTURE (0.75 <= progress < 0.90)
            ======================================================== */}
        {activeStage === 'gtm' && (
          <div className="w-full max-w-5xl flex gap-6 px-12 transform translate-y-0 opacity-100 transition-all duration-500 pointer-events-auto">
            {/* Launch Blueprint */}
            <div className="glass-card-violet flex-1 p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  STAGE 05 / GO-TO-MARKET LAYOUT
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#F2F3F7] opacity-92 leading-tight">
                  Launch Execution & Campaigns
                </h2>
                <p className="text-[14px] text-[#F2F3F7] opacity-58 leading-relaxed">
                  Aura automatically populates unit margins and marketing channels directly from competitive pricing indices generated in the discovery phase.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-4 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] text-[#F2F3F7] opacity-38 font-mono">ACQUISITION FUNNEL</span>
                    <span className="text-[14px] font-medium text-[#F2F3F7] opacity-92">Organic SEO + Influencer Seed</span>
                  </div>
                  <div className="p-4 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] text-[#F2F3F7] opacity-38 font-mono">DISTRIBUTION LEVERS</span>
                    <span className="text-[14px] font-medium text-[#F2F3F7] opacity-92">D2C E-Commerce + Specialty Retail</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#F2F3F7] opacity-38 italic flex items-center gap-2 mt-4">
                <ArrowRight className="w-3.5 h-3.5 text-[#6C61C9]" /> Continue scroll to monitor live metrics feedback
              </div>
            </div>

            {/* Financial Ledger Panel */}
            <div className="glass-card-violet w-[380px] p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  FINANCIAL LEDGER
                </span>
                <h3 className="text-[18px] font-medium text-[#F2F3F7] opacity-92 tracking-tight">
                  Unit Economics Overview
                </h3>

                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-center py-2 border-b border-[#F2F3F7]/5">
                    <span className="text-[13px] text-[#F2F3F7] opacity-58">Target COGS</span>
                    <span className="font-mono text-[#F2F3F7] opacity-92 font-medium">$4.20 / unit</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#F2F3F7]/5">
                    <span className="text-[13px] text-[#F2F3F7] opacity-58">Suggested MSRP</span>
                    <span className="font-mono text-[#F2F3F7] opacity-92 font-medium">$14.99 / unit</span>
                  </div>
                </div>

                {/* Scrim protected monospace margin calculation */}
                <div className="p-4 rounded-xl bg-[#0c0f14]/30 border border-[#F2F3F7]/5 flex justify-between items-center mt-3">
                  <span className="text-[11px] uppercase tracking-wider text-[#F2F3F7] opacity-38 font-mono">Gross Margin</span>
                  <div className="bg-[#0C0F14]/20 px-3 py-1 rounded-md border border-[#F2F3F7]/10">
                    <span className="font-mono text-[14px] font-medium text-[#5FD4E3] flex items-center">
                      <DollarSign className="w-3.5 h-3.5" /> 71.9%
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-[#F2F3F7] opacity-38 font-mono block text-center uppercase tracking-widest">
                Real-world target variables loaded
              </span>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 6: PERFORMANCE LOOPBACK (0.90 <= progress <= 1)
            ======================================================== */}
        {activeStage === 'tracking' && (
          <div className="w-full max-w-5xl flex gap-6 px-12 transform translate-y-0 opacity-100 transition-all duration-500 pointer-events-auto">
            {/* Live Metrics Dashboard */}
            <div className="glass-card-cyan flex-1 p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  STAGE 06 / PERFORMANCE LOOPBACK
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#F2F3F7] opacity-92 leading-tight">
                  Closed-Loop Performance Monitor
                </h2>
                <p className="text-[14px] text-[#F2F3F7] opacity-58 leading-relaxed">
                  Ingest telemetry data via manual CSV uploads. Aura monitors parameters for user anomalies and feeds data back into Discovery.
                </p>

                <div className="flex items-center gap-4 mt-2">
                  <label className="px-5 py-3 bg-[#5FD4E3] text-[#0C0F14] font-medium text-[13px] rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:bg-[#4FB8C7] shadow-lg">
                    <Upload className="w-4 h-4" /> UPLOAD CSV DATA
                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                  </label>
                  {csvFile ? (
                    <span className="text-[12px] font-mono text-[#5FD4E3] bg-[#5FD4E3]/10 px-3 py-1.5 rounded-lg border border-[#5FD4E3]/30">
                      {csvFile}
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#F2F3F7] opacity-38 font-mono">No telemetry files ingested</span>
                  )}
                </div>
              </div>

              {/* Feedback Loop Action Trigger */}
              <div className="mt-4 pt-4 border-t border-[#F2F3F7]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#E0954A]" />
                  <span className="text-[12px] text-amber-400 font-medium">NPS Anomaly Flagged (-14% Drop)</span>
                </div>
                <button 
                  onClick={() => setShowFeedbackLoop(true)}
                  className={`px-4 py-2 font-medium text-[12px] rounded-xl flex items-center gap-1.5 transition-all ${showFeedbackLoop ? 'bg-[#5FD4E3] text-[#0C0F14]' : 'bg-[#F2F3F7]/10 text-[#F2F3F7] opacity-92 hover:opacity-100 hover:bg-[#F2F3F7]/20'}`}
                >
                  {showFeedbackLoop ? 'LOOPBACK ENGAGED' : 'SEND TO DISCOVERY'}
                </button>
              </div>
            </div>

            {/* Performance metrics dashboard details */}
            <div className="glass-card-cyan w-[380px] p-8 rounded-3xl flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                  ACTIVE FEEDBACK LOOP
                </span>
                <h3 className="text-[18px] font-medium text-[#F2F3F7] opacity-92 tracking-tight">
                  Engine Interlock
                </h3>
                <p className="text-[13px] text-[#F2F3F7] opacity-58 leading-relaxed">
                  Engaging the loopback project shoots an energy line back into the intake stage, re-running the ValueForge whitespace query to optimize product attributes.
                </p>
              </div>

              {/* Monospace protected metrics status */}
              <div className="p-4 rounded-xl bg-[#0c0f14]/30 border border-[#F2F3F7]/5 flex justify-between items-center">
                <span className="text-[11px] uppercase tracking-wider text-[#F2F3F7] opacity-38 font-mono">Active Target</span>
                <div className="bg-[#0C0C14]/20 px-3 py-1 rounded-md border border-[#F2F3F7]/10">
                  <span className="font-mono text-[13px] font-medium text-[#5FD4E3]">
                    DISCOVERY RE-ENTRY
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================
          CHECKPOINTS / GATES
          ======================================================== */}

      {/* Discovery Gate (At progress ~0.30) */}
      {progress >= 0.28 && progress <= 0.32 && !gate1Approved && (
        <div 
          className="absolute inset-0 flex items-center justify-center p-8 z-50 glass-panel-active pointer-events-auto"
          style={{ transition: 'all 0.3s ease' }}
        >
          {/* Parallax Top Specular Edge Line */}
          <div 
            className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F2F3F7]/30 to-transparent" 
            style={{ transform: `translateX(${parallaxOffset}px)`, transition: 'transform 0.05s linear' }}
          />

          <div 
            className="w-[450px] p-8 glass-card-cyan rounded-3xl flex flex-col gap-5 text-center relative"
            style={{ clipPath: 'url(#squircle-clip)' }}
          >
            <div className="mx-auto p-4 rounded-full bg-[#E0954A]/10 border border-[#E0954A]/30 text-[#E0954A]">
              <Lock className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                HUMAN CHECKPOINT / GATE 01
              </span>
              <h3 className="text-xl font-medium text-[#F2F3F7] opacity-92">
                Brand Brief Approval Required
              </h3>
              <p className="text-[13px] text-[#F2F3F7] opacity-58 px-4 leading-relaxed">
                Review the ValueForge whitespace analysis parameters. You must confirm and approve the Brand Brief design before definition compilation.
              </p>
            </div>

            <button 
              onClick={() => setGate1Approved(true)}
              className="mt-2 w-full py-3.5 bg-[#5FD4E3] text-[#0C0F14] font-medium text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-[#4FB8C7] shadow-lg"
            >
              APPROVE BRAND BRIEF <Unlock className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Prioritization / Definition Gate (At progress ~0.60) */}
      {progress >= 0.58 && progress <= 0.62 && gate1Approved && !gate2Approved && (
        <div 
          className="absolute inset-0 flex items-center justify-center p-8 z-50 glass-panel-active pointer-events-auto"
          style={{ transition: 'all 0.3s ease' }}
        >
          {/* Parallax Top Specular Edge Line */}
          <div 
            className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F2F3F7]/30 to-transparent" 
            style={{ transform: `translateX(${parallaxOffset}px)`, transition: 'transform 0.05s linear' }}
          />

          <div 
            className="w-[450px] p-8 glass-card-violet rounded-3xl flex flex-col gap-5 text-center relative"
            style={{ clipPath: 'url(#squircle-clip)' }}
          >
            <div className="mx-auto p-4 rounded-full bg-[#E0954A]/10 border border-[#E0954A]/30 text-[#E0954A]">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#F2F3F7] opacity-38 uppercase">
                HUMAN CHECKPOINT / GATE 02
              </span>
              <h3 className="text-xl font-medium text-[#F2F3F7] opacity-92">
                Roadmap Approval Required
              </h3>
              <p className="text-[13px] text-[#F2F3F7] opacity-58 px-4 leading-relaxed">
                Review the prioritized feature list. You must validate the effort metrics before initiating sandbox code assembly.
              </p>
            </div>

            <button 
              onClick={() => setGate2Approved(true)}
              className="mt-2 w-full py-3.5 bg-[#5FD4E3] text-[#0C0F14] font-medium text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-[#4FB8C7] shadow-lg"
            >
              APPROVE PRIORITIZED ROADMAP <Unlock className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          EXPORT SPECIFICATION MODAL (PHYSICAL DISCLAIMER)
          ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 bg-[#0C0F14]/80 backdrop-blur-xl flex items-center justify-center p-8 z-[100] pointer-events-auto">
          <div className="w-[500px] p-8 glass-card-cyan rounded-3xl flex flex-col gap-6 relative">
            <div className="flex items-center gap-3 text-[#E0954A] border-b border-[#F2F3F7]/5 pb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-[18px] font-semibold tracking-tight text-[#F2F3F7] opacity-92">
                Export Validation Check
              </h4>
            </div>

            <div className="space-y-3">
              <p className="text-[13px] text-[#F2F3F7] opacity-58 leading-relaxed">
                Before downloading, you must acknowledge the engineering constraints matching this physical spec sheet:
              </p>
              <div className="p-4 bg-yellow-950/20 border border-amber-500/20 rounded-xl">
                <p className="text-[12px] text-[#E0954A] leading-relaxed font-mono uppercase tracking-normal">
                  STRICT PLA CARD REQUIREMENT: PHYSICAL RENDER NOT VALIDATED FOR ACTUAL MANUFACTURING. RE-ENTRY OF VALUES INTO REAL-WORLD ENGINEERING PIPELINE MANDATORY.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 bg-[#0c0f14]/20 border border-[#F2F3F7]/5 rounded-xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-1 accent-[#5FD4E3]"
              />
              <span className="text-[12px] text-[#F2F3F7] opacity-92 leading-normal">
                I accept that this download is concept-stage only, and agree to embed the placard warning in the exported file.
              </span>
            </label>

            <div className="flex gap-3 justify-end mt-2">
              <button 
                onClick={() => {
                  setShowExportModal(false);
                  setDisclaimerAccepted(false);
                }}
                className="px-4 py-2 text-[12px] font-medium text-[#F2F3F7] opacity-58 hover:opacity-92 rounded-lg"
              >
                CANCEL
              </button>
              <button 
                disabled={!disclaimerAccepted}
                onClick={() => {
                  setShowExportModal(false);
                  alert('Specification Sheet Downloaded Successfully (with embedded concept warning).');
                  setDisclaimerAccepted(false);
                }}
                className="px-5 py-2.5 bg-[#5FD4E3] text-[#0C0F14] font-medium text-[12px] rounded-lg disabled:opacity-30"
              >
                DOWNLOAD SPEC SHEET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Metrics */}
      <footer className="w-full flex justify-between items-center text-[11px] font-mono text-[#F2F3F7] opacity-38 mt-4 z-20">
        <span>COORDINATES: Refract-Focal: {(progress * 400).toFixed(1)}px</span>
        <span>AURA CORE v0.12 (ACTIVE)</span>
      </footer>
    </div>
  );
}
