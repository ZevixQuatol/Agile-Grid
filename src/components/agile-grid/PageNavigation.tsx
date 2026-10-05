interface Props {
  activePage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function PageNavigation({ activePage, pageCount, onPageChange }: Props) {
  return (
    <nav className="page-navigation" aria-label="分页导航">
      <button
        className="icon-button"
        type="button"
        aria-label="上一页"
        disabled={activePage === 0}
        onClick={() => onPageChange(activePage - 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m14 6-6 6 6 6" />
        </svg>
      </button>
      <span className="page-count" aria-live="polite">第 {activePage + 1} / {pageCount} 页</span>
      <button
        className="icon-button"
        type="button"
        aria-label="下一页"
        disabled={activePage === pageCount - 1}
        onClick={() => onPageChange(activePage + 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m10 6 6 6-6 6" />
        </svg>
      </button>
    </nav>
  );
}
