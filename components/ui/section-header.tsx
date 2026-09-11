export function SecHeader({
  no,
  title,
  meta,
}: {
  no: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-line pb-3">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-vermilion">
        {no}
      </span>
      <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] font-light uppercase leading-none tracking-tight">
        {title}
      </h2>
      {meta && (
        <p className="ml-auto font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft">
          {meta}
        </p>
      )}
    </div>
  );
}
