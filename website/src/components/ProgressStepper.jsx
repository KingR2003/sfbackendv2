import React from "react";
import { Check } from "lucide-react";

const steps = ["Information", "Delivery", "Payment"];

const ProgressStepper = ({ currentStep = 1, backLabel, onBack, showBackLink = true }) => {
  return (
    <div className="checkout-progress">
      <div className="progress-track">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          let stateClass = "";
          if (stepNumber < currentStep) stateClass = "completed";
          else if (stepNumber === currentStep) stateClass = "active";

          return (
            <div key={label} className={`progress-step ${stateClass}`}>
              <span className="progress-number">
                {stateClass === "completed" ? <Check size={14} strokeWidth={3} /> : stepNumber}
              </span>
              <span>{label}</span>
            </div>
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
