# Sound – Tralaleros Rache, Folge 23: Das Trampolin

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Laub, Boing, Platsch, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung). Die Trampolin-Boings in S05 und S10 liegen auf den Vierteln.
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Frühlings-Farben der Staffel 5: Flöte, Vogelzwitscher-Piccolo, Harfe. Neu für diese Folge: eine federnde „Boing“-Bassline (Maultrommel/Jaw Harp + Tuba), eine triumphale Zirkus-Fanfare für Tung Tungs Kunststücke.
- **Stimmung je Akt:**
  - **Akt 1 (0–12 s, Die Falle):** S01 Tusch + Harfen-Glissando auf die Enthüllung. S02 hektisches Xylophon beim Tarnen, Glockenspiel-Ping auf das Zwinkern. S03 schleichendes Pizzicato, darüber Holzblöcke im Hüpf-Rhythmus.
  - **Akt 2 (12–20 s, Das Naturtalent):** S04 kurzer Stopp, dann das große BOING. S05 Zirkus-Fanfare mit Flöte und Boing-Bass, Harfen-Glitzer am Spagat.
  - **Akt 3 (20–40 s, Die Vorführung):** S06 empörtes Fagott-Stakkato. S07 pompöses, leicht schiefes „Lehrer“-Motiv (Tuba). S08 ein tiefes Boing, dann **Musik-Stopp**, nur Fallpfeife. S09 PLATSCH, Stille, ein trauriger Fagott-Ton. S10 Boing-Bass + Holzblöcke im Lach-Rhythmus.
  - **Loop (40–45 s):** Rückkehr zum Plan-Motiv aus Folge 1 mit Flöte, fernes Boing auf dem Beat, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental spring cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts immediately with a brass stab and a harp glissando, then frantic xylophone and a glockenspiel ping, a sneaky pizzicato strings theme over bouncy wood blocks. A short stop, then a joyful circus fanfare with flute, harp sparkles and a springy jaw harp and tuba bass on every beat. An indignant bassoon staccato, a pompous slightly off-key tuba march, then a hard stop with only a falling slide whistle. A moment of silence and one sad bassoon note, then springy bass and wood blocks in a laughing rhythm, returning to the sneaky pizzicato plan theme with flute so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–22** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Frühling. Alles erwacht.“ (S01) ab ~0,5 s, über die Laubwolke.
- „Schräg.“ (S02) kurze Pause davor, fachmännisch.
- S04 ohne Erzähler: das BOING hat die Bühne.
- „Nur in die falsche Richtung: nach oben.“ (S05) bewundernd-sachlich.
- „Ganz vorsichtig.“ (S08) genau vor dem Abschuss.
- S10 ohne Erzähler: Lachen im Takt.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Planen-Whoosh ab Frame 1, Laub-Rascheln, Glitzer-Ping auf dem Sprungtuch |
| S02 | 0:04–0:08 | Laub-Rascheln im Stakkato, Blumen-Plopp, Zwinker-Ding |
| S03 | 0:08–0:12 | Holz-Hüpfer „tung tung tung“, Vogelgezwitscher, unterdrücktes Kichern |
| S04 | 0:12–0:15 | BOING (groß, federnd, tief gestimmt), Laub-Explosion, Staun-Glitzer |
| S05 | 0:15–0:20 | Boing-Rhythmus, Salto-Whooshs, Blütenwirbel-Glitzer, Federquietschen |
| S06 | 0:20–0:24 | Stampf-Schritte, empörtes Schnauben (SFX), Zeige-Whooshs |
| S07 | 0:24–0:28 | sanftes Schubs-Puff, weiches Holz-Tock bei der Landung, Polster-Quietschen |
| S08 | 0:28–0:33 | tiefes BOING, Fallpfeife, Schrei (SFX) |
| S09 | 0:33–0:36 | Riesen-PLATSCH, Matsch-Regen, Schwindel-Zwitschern |
| S10 | 0:36–0:40 | maniakales Lachen im Boing-Takt, Holz-Klappern |
| S11 | 0:40–0:45 | Tropfen, quatschende Sneaker, Blüte-Ausspucken „pff“, fernes Boing, Holzkratzen (geht nahtlos in Folge 1, S01 über) |
