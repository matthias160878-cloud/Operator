# Sound – Tralaleros Rache, Folge 2: Die Ritterrüstung

Wie in Folge 1: Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und Haupt-SFX kommen im Schnitt dazu. Kling-Eigenton (Scheppern, Schritte) als Basis auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie Folge 1 (Serien-Wiedererkennung); in Akt 2 ein *Ritardando* – die Musik wird mit der Rüstung langsamer und tiefer, bis sie bei S06 stehen bleibt.
- **Instrumente:** Serien-Grundbesetzung (Pizzicato-Streicher, Fagott, Tuba, Holzblöcke/Bongos, Xylophon, Slide-Whistle) + für diese Folge **Fanfare (Trompeten), Snare-Marsch** und eine **Spieluhr/Celesta**, die „ausläuft“.
- **Stimmung je Akt:**
  - **Akt 1 (0–11 s, Der Ritter):** übertriebene Mini-Fanfare beim Helm (S01), pompöser Ritter-Marsch mit Snare und Trompeten (S02–S03) – lächerlich heroisch.
  - **Akt 2 (11–28 s, Der Rost):** Der Marsch verlangsamt sich hörbar (Tape-Stop-Effekt / Pitch runter) synchron zum Quietschen; bei S06 bleibt die Musik mit einem letzten tiefen Tuba-Ton stehen → Stille + Grillen. S07: nur eine zarte, neugierige Spieluhr-Melodie für Tung Tung.
  - **Akt 3 (28–45 s, Das Tock):** Stille vor dem „Tock“ (S08), dann Tuba-„Wah-wah-wah-waaah“ beim Zerfall (S09), chaotischer Holzblock-Rhythmus zum Lachen (S10). Ab S11 zurück zum schleichenden Serien-Motiv – geht nahtlos in die Fanfare von S01 über.
- **Loop-Regel:** Track beginnt und endet im selben Tempo, letzter Takt endet exakt bei 0:45, kein Fade-out.

**Prompt für einen Musikgenerator (z. B. Suno/Udio, instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a tiny over-the-top heroic trumpet fanfare and a pompous knight march with snare drum, tuba and pizzicato strings. The march gradually slows down and drops in pitch like a tape stop until it grinds to a halt on one low tuba note, followed by silence. Then a delicate curious music box melody. Then a sad trombone "wah wah wah waaah" and chaotic wooden block percussion. Ends with a sneaky villain theme on bassoon and pizzicato that connects back to the opening fanfare. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (eine Zeile pro Einsatz, in Shot-Reihenfolge).
- **Gleiche Stimme und gleiche Einstellungen wie Folge 1** (ElevenLabs: dieselbe Voice-ID, „Stability“ ~70 %, „Style“ niedrig) – trocken, nicht lustig *gespielt*.
- Einsätze an den Shot-Anfang legen (Zeiten: `edit/subtitles.srt`). Bei „ergibt … Rost.“ (S06) eine echte Pause vor „Rost“ lassen – das Wort fällt genau mit dem Erstarren zusammen.
- S02 und S07 bei Bedarf 1,05× schneller.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:03 | Metall-Scheppern, Blätterrascheln, Visier-„Klack“, Glint-„Ping“ |
| S02 | 0:03–0:07 | Rüstungs-Klappern, Helm rutscht (Blech-Schaben), heroischer Metall-Ring, Tropfen |
| S03 | 0:07–0:11 | Wind in den Blättern, Visier fällt zu, dumpfer Spannungs-Ton |
| S04 | 0:11–0:15 | Schwere Blech-Schritte, Wasser quatscht in den Gelenken |
| S05 | 0:15–0:19 | Rost-Knistern (wie Eis/Knisterfolie), langgezogenes Quietschen, Tropfen |
| S06 | 0:19–0:24 | Quietschen immer lauter und langsamer, Metall-Knirschen, abrupte Stille, Grillenzirpen |
| S07 | 0:24–0:28 | Leise hohle Holzschritte, Grillen, Cartoon-Augenblinzeln |
| S08 | 0:28–0:31 | Ein einzelnes sanftes, hohles **„Tock“**, feines Knistern, Stille |
| S09 | 0:31–0:35 | Rost rieselt wie Sand, Zusammensacken, peinlicher Cartoon-Quietscher |
| S10 | 0:35–0:40 | Maniakales Lachen, Holz-Klappern, „Tock“ beim Knieklopfen |
| S11 | 0:40–0:45 | Blätterrascheln, fieses Kichern – endet im Busch-Rascheln, mit dem S01 beginnt (Loop) |

**Lautstärke-Ziel:** -14 LUFS integriert, True Peak ≤ -1 dBTP. Das „Tock“ in S08 ist bewusst leise und trocken – Wirkung durch die Stille davor.
