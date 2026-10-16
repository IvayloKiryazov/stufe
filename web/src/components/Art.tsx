const CLS: Record<string, string> = { der: "text-der", die: "text-die", das: "text-das" };

export function Art({ text }: { text: string }) {
  const parts = String(text).split(" ");
  const a = parts[0]?.toLowerCase();
  if (!a || !(a in CLS)) return <>{text}</>;
  return (
    <>
      <span className={`font-serif font-bold ${CLS[a]}`}>{parts[0]}</span> {parts.slice(1).join(" ")}
    </>
  );
}
