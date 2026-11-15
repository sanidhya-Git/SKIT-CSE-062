'use client';

import React, { useState } from 'react';
import { StepCard } from './StepCard';
import { StepTypeSelect } from './StepTypeSelect';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { StepType, WorkflowStep } from '@/lib/types';

interface StepBuilderProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

function newStep(type: StepType, order: number): WorkflowStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: `Step ${order + 1}`,
    type,
    config: {},
    order,
  };
}

export function StepBuilder({ steps, onChange }: StepBuilderProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<StepType | ''>('');

  const handleAddStep = () => {
    if (!selectedType) return;
    const step = newStep(selectedType, steps.length);
    onChange([...steps, step]);
    setAddOpen(false);
    setSelectedType('');
  };

  const handleUpdate = (index: number, updated: WorkflowStep) => {
    const next = [...steps];
    next[index] = updated;
    onChange(next);
  };

  const handleDelete = (index: number) => {
    onChange(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...steps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next.map((s, i) => ({ ...s, order: i })));
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const next = [...steps];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <div>
      <div className="step-builder">
        {steps.length === 0 && (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            No steps yet. Add your first step below.
          </div>
        )}

        {steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            onUpdate={updated => handleUpdate(i, updated)}
            onDelete={() => handleDelete(i)}
            onMoveUp={() => handleMoveUp(i)}
            onMoveDown={() => handleMoveDown(i)}
            isFirst={i === 0}
            isLast={i === steps.length - 1}
          />
        ))}

        <button
          className="step-add-btn"
          onClick={() => setAddOpen(true)}
          aria-label="Add a step"
        >
          + Add step
        </button>
      </div>

      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setSelectedType(''); }}
        title="Add step"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAddOpen(false); setSelectedType(''); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddStep} disabled={!selectedType}>
              Add step
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Choose the type of step to add to your workflow.
        </p>
        <StepTypeSelect value={selectedType} onChange={setSelectedType} />
      </Modal>
    </div>
  );
}
