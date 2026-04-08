import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

/**
 * Tutorial steps — each step highlights a part of the UI and explains it.
 * `selector` is a CSS selector for the element to spotlight.
 * `fallbackPosition` is used if the element isn't found.
 */
const STEPS = [
  {
    title: 'Welcome!',
    body: 'This tool helps you pick upgrade options for your new Shaddock home and keep track of your budget.\n\nLet\'s take a quick tour so you know where everything is.',
    selector: null, // centered modal, no spotlight
    position: 'center',
  },
  {
    title: 'Pick Your Elevation',
    body: 'Your home has a specific elevation (A, B, C, D, or E). Pick yours here so you only see prices that apply to your home.\n\nIf you\'re not sure yet, leave it on "All Elevations" — you can always change it later.',
    selector: '#elevation-select',
    position: 'below',
  },
  {
    title: 'Search for Anything',
    body: 'Looking for something specific? Type a word here (like "granite" or "faucet") and it will show you every matching option across all categories.',
    selector: '[aria-label="Search options"]',
    position: 'below',
  },
  {
    title: 'Browse by Room or by Trade',
    body: '"By Room" groups options by where they go in your house (Kitchen, Master Bath, etc.).\n\n"By Trade" groups them by type of work (Electrical, Plumbing, Tile, etc.).\n\nTry both and use whichever feels easier!',
    selector: '[aria-label="Browse mode"]',
    position: 'below',
  },
  {
    title: 'Categories on the Left',
    body: 'This sidebar lists all the categories. Click any category to see its options.\n\nYou\'ll see a number badge showing how many items you\'ve picked in each category.',
    selector: '[data-tutorial="sidebar"]',
    position: 'right',
  },
  {
    title: 'Choose Your Options',
    body: 'The main area shows the options for the category you picked.\n\n- Check the box next to an option to add it to your list\n- Uncheck it to remove it\n- Some options are "pick one" (round buttons) — choosing one automatically removes the other\n- Gray items marked "Included" are already part of your base home',
    selector: '[data-tutorial="main-content"]',
    position: 'left',
  },
  {
    title: 'Your Budget Tracker',
    body: 'On the right side, you\'ll see your running total and budget bar.\n\n- Type in your budget at the top\n- The bar turns GREEN when you\'re under budget\n- YELLOW when you\'re close to going over\n- RED when you\'re over budget\n\nIt updates instantly as you add or remove options!',
    selector: '[data-tutorial="budget-panel"]',
    position: 'left',
  },
  {
    title: 'Save Your Work',
    body: 'Scroll down in the budget panel to find "Save Configuration".\n\nYou can save different sets of choices (like "Budget Friendly" and "Dream List") and switch between them anytime.\n\nYour choices are also automatically saved — if you close the browser and come back, everything will still be there.',
    selector: '[data-tutorial="budget-panel"]',
    position: 'left',
  },
  {
    title: 'Wizard Mode',
    body: 'If browsing feels overwhelming, try "Wizard" mode! It walks you through one category at a time with Next and Back buttons.\n\nClick "Wizard" in the top bar to try it.',
    selector: '[aria-label="Wizard mode"]',
    position: 'below',
  },
  {
    title: 'You\'re Ready!',
    body: 'That\'s it! Start browsing and picking your upgrades.\n\nYou can always click the red "Help" button at the bottom of the screen to see this tutorial again.\n\nHave fun choosing your new home options!',
    selector: null,
    position: 'center',
  },
];

function SpotlightOverlay({ targetRect, onClickOverlay }) {
  if (!targetRect) {
    // Full-screen dimmed overlay with no spotlight
    return (
      <div
        className="fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300"
        onClick={onClickOverlay}
      />
    );
  }

  const pad = 8;
  const r = {
    top: targetRect.top - pad,
    left: targetRect.left - pad,
    width: targetRect.width + pad * 2,
    height: targetRect.height + pad * 2,
  };

  return (
    <div className="fixed inset-0 z-[9998]" onClick={onClickOverlay}>
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={r.left}
              y={r.top}
              width={r.width}
              height={r.height}
              rx="8"
              ry="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.50)"
          mask="url(#tutorial-spotlight-mask)"
          style={{ pointerEvents: 'all' }}
        />
      </svg>
      {/* Highlight ring around the target */}
      <div
        className="absolute border-2 border-red-400 rounded-lg pointer-events-none"
        style={{
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.25)',
        }}
      />
    </div>
  );
}

function TooltipCard({ step, stepIndex, totalSteps, targetRect, onNext, onPrev, onClose }) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });

  useEffect(() => {
    if (!cardRef.current) return;
    const card = cardRef.current.getBoundingClientRect();

    if (step.position === 'center' || !targetRect) {
      setPos({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 16;
    let top, left;

    switch (step.position) {
      case 'below':
        top = targetRect.bottom + pad;
        left = targetRect.left + targetRect.width / 2 - card.width / 2;
        break;
      case 'above':
        top = targetRect.top - card.height - pad;
        left = targetRect.left + targetRect.width / 2 - card.width / 2;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - card.height / 2;
        left = targetRect.right + pad;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - card.height / 2;
        left = targetRect.left - card.width - pad;
        break;
      default:
        top = targetRect.bottom + pad;
        left = targetRect.left;
    }

    // Clamp within viewport
    if (left + card.width > vw - pad) left = vw - card.width - pad;
    if (left < pad) left = pad;
    if (top + card.height > vh - pad) top = vh - card.height - pad;
    if (top < pad) top = pad;

    setPos({ top: `${top}px`, left: `${left}px`, transform: 'none' });
  }, [targetRect, step.position]);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div
      ref={cardRef}
      className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-warm-200 max-w-md w-[90vw]"
      style={{ top: pos.top, left: pos.left, transform: pos.transform }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3
          className="text-lg font-bold text-warm-900"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {step.title}
        </h3>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
          aria-label="Close tutorial"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-3">
        <p className="text-[15px] leading-relaxed text-warm-700 whitespace-pre-line">
          {step.body}
        </p>
      </div>

      {/* Footer with navigation */}
      <div className="flex items-center justify-between px-5 pb-4 pt-2 border-t border-warm-100">
        <span className="text-sm text-warm-400">
          Step {stepIndex + 1} of {totalSteps}
        </span>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 px-4 h-10 rounded-lg text-sm font-medium text-warm-600 bg-warm-50 border border-warm-200 hover:bg-warm-100 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          {isFirst && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-4 h-10 rounded-lg text-sm font-medium text-warm-500 hover:text-warm-700 transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={isLast ? onClose : onNext}
            className="flex items-center gap-1 px-5 h-10 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            {isLast ? 'Got It!' : 'Next'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuidedTutorial({ isOpen, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = STEPS[stepIndex];

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (!step || !step.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    measureTarget();

    // Re-measure on resize/scroll
    const handleUpdate = () => measureTarget();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, stepIndex, measureTarget]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) setStepIndex(0);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && stepIndex < STEPS.length - 1) setStepIndex(s => s + 1);
      if (e.key === 'ArrowLeft' && stepIndex > 0) setStepIndex(s => s - 1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, stepIndex, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <SpotlightOverlay
        targetRect={targetRect}
        onClickOverlay={() => {}} // don't close on overlay click — less confusing for older users
      />
      <TooltipCard
        step={step}
        stepIndex={stepIndex}
        totalSteps={STEPS.length}
        targetRect={targetRect}
        onNext={() => setStepIndex((s) => Math.min(s + 1, STEPS.length - 1))}
        onPrev={() => setStepIndex((s) => Math.max(s - 1, 0))}
        onClose={onClose}
      />
    </>
  );
}

/**
 * Floating red help button — always visible at bottom-right of screen.
 */
export function HelpButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[9000] flex items-center gap-2 px-5 h-14 rounded-full bg-red-600 text-white font-bold text-base shadow-lg hover:bg-red-700 hover:shadow-xl active:bg-red-800 transition-all"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      aria-label="Open help tutorial"
      title="Click here for help using this website"
    >
      <HelpCircle size={22} />
      <span>Help</span>
    </button>
  );
}
