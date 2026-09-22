import { ScriptStudio } from "@/components/script-studio/ScriptStudio";

export default function ScriptStudioPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Script Studio</h1>
        <p className="mt-1 text-sm text-muted">
          Script- und Hook-Engine: erzeugt plattformgerechte Skripte nach der Struktur
          Hook → Problem → Value → Example → Payoff → CTA sowie mehrere Hook-Varianten.
        </p>
      </div>
      <ScriptStudio />
    </div>
  );
}
