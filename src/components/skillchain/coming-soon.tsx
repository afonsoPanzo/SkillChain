/** Placeholder for screens that arrive in a later phase of the SDD plan. */
export function ComingSoon({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="flex flex-col gap-2 pt-6">
      <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">{title}</h2>
      <p className="m-0 text-[15px] text-muted">
        Este ecrã chega na fase {phase} do desenvolvimento.
      </p>
    </div>
  );
}
