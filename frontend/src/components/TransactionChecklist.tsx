import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type ChecklistStepStatus = 'complete' | 'active' | 'pending';

export interface ChecklistStep {
  title: string;
  description: string;
  status: ChecklistStepStatus;
}

interface TransactionChecklistProps {
  title: string;
  steps: ChecklistStep[];
}

export function TransactionChecklist({ title, steps }: TransactionChecklistProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <h4 className="font-heading font-medium text-dark-100 mb-4">{title}</h4>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                  step.status === 'complete'
                    ? 'bg-success-500/15 border-success-500/30 text-success-400'
                    : step.status === 'active'
                      ? 'bg-primary-500/15 border-primary-500/40 text-primary-400'
                      : 'bg-dark-800 border-white/10 text-dark-500'
                }`}
              >
                {step.status === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : step.status === 'active' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </span>
              {index < steps.length - 1 && <span className="w-px flex-1 min-h-4 bg-white/10 mt-2" />}
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-dark-100">{step.title}</p>
              <p className="text-xs text-dark-400 leading-relaxed">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
