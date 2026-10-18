# Sound – Tralaleros Rache, Folge 17: Der Schlitten

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Kufen, Schnee-Puff, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Winter-Farbe der Staffel 4: Schlittenglöckchen und Glockenspiel. Neu für diese Folge: ein galoppierender „Rodel“-Rhythmus (Pizzicato + Schlittenglöckchen), der beim Aufspringen von Tung Tung in einen fröhlichen Walzer kippt, und eine schwebende Harfen-/Celesta-Figur für das Feder-Segeln.
- **Stimmung je Akt:**
  - **Akt 1 (0–8 s, Der Hang):** S01 nur Wind und ein tiefer dramatischer Pauken-Schlag auf die Zeigegeste (Hook). S02 Rodel-Galopp setzt mit dem Bauchklatscher ein, accelerando.
  - **Akt 2 (8–24 s, Der Mitfahrer):** S03 Galopp + Glöckchen, immer schneller. S04 Speed-Ramp: kurzes Tape-Stop beim Hüpfer, dann kippt die Musik in einen albernen Walzer im Dreiertakt (Tung Tungs Glück). S05 Walzer gegen Tralaleros Panik (Fagott-Stolpern). S06 Walzer bricht ab, steigender Streicher-Tremolo-Lauf auf die Schanze.
  - **Akt 3 (24–45 s, Die Schanze):** S07 Zeitlupe, Harfen-Glissando und Celesta für Tung Tungs Feder-Segeln, darunter eine lange Fallpfeife für Tralalero. S08 Mini-Fanfare „ta-daa“ auf die Landung. **Harter Musik-Stopp exakt auf das Schnee-PUFF** (S09), Stille während der Sneaker zappeln. S10 Holzblöcke im Lach-Rhythmus. S11 Rückkehr zum Plan-Motiv aus Folge 1 mit leisen Glöckchen, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop, winter mood. Starts with cold wind and one dramatic timpani hit, then a galloping pizzicato strings rhythm with sleigh bells that keeps accelerating. A short tape-stop effect, then a silly happy waltz with glockenspiel and clumsy bassoon stumbling underneath. A rising string tremolo, then a slow-motion floating harp glissando with celesta and a long descending slide whistle. A tiny brass ta-daa, then a hard stop and two seconds of silence. Rhythmic wood blocks like laughter, then a return to the sneaky pizzicato plan theme with soft sleigh bells so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–16** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Winter.“ (S01) erst nach dem Pauken-Schlag (~1,2 s), mit Pause zwischen den Wörtern.
- „Diesmal kein Eis.“ (S02) trocken nachgeschoben – Callback auf Folge 16.
- „Holz ist leicht.“ (S07) und „Haie sind es nicht.“ (S08) als zusammengehöriges Paar, gleiche Melodie, über den Schnitt hinweg.
- „Die Natur ist grausam. Aber weich.“ (S09) **in die Stille nach dem PUFF**.
- S10 ohne Erzähler: das Lachen hat die Bühne.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Kalter Wind, Schnee-Knirschen, dramatischer Whoosh + Paukenschlag auf die Zeigegeste (im 1. Frame) |
| S02 | 0:04–0:08 | Bauchklatscher auf Holz, Kufen-Schaben, Fahrtwind, Schnee-Spritzen |
| S03 | 0:08–0:12 | Näherkommendes Kufen-Schaben (Doppler), steigender Whoosh, Holz-Knarzen |
| S04 | 0:12–0:16 | Leder-Riemen-Klatsch (Schläger auf den Rücken), fröhliches Boing beim Hüpfer, Holz-Klack beim Aufspringen |
| S05 | 0:16–0:21 | Fahrtwind, Kufen-Schaben, glückliches Holz-Klappern, entsetztes Schlucken |
| S06 | 0:21–0:24 | Steigender Whoosh, Kufen-Schaben, Cartoon-Schlucken |
| S07 | 0:24–0:28 | Schanzen-Whoosh, sanftes Windspiel für Tung Tung, langer Fallpfeifton für Tralalero |
| S08 | 0:28–0:32 | Sanftes Schnee-Puff bei der Landung, kleines Ding, verklingender Fallpfeifton |
| S09 | 0:32–0:36 | Riesiges weiches Schnee-PUFF, gedämpftes Grummeln, quietschendes Sneaker-Zappeln |
| S10 | 0:36–0:40 | Sanftes Kufen-Gleiten, Holz-Knarzen beim Hinsetzen, maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:40–0:45 | Schnee-Knirschen, Zähneklappern, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
