export function AmbientGlows() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full opacity-[0.10]"
        style={{ background: "hsl(var(--accent))", filter: "blur(120px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-[0.10]"
        style={{ background: "hsl(var(--primary))", filter: "blur(120px)" }}
      />
    </>
  );
}
