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
    <div className="segmented-nav">
      <button
        onClick={onPrevious}
        disabled={previousDisabled}
        className="segmented-nav-button segmented-nav-button-left"
      >
        {previousLabel}
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="segmented-nav-button segmented-nav-button-right"
      >
        {nextLabel}
      </button>
    </div>
  );
}

