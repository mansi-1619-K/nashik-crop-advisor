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
      className={`group relative flex flex-col bg-paper p-4 transition-colors duration-75 hover:bg-acid md:p-5 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl uppercase leading-tight md:text-2xl">{title}</h3>
        <span
          aria-hidden
          className="text-stroke-thin select-none font-display text-4xl leading-none md:text-6xl"
        >
          {no}
        </span>
      </div>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft group-hover:text-ink">
        {description}
      </p>
      <p className="mt-auto pt-3 font-mono text-[10px] font-bold uppercase tracking-wider">
        → {stat}
      </p>
    </article>
  );
}
