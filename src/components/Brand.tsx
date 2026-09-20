export default function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`grid shrink-0 place-items-center rounded-full bg-gold-500/15 ring-1 ring-gold-400/40 ${
          small ? "h-8 w-8" : "h-10 w-10"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={small ? "h-5 w-5" : "h-6 w-6"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18" />
          <path d="M12 4c-1.7 0-3-1.3-3-3" />
          <path d="M12 4c1.7 0 3-1.3 3-3" />
          <path d="M12 5.5c2.8 0 5 2.7 5 6 0 .9-.061 1.4-.2 2H7.2c-.139-.6-.2-1.1-.2-2 0-3.3 2.2-6 5-6z" />
          <path d="M7 13.5h10" />
          <path d="M7 15.5l-3 5a5 5 0 0 0 10 0l-3-5" />
          <path d="M17 15.5l-3 5a5 5 0 0 0 10 0l-3-5" transform="translate(0 0)" />
          <path d="M19.5 20.5 17 16h5z" />
          <path d="M4.5 20.5 7 16H2z" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className={`font-bold tracking-wide text-white ${small ? "text-sm" : "text-base"}`}>
          SI<span className="text-gold-400">PERKARA</span>
        </p>
        {!small && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-navy-300">
            Asisten Pencarian Perkara Kejaksaan
          </p>
        )}
      </div>
    </div>
  );
}