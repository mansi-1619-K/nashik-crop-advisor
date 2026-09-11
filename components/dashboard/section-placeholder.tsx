export function IndexEntry({
  no,
  title,
  description,
  stat,
  wide,
}: {
  no: string;
  title: string;
  description: string;
  stat: string;
  wide?: boolean;
}) {
  return (
    <article
      className={`group relative flex flex-col bg-paper p-5 transition-colors duration-300 hover:bg-paper-dim md:p-6 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-xl font-light uppercase leading-tight tracking-tight md:text-2xl">{title}</h3>
        <span
          aria-hidden
          className="select-none font-mono text-[10px] font-bold tracking-[0.15em] text-line transition-colors duration-300 group-hover:text-vermilion"
        >
          {no}
        </span>
      </div>
      <p className="mt-3 max-w-prose text-sm leading-[1.6] text-ink-soft group-hover:text-ink">
        {description}
      </p>
      <p className="mt-auto pt-4 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        → {stat}
      </p>
    </article>
  );
}
