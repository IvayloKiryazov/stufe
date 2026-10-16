export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted">This screen is being ported to the new interface.</p>
    </div>
  );
}
