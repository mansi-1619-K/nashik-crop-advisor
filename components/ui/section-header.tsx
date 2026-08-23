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
    <div className="mb-6 flex flex-wrap items-end gap-x-4 gap-y-1 border-b-2 border-ink pb-2">
      <span className="bg-acid px-1.5 font-mono text-xs font-bold uppercase leading-5">
        SEC.{no}
      </span>
      <h2 className="font-display text-[clamp(1.75rem,4vw,3.25rem)] uppercase leading-none">
        {title}
      </h2>
      {meta && (
        <p className="ml-auto font-mono text-[10px] uppercase tracking-widest text-ink-soft">
          {meta}
        </p>
      )}
    </div>
  );
}
