import { Card, CardTitle, Stat } from "../components/ui/card";

export default function Today() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Today</h1>
        <p className="text-muted">Your daily session.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat value="—" label="reviews due" />
        <Stat value="—" label="new available" />
      </div>

      <Card>
        <CardTitle>Getting started</CardTitle>
        <p className="text-sm text-muted">
          The new interface is being built. Data wiring and the study session arrive in the next steps.
        </p>
      </Card>
    </div>
  );
}
