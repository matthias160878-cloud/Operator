# Sound – Tralaleros Rache, Folge 22: Der Drachen

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Wind, Stoff-Flattern, PLATSCH, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Frühlings-Farben der Staffel 5: Flöte/Piccolo und Vogelzwitscher-Triller. Neu für diese Folge: eine schmetternde „Kampfpilot“-Fanfare (Blech, kurz und übertrieben heroisch), ein Walzer im 3/4-Gefühl für den Drachen-Tanz und ein schwebender Streicher-Akkord für den Gleitflug.
- **Stimmung je Akt:**
  - **Akt 1 (0–12 s, Der Luftangriff):** S01 Böen-Whoosh, dann sofort die heroische Fanfare. S02 Fanfare weiter, mit Plan-Pizzicato darunter. S03 Fanfare bricht schief ab (Posaunen-„wah-wah“) beim Winddreher.
  - **Akt 2 (12–28 s, Der Drachen):** S04 Glitzer-Celesta, als die Schnur in die Hand fällt. S05 fröhliche Piccolo-Melodie im Hüpf-Rhythmus mit Holzblöcken. S06 ausgelassener, immer schneller werdender Walzer, Slide-Whistle auf jedem Looping. **Harter Musik-Stopp auf das PLING** (S07).
  - **Akt 3 (28–41 s, Der Bumerang):** S08 schwebender, fast feierlicher Streicher-Akkord + Flöte (absurd würdevoll). S09 Fallpfeife, Stille, PLATSCH. S10 Holzblöcke im Lach-Rhythmus.
  - **Loop (41–45 s):** Rückkehr zum Plan-Motiv aus Folge 1 mit einem Piccolo-Triller, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental spring cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts immediately with a wind whoosh and a short over-the-top heroic brass fanfare over sneaky pizzicato strings, then the fanfare collapses into a sad trombone wah-wah. A sparkling celesta glint, a cheerful bouncing piccolo melody with wood blocks, then an increasingly fast and wild waltz with slide whistles on every loop. A hard stop. A floating, solemn string chord with flute, a falling slide whistle, silence, then rhythmic wood blocks like laughter and a return to the sneaky pizzicato plan theme with a piccolo trill so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–21** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Frühling. Und Wind.“ (S01) ab ~0,5 s, nach dem ersten Böen-Whoosh.
- „Mit Hai dran.“ (S04) nach kleiner Pause, völlig sachlich.
- „Loopings. Achten. Tiefflug.“ (S06) wie eine Aufzählung im Katalog; „Stand nicht im Plan.“ trocken nach.
- S07 und S09 ohne Erzähler: PLING und PLATSCH haben die Bühne.
- „Der Gleitflug. Elegant. Würdevoll. Unfreiwillig.“ (S08) langsam, fast andächtig – Pause vor „Unfreiwillig.“
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Windstoß (ab Frame 1), Stoff-Knallen, Whoosh nach oben, Holzleisten-Knarzen |
| S02 | 0:04–0:08 | Höhenwind, flatternder Stoff, Schleifen-Flattern, fieses Kichern (SFX) |
| S03 | 0:08–0:12 | Sturzflug-Whoosh, Seitenböe, Stoff-Flattern, Schnur-Zischen |
| S04 | 0:12–0:16 | Schnur-Schleifen über Matsch, Holz-Griff „tock“, Glitzer-Ping, verträumtes Holz-Knarzen |
| S05 | 0:16–0:20 | Holzschritte (tock-tock), Schnur-Twang bei jedem Ruck, ferner Drachen-Flatterton, glückliches Holz-Summen |
| S06 | 0:20–0:25 | Whoosh-Serie (Looping, Acht, Sturzflug), Blüten-Puff beim Tiefflug, stummer Schrei = nur Luftzischen |
| S07 | 0:25–0:28 | Schnur-Sirren, **PLING** (Schnur reißt), kurze Stille |
| S08 | 0:28–0:33 | Sanfter Wind, ruhiges Stoff-Flattern, ein einzelner Vogel zwitschert (Gag) |
| S09 | 0:33–0:37 | Ast-Rascheln, Karabiner-Klick, kurze Fallpfeife, Riesen-**PLATSCH**, Matsch-Regen, Blüten rieseln (Glitzer) |
| S10 | 0:37–0:41 | Maniakales Lachen, Holz-Klappern, Schnur-Wedeln |
| S11 | 0:41–0:45 | Tropfen, quatschende Sneaker, Karabiner-Klimpern, Holzkratzen (geht nahtlos in Folge 1, S01 über) |

Lautheit Ziel: ca. -14 LUFS integriert; PLING, PLATSCH und Lachen dürfen nicht übersteuern (Limiter bei -1 dBTP).
