import React from "react";
import { Check } from "lucide-react";

const steps = ["Information", "Delivery", "Payment"];

const ProgressStepper = ({
  currentStep = 1,
  backLabel,
  onBack,
  showBackLink = true,
  onStepClick,
}) => {
  return (
    <div className="checkout-progress">
      <div className="progress-track">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          let stateClass = "";
          if (stepNumber < currentStep) stateClass = "completed";
          else if (stepNumber === currentStep) stateClass = "active";

          const isClickable = typeof onStepClick === "function";

          return (
            <React.Fragment key={label}>
              {isClickable ? (
                <button
                  type="button"
                  className={`progress-step ${stateClass}`}
                  onClick={() => onStepClick(stepNumber)}
                  aria-current={stepNumber === currentStep ? "step" : undefined}
                >
                  <span className="progress-number">
                    {stateClass === "completed" ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      stepNumber
                    )}
                  </span>
                  <span>{label}</span>
                </button>
              ) : (
                <div
                  className={`progress-step ${stateClass}`}
                  aria-current={stepNumber === currentStep ? "step" : undefined}
                >
                  <span className="progress-number">
                    {stateClass === "completed" ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      stepNumber
                    )}
                  </span>
                  <span>{label}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {showBackLink && backLabel && (
        <button type="button" className="checkout-back-link" onClick={onBack}>
          {backLabel}
        </button>
      )}
    </div>
  );
};

export default ProgressStepper;
