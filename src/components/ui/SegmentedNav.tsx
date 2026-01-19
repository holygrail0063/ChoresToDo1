import './SegmentedNav.css';

interface SegmentedNavProps {
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  previousLabel?: string;
}

export default function SegmentedNav({
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  nextLabel = 'Next →',
  previousLabel = '← Previous',
}: SegmentedNavProps) {
  return (
    <div className="step-navigation">
      <button
        onClick={onPrevious}
        disabled={previousDisabled}
        className="step-button step-button-previous"
      >
        {previousLabel}
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="step-button step-button-next"
      >
        {nextLabel}
      </button>
    </div>
  );
}

