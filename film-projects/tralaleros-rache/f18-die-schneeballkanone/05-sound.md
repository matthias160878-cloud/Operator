# Sound – Tralaleros Rache, Folge 18: Die Schneeballkanone

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (FUMP, PLOCK, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Winter-Farbe der Staffel 4: Glockenspiel und Schlittenschellen. Neu für diese Folge: eine kurze, übertrieben feierliche **Stadion-Orgel-Figur** (Baseball-Gag) für Tung Tungs Schlaghaltung und die Ehrenrunde.
- **Stimmung je Akt:**
  - **Akt 1 (0–7 s, Die Kanone):** S01 keine Musik – das FUMP im ersten Frame ist der Hook. Ab S02 treibendes Pizzicato mit Schellen, Akzente exakt auf den FUMPs.
  - **Akt 2 (7–24 s, Das Training):** S03 Stadion-Orgel-Lauf („Let's go“-artige Figur, eigene Melodie) auf die leuchtenden Augen. S04 Holzblöcke synchron zu PLOCK-PLOCK-PLOCK. S05 hektisches Fagott-Gestolper, accelerando. S06 langer Wirbel beim Aufziehen, Stopp auf das tiefe FUMP.
  - **Akt 3 (24–45 s, Der Homerun):** S07 Zeitlupe – Musik tief und gedehnt (Tape-Stop), ein heroischer Orgel-Akkord auf den Schwung. S08 Slide-Whistle abwärts mit dem fallenden Ball, **harter Musik-Stopp auf das FLUMPF**. S09 völlige Stille, nur ein Glockenspiel-Ton auf jedes Blinzeln. S10 Stadion-Orgel + Holzblöcke im Lach-Rhythmus. S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop, wintery. Starts after 3 seconds with driving pizzicato strings and sleigh bells, accents on rhythmic hits. Then a short cheerful stadium organ run like at a baseball game, rhythmic wood blocks, a clumsy accelerating bassoon, a long drum roll that stops abruptly. A slowed-down tape-stop section with one heroic organ chord, a descending slide whistle and a hard stop into silence with two single glockenspiel notes. Then stadium organ and wood blocks like laughter, and a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–17** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Im Winter.“ (S01) erst nach dem FUMP setzen (~0,8 s).
- „Er sieht Training.“ (S03) mit kleiner Pause davor – Pointe.
- S04 zwischen die PLOCKs legen, nicht drüber.
- „Ein perfekter Schwung. Ein historischer Moment.“ (S07) langsam und andächtig – passt zur Zeitlupe.
- „Die Natur ist grausam. Und sie baut Schneemänner.“ (S09) erst nach dem ersten Blinzeln.
- S10 ohne Erzähler: Ehrenrunde und Lachen haben die Bühne.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:03 | Hohles Feder-FUMP (im 1. Frame), Whoosh dicht an der Kamera vorbei, Kurbel-Ratschen |
| S02 | 0:03–0:07 | FUMP-FUMP-FUMP im Rhythmus, Kurbel-Ratschen, Schneeknirschen, Bommel-Wackeln (leises Flapp) |
| S03 | 0:07–0:11 | Holz-Knarzen beim In-Position-Gehen, Glitzer-Ding in den Augen, ferne FUMPs, anfliegende Whooshes |
| S04 | 0:11–0:16 | PLOCK – PLOCK – PLOCK (trockenes Holz auf Schnee), Pulverschnee-Puff, Whoosh zurück |
| S05 | 0:16–0:20 | Weiche Schnee-Plopps rundherum, hektisches Kurbel-Ratschen, Panik-Quietschen (SFX, kein Dialog) |
| S06 | 0:20–0:24 | Schnee-Quetschen im Trichter, langes Aufzieh-Knarren der Feder, extra tiefes FUMP, Kisten-Rumpeln |
| S07 | 0:24–0:29 | Gedehnter Zeitlupen-Whoosh, ein tiefes befriedigendes PLOCK, Glitzer-Twinkle, Steig-Whoosh |
| S08 | 0:29–0:33 | Fallpfeifen, wachsendes Schnee-Rollen, weiches tiefes FLUMPF, rieselnder Schnee |
| S09 | 0:33–0:37 | Stille, kleines Schnee-Plopp auf der Mütze, zwei winzige Blinzel-Klicks |
| S10 | 0:37–0:41 | Knirschende Schnee-Schritte, Jubel-Whoosh, maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:41–0:45 | Schnee-Abschütteln, knirschende Sneaker, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
