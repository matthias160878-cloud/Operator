# Sound – Tralaleros Rache, Folge 19: Das Iglu

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Schnee-Knirschen, KLAPP, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Winter-Farben der Staffel 4: Schlittenglöckchen und Glockenspiel. Neu für diese Folge: ein hektisches „Baustellen“-Xylophon im Zeitraffer-Tempo, ein warmes, kitschiges Celesta-/Spieluhr-Motiv für das gemütliche Iglu-Innere und eine lange Rutschen-Linie (Slide-Whistle abwärts, Glissando).
- **Stimmung je Akt:**
  - **Akt 1 (0–9 s, Der Bau):** S01 Zeitraffer-Xylophon doppelt so schnell, Schlittenglöckchen, endet auf einem stolzen Akkord-Stich. S02 schleichendes Pizzicato (Plan-Motiv), Glockenspiel-Ping auf den Zweig.
  - **Akt 2 (9–25 s, Der Köder):** S03 Holzblöcke im Stapf-Rhythmus. S04 ein kurzer Ballett-Walzer-Schnipsel (Harfe/Streicher) für den Sprung. S05 Spieluhr-Celesta, warm und kitschig. S06 Spieluhr leiser, darunter klapperndes Xylophon (Zähneklappern).
  - **Akt 3 (25–40 s, Die Falltür):** **Harter Musik-Stopp auf das KLAPP** (S07), nur Fallpfeife. S08 rasendes Slide-Whistle-Glissando + Galopp-Pizzicato, Kreisel-Triller beim Drehen. S09 Stille, nur Schnee-FLUMP und Tropfen; ein trauriges Fagott-Ton am Ende. S10 Holzblöcke im Lach-Rhythmus.
  - **Loop (40–45 s):** Rückkehr zum Plan-Motiv aus Folge 1 mit Schlittenglöckchen, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental winter cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts immediately with a frantic double-speed xylophone and sleigh bells, ending on a proud chord stab, then a sneaky pizzicato strings theme with a glockenspiel ping. Wood blocks in a stomping rhythm, a tiny elegant waltz phrase with harp, then a warm cozy music-box celesta melody. A hard stop with only a falling slide whistle, then a fast descending slide whistle glissando over galloping pizzicato with a spinning trill. A few seconds of near silence and one sad bassoon note, rhythmic wood blocks like laughter, then a return to the sneaky pizzicato plan theme with sleigh bells so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–18** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Minus zwölf Grad.“ (S01) ab ~0,5 s, über den Zeitraffer.
- „Mit Zweig.“ (S02) nach kleiner Pause, stolz-sachlich.
- „Vier Sekunden später: eingerichtet.“ (S05) gemütlich, fast bewundernd.
- S07 und S10 ohne Erzähler: KLAPP und Lachen haben die Bühne.
- „Phase zwei funktioniert. Einwandfrei.“ (S08) trocken über die Rutschfahrt.
- „Der Tee kommt nach. Ohne Tee.“ (S09) erst, wenn die Tasse in der Flosse steht.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Zeitraffer-Whoosh, Schneeblock-Wummern im Stakkato (ab Frame 1), Schnee-Knirschen, finaler Plopp |
| S02 | 0:04–0:09 | Schnee-Klopfen, Zweig-Knacks, Glitzer-Ping auf dem Zweig, fieses Kichern (SFX) |
| S03 | 0:09–0:13 | Holzschritte im Schnee (Knarz-Knirsch), Begeisterungs-Glitzer, Bommel-Wobble |
| S04 | 0:13–0:17 | Eleganter Whoosh, Schnee-Puff, gedämpfter Plumps im Iglu |
| S05 | 0:17–0:21 | Glühwürmchen-Summen, Tee-Dampf, zufriedenes Holz-Knarzen, Glitzer-Ping an der Laterne |
| S06 | 0:21–0:25 | Zähneklappern, Tee-Dampf, freundliches Holz-Knarzen, Wind |
| S07 | 0:25–0:28 | Schritt-Knirschen, Zweig-Knack, lautes KLAPP, Fallpfeife, Mützen-Plopp |
| S08 | 0:28–0:32 | Rutsch-Rauschen unter dem Schnee, Schnee-Explosion (PLOPP), Eis-Quietschen, Kreisel-Whirr |
| S09 | 0:32–0:37 | Ast-Knarren, weiches Schnee-FLUMP, Tassen-Schlittern über Eis, einzelner Tropfen-Plink |
| S10 | 0:37–0:40 | Langes Schlürfen, maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:40–0:45 | Schnee-Knirschen, quietschende Sneaker, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
