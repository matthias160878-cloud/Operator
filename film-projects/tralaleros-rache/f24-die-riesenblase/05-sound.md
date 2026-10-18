# Sound – Tralaleros Rache, Folge 24: Die Riesenblase

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Kurbel, Blasen, PLATSCH, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Frühlings-Farben der Staffel 5: Flöte/Piccolo und leichtes Glockenspiel. Neu für diese Folge: ein „Erfinder“-Motiv aus Kurbel-Rhythmus (Ratsche + Tuba im Umpa-Takt), ein schwebendes Celesta-/Harfen-Walzer-Motiv für den Blasenflug und ein „Blubber“-Synth (weiche Plopp-Töne) als Blasen-Akzent.
- **Stimmung je Akt:**
  - **Akt 1 (0–15 s, Die Maschine):** S01 Ratsche + Tuba ab Frame 1, aufsteigendes Glissando, während die Blase wächst. S02 schleichendes Pizzicato (Plan-Motiv). S03 Harfen-Glissando aufwärts beim Abheben. S04 kurzer Bläser-Tusch.
  - **Akt 2 (15–24 s, Der Rundflug):** S05 verträumter Celesta-Walzer mit Flöte – schön, fast kitschig (Ironie). S06 Walzer endet auf Glitzer-Akkord; danach ein trauriger Fagott-Ton für Tralaleros Kinnlade.
  - **Akt 3 (24–40 s, Die Reklamation):** S07 harter Stopp auf das TONK, dann chaotisches Xylophon-Rattern im Kurbel-Tempo. S08 Walzer-Motiv kehrt zurück – jetzt dumpf, wie unter Wasser (Lowpass), passend zum stummen Trommeln. S09 Musik schrumpft auf einen gehaltenen Spannungs-Ton → **Stille** → PLOPP → PLATSCH, danach ein einzelner Tuba-Ton. S10 Holzblöcke im Lach-Rhythmus.
  - **Loop (40–45 s):** Rückkehr zum Plan-Motiv aus Folge 1 mit Piccolo, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental spring cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts immediately with a ratchet and an oom-pah tuba rhythm and a rising glissando, then a sneaky pizzicato strings theme, an upward harp glissando and a short brass fanfare. A dreamy floating waltz with celesta, harp and flute, ending on a sparkling chord and one sad bassoon note. A hard stop, then a frantic rattling xylophone, the waltz returning muffled as if heard through glass, a held suspense tone into silence, one low tuba note, rhythmic wood blocks like laughter, then a return to the sneaky pizzicato plan theme with piccolo so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–23** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Frühling. Zeit für Wissenschaft.“ (S01) ab ~0,5 s, über die wachsende Blase.
- „Verpackt. Abtransport.“ (S03) sachlich wie ein Logistiker.
- „So glücklich war er noch nie.“ (S05) leise, fast gerührt.
- „Fünf Sterne.“ (S06) trocken, wie eine Bewertung.
- „Die Natur ist grausam.“ (S09) erst **nach** dem PLATSCH.
- S10 ohne Erzähler: Lachen hat die Bühne.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Quietschende Kurbel ab Frame 1, Blasebalg-Schnaufen, gummiartiges Blasen-Dehnen, Glitzer-Ping |
| S02 | 0:04–0:08 | Holzkiste schleift über Erde, Whip-Whoosh, Snap-Zoom, Holzschritte (Knarz), fieses Kichern (SFX) |
| S03 | 0:08–0:12 | Weiches Blasen-Schlupp beim Umschließen, schimmerndes Glitzern, sanftes Abheben-Whoosh, Blasebalg-Pumpen |
| S04 | 0:12–0:15 | Sneaker-Quietschen, Sieges-Tröte (SFX), Crash-Zoom-Whoosh |
| S05 | 0:15–0:20 | Luftiges Schweben, Glitzer-Schimmer, glückliches Holz-Knarzen, Vogelgezwitscher |
| S06 | 0:20–0:24 | Sanftes Blop, Glitzer-Klingeln der Tröpfchen, leichtes Holz-Tock bei der Landung, Kinnlade-Klonk (SFX) |
| S07 | 0:24–0:27 | Hohles Holz-TONK, durchdrehende Kurbel (Ratter-Crescendo), wildes Blasebalg-Schnaufen, Schwapp |
| S08 | 0:27–0:31 | Schlupp beim Umschließen, gedämpftes Trommeln (Bonk-Bonk), Schwebe-Whoosh |
| S09 | 0:31–0:36 | Stille, Spannungs-Ton, sanftes PLOPP, großes PLATSCH, Matsch-Blubbern |
| S10 | 0:36–0:40 | Winzige Blasen-Plipps, maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:40–0:45 | Matsch-Quietschen der Sneaker, Schaum-Wobble, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
