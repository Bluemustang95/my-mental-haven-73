export function AmbientGlows() {
  return (
    <>
      <div
        className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full opacity-[0.15]"
        style={{ background: "#facb60", filter: "blur(100px)" }}
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-[0.15]"
        style={{ background: "#7cc2c8", filter: "blur(100px)" }}
      />
    </>
  );
}
