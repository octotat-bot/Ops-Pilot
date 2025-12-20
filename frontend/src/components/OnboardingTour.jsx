import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const OnboardingTour = ({ steps, onComplete, storageKey = 'onboarding_completed' }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const completed = localStorage.getItem(storageKey);
        if (!completed) {
            setTimeout(() => setIsActive(true), 1000);
        }
    }, [storageKey]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        localStorage.setItem(storageKey, 'true');
        setIsActive(false);
        if (onComplete) onComplete(false);
    };

    const handleComplete = () => {
        localStorage.setItem(storageKey, 'true');
        setIsActive(false);
        if (onComplete) onComplete(true);
    };

    if (!isActive || !steps || steps.length === 0) return null;

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <>
            {}
            <div className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in" onClick={handleSkip} />

            {}
            <div
                className="fixed z-[9999] bg-white rounded-xl shadow-2xl p-6 max-w-md animate-scale-in"
                style={{
                    top: step.position?.top || '50%',
                    left: step.position?.left || '50%',
                    transform: step.position ? 'none' : 'translate(-50%, -50%)'
                }}
            >
                {}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {step.icon && <step.icon size={24} className="text-brand-primary" />}
                            <h3 className="text-lg font-bold text-text-primary">{step.title}</h3>
                        </div>
                        <p className="text-sm text-text-secondary">{step.description}</p>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-text-muted hover:text-text-primary p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {}
                {step.content && (
                    <div className="mb-4 p-4 bg-bg-subtle rounded-lg">
                        {step.content}
                    </div>
                )}

                {}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                        <span>Step {currentStep + 1} of {steps.length}</span>
                        <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-primary transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleSkip}
                        className="text-sm text-text-muted hover:text-text-primary font-medium"
                    >
                        Skip tour
                    </button>
                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className="btn btn-secondary flex items-center gap-1"
                            >
                                <ChevronLeft size={16} />
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="btn btn-primary flex items-center gap-1"
                        >
                            {isLastStep ? (
                                <>
                                    <Check size={16} />
                                    Finish
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {}
            {step.highlightSelector && (
                <style>{`
                    ${step.highlightSelector} {
                        position: relative;
                        z-index: 9999;
                        box-shadow: 0 0 0 4px rgba(31, 111, 120, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5);
                        border-radius: 8px;
                    }
                `}</style>
            )}
        </>
    );
};

export default OnboardingTour;
