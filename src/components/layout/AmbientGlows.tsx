export function AmbientGlows() {
  return (
    <>
      {/* Teal halo top-left */}
      <div
        aria-hidden
        className="pointer-events-none fixed -left-32 -top-40 h-[28rem] w-[28rem] rounded-full opacity-[0.12]"
        style={{ background: "#7cc2c8", filter: "blur(120px)" }}
      />
      {/* Warm gold halo bottom-center */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 -bottom-48 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-[0.12]"
        style={{ background: "#facb60", filter: "blur(140px)" }}
      />
    </>
  );
}
