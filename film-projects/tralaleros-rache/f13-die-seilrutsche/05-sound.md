# Sound – Tralaleros Rache, Folge 13: Die Seilrutsche

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Seil-Sirren, Platsch, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für diese Folge: ein kurzer, übertrieben heroischer Blechbläser-Fanfarenstoß für den Absprung und eine „Seilrutschen“-Glissando-Linie (Streicher/Slide-Whistle abwärts), die mit der Fahrt immer schneller wird; eine Celesta-Glitzerfigur für den Pilz.
- **Stimmung je Akt:**
  - **Akt 1 (0–7 s, Der Absprung):** S01 keine Musik – Seil-Ruck und Twang sind der Hook; auf den stummen Kampfschrei ein heroischer Blechbläser-Stich, mit dem Absprung (S02) beginnt das abwärts gleitende Glissando über einem galoppierenden Pizzicato.
  - **Akt 2 (7–20 s, Der Pilz):** S03 Galopp + Glissando, accelerando. S04 Celesta-Glitzer auf den Pilz, darunter Musik kurz ausdünnen. S05 Zeitlupe: Musik wird mit der Speed-Ramp tief und gedehnt (Tape-Stop-Effekt), kommt beim Wiederanlauf schlagartig zurück.
  - **Akt 3 (20–45 s, Das Seilende):** S06 hektisches Fagott-Gestolper; **harter Musik-Stopp exakt auf das PLING** (S07), Stille während des Hängemoments, dann Fallpfeife. S08 PLATSCH ohne Musik. S09 Celesta-Glitzer bei der Pilz-Geste, S10 Holzblöcke im Lach-Rhythmus. S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts after 3 seconds with a short over-the-top heroic brass fanfare, then a galloping pizzicato strings rhythm with a long descending slide whistle and string glissando that keeps accelerating. A sparkling celesta figure, then a tape-stop slow-motion effect and a sudden return to full speed. Clumsy bassoon stumbling, then a hard stop and a few seconds of silence. Sparkling celesta again, rhythmic wood blocks like laughter, then a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–12** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald.“ (S01) erst nach dem Seil-Twang setzen (~1,2 s).
- „Ein Pilz. Wunderschön. Nur zum Anschauen.“ (S05) langsam und andächtig – passt zur Zeitlupe.
- „Stand nicht im Plan.“ (S06) mit kleiner Pause davor.
- „Die Natur ist grausam. Und das Seil billig.“ (S07) **während** des Hängemoments, direkt nach dem PLING – vor der Fallpfeife fertig.
- S08 und S10 ohne Erzähler: PLATSCH und Lachen haben die Bühne.
- „Tung Tung teilt gern.“ (S09) erst, wenn er den Pilz hinhält.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:03 | Lautes Seil-Knarzen + tiefer Twang beim Ruck (im 1. Frame), Blätterrascheln, Kampfschrei als Whoosh (kein Dialog) |
| S02 | 0:03–0:07 | Holzgriff-Klack, Absprung-Whoosh, schrilles Seil-Sirren (steigend) |
| S03 | 0:07–0:11 | Seil-Sirren mit Doppler, Fahrtwind, fernes Holz-Knarzen |
| S04 | 0:11–0:15 | Glitzer-Ping am Pilz, fröhliches Holz-Knarzen, Seil-Sirren kommt näher |
| S05 | 0:15–0:20 | Gedehnter Zeitlupen-Whoosh, ein tiefer Herzschlag-Bumm, schneller Whoosh beim Wiederanlauf |
| S06 | 0:20–0:24 | Seil-Sirren, Cartoon-Strampeln in der Luft, Schluck-Geräusch |
| S07 | 0:24–0:28 | Seil-PLING, Stille, Blinzel-Klick, Fallpfeifen |
| S08 | 0:28–0:31 | Riesen-PLATSCH, Matsch-Regen, Griff-Plopp, Schwindel-Zwitschern |
| S09 | 0:31–0:36 | Glitzer-Ping (Pilz hoch), Holz-Knarzen, Matsch-Tropfen vom Helm |
| S10 | 0:36–0:40 | Maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:40–0:45 | Wasser-Tropfen, quatschende Sneaker, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
