# Sound – Tralaleros Rache, Folge 20: Das Geschenk

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt. Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Den Kling-Eigenton (Schnee-Knirschen, BOING, Lachen) kann man als Basis behalten, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung). Ausnahme: S07 frei, ohne Puls.
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Winter-Farben der Staffel 4: Schlittenglöckchen und Glockenspiel. Neu für das Finale: ein einzelnes, ehrlich warmes Motiv auf Celesta und gedämpftem Solo-Cello für die Rührung (S06–S07), außerdem eine **Maultrommel/Jaw-Harp-Boing-Linie** als Feder-Motiv.
- **Stimmung je Akt:**
  - **Akt 1 (0–8 s, Das Paket):** S01 schleichendes Pizzicato mit Jaw-Harp-Boings auf jedes Wackeln der Box. S02 Stapf-Rhythmus mit Fagott und Schlittenglöckchen.
  - **Akt 2 (8–20 s, Die Übergabe):** S03 süßlich-falscher Glockenspiel-Walzer (Unschuldslächeln). S04 Walzer weiter, eine Spur gerührter. S05 **Plattenkratzer**, Musik stoppt abrupt.
  - **Akt 3 (20–28 s, Die Rührung):** S06 Celesta setzt leise ein. S07 Celesta + Solo-Cello, warm, ehrlich, **nicht ironisch**. Einziger ruhiger Moment der Staffel.
  - **Akt 4 (28–40 s, Der Bumerang):** S08 Cello-Ton hängt noch, dann **harter Stopp auf das BOING**, Slide-Whistle nach oben beim Flug. S09 Stille, nur PUFF; ein winziges Celesta-Ping auf die hochgehaltene Figur (Callback). S10 Holzblöcke im Lach-Rhythmus, darunter ein kurzer, ironisch-feierlicher „Staffelende“-Bläsertusch.
  - **Loop (40–45 s):** Rückkehr zum Plan-Motiv aus Folge 1 mit Schlittenglöckchen, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental winter cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts immediately with sneaky pizzicato strings and comedic jaw harp boings, then a stomping bassoon rhythm with sleigh bells. A sweet, overly innocent glockenspiel waltz, cut off by a record scratch. Then a short sincere, warm and tender passage on celesta and solo cello without a beat, genuinely emotional. A hard stop on a loud cartoon spring boing, a rising slide whistle, near silence with one tiny celesta ping, rhythmic wood blocks like laughter under a short mock-festive brass fanfare, then a return to the sneaky pizzicato theme with sleigh bells so the end connects to the beginning. No vocals, no lyrics, no christmas carols.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–19** (ElevenLabs: Stability ~70 %, Style niedrig), trocken, nicht lustig *gespielt*.
- „Der Wald. Winter. Staffelfinale.“ (S01) ab ~0,5 s, feierlich-sachlich wie in Folge 15.
- „Mit Feder.“ (S02) nach kleiner Pause.
- „Moment. Das war nicht geplant.“ (S05) direkt nach dem Plattenkratzer.
- „Tralalero ist gerührt. Zum ersten Mal in vier Staffeln.“ (S07) leiser, fast ehrlich, ohne Ironie in der Stimme.
- „Falsch herum.“ (S08) muss **vor** dem BOING fertig sein.
- „Die Figur: unversehrt.“ (S09) erleichtert-trocken, auf die hochgehaltene Figur.
- „Die Winter-Staffel endet. Im Schnee.“ (S10) unter das Lachen, Lachen nicht ducken.
- „Für Staffel fünf.“ (S11) als letzter, augenzwinkernder Satz.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Feder-Quietschen, Schnee-Quetschen, Deckel-Plopp, Schleifen-Rascheln, bedrohliches Wackel-Boing (ab Frame 1) |
| S02 | 0:04–0:08 | Schnee-Stapfen, gedämpftes Feder-Boing in der Box, kalter Wind |
| S03 | 0:08–0:12 | Schnee-Knirschen, Holz-Knarzen, unschuldiges Glitzer-Bling (Wimpernklimpern) |
| S04 | 0:12–0:16 | Schleifen-Rascheln, gerührtes Holz-Knarzen, winziges gedämpftes Boing |
| S05 | 0:16–0:20 | Box-Plumps im Schnee, Papier-Rascheln, Plattenkratzer, Blinzel-Ping |
| S06 | 0:20–0:23 | Papier-Knistern, zartes Glitzer-Ping |
| S07 | 0:23–0:28 | Leiser Wind, Schniefen, Rieseln der Schneeflocken |
| S08 | 0:28–0:32 | Schleifen-Zipp, lautes BOING (Feder ins Leere), riesiges Pulverschnee-WUSCH |
| S09 | 0:32–0:36 | Weiches Schnee-PUFF, gedämpftes Grummeln, Sneaker-Quietschen, kleines Glitzer-Ping auf der Figur |
| S10 | 0:36–0:40 | Feder-Wabbeln, Holz-Knarzen, maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:40–0:45 | Schnee-Knirschen, quietschende Sneaker, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
