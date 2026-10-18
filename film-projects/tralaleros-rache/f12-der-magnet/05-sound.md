# Sound – Tralaleros Rache, Folge 12: Der Magnet

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Brummen, KLONGs, Platsch) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für diese Folge: ein tiefer, brummender Synth-Bass-Drone für den Magneten (unter dem Score, nicht melodisch) und Glockenspiel/Amboss-Schläge für die KLONG-Serie.
- **Stimmung je Akt:**
  - **Akt 1 (0–7 s, Die Waffe):** S01 keine Musik – das Einschalt-Brummen ist der Hook. Ab S02 stolzes „Mad Scientist“-Pizzicato mit Fagott, Drone darunter.
  - **Akt 2 (7–15 s, Holz):** S03 harter **Musik-Stopp** – nur Brummen, zwei Holz-Tocks, eine Grille. S04 Wiedereinsatz mit steigendem Xylophon-Lauf zum Regler, Drone steigt in der Tonhöhe.
  - **Akt 3 (15–45 s, Der Schrott-Ritter):** S05 hektisch anschwellend (Streicher-Tremolo), S06 jeder KLONG auf einen Amboss-/Glockenspiel-Schlag im Takt, S07 schwerfälliges Tuba-„Stampf-stampf“ + Slide-Whistle abwärts, **harter Stopp exakt auf den PLATSCH** (S08). S09 ein einzelner Triangel-Ping auf das KLONK am Eimer. S10 Holzblöcke im Lach-Rhythmus. S11 Rückkehr zum Plan-Motiv aus Folge 1 für den nahtlosen Loop.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Silent for the first 3 seconds, then a proud mad-scientist pizzicato strings and bassoon theme over a low humming synth drone. A sudden full stop for five seconds. Then a rising xylophone run, frantic string tremolo building up, a rhythmic series of anvil and glockenspiel hits, a clumsy stomping tuba and a descending slide whistle, then a hard stop. One triangle ping, rhythmic wood blocks like laughter, then a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–11** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald.“ (S01) erst nach dem Einschalt-Brummen setzen (~1,2 s).
- „Und leider: aus Holz.“ (S03) erst nach den zwei Holz-Tocks, mit kurzer Pause davor.
- „Erinnern Sie sich an die Ritterrüstung? Sie erinnert sich.“ (S05) – Callback auf Folge 2, ganz ruhig, als würde der Erzähler sich auch erinnern.
- S08 ohne Erzähler: PLATSCH und Blechgeklapper haben die Bühne.
- „Die Natur ist grausam.“ (S10) in eine Lach-Pause setzen.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:03 | Lautes, tiefes Einschalt-BRUMMEN (sofort, steigend), elektrisches Knistern/Blitz-Zischen |
| S02 | 0:03–0:07 | Gleichmäßiges Magnet-Brummen, Knistern, Sneaker-Schaben auf Erde |
| S03 | 0:07–0:12 | Brummen im Hintergrund, Funken verpuffen, Holz-Knarzen beim Kopfneigen, zweimal hohles „Tock Tock“, eine Grille |
| S04 | 0:12–0:15 | Schütteln (Klappern), ratschende Regler-Klicks, Zeiger-Anschlag „Klick“, Brummen steigt steil an, lautes Knistern |
| S05 | 0:15–0:20 | Gebüsch-Rascheln, Laub-Aufwirbeln, anschwellendes Blech-Klappern und Schaben, mehrere Whooshes |
| S06 | 0:20–0:25 | KLONG-Serie (Blech auf Blech, im Takt), Rost-Rieseln, finales hohles Helm-„BONG“ |
| S07 | 0:25–0:29 | Zwei klappernde Schritte, quietschende Rostgelenke, Blech-Wackeln, Fallpfeife abwärts |
| S08 | 0:29–0:32 | Riesen-PLATSCH + Blechgeklapper, Magnet-Wirbel-Whoosh, dann Tropfen |
| S09 | 0:32–0:35 | Whoosh, lautes metallisches KLONK am Eimer, zufriedenes Brummen, Triangel-Ping |
| S10 | 0:35–0:40 | Maniakales Lachen (SFX), hohles Holz-Klappern |
| S11 | 0:40–0:45 | Quatschende Sneaker, Matsch-Tropfen, Helm-Klappern, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
