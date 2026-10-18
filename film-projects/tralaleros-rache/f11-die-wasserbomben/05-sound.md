# Sound – Tralaleros Rache, Folge 11: Die Wasserbomben

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Platscher, Pops, Wind) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für Staffel 3: ein kurzer Blechbläser-Fanfarenstoß als Staffel-Signet und ein „Wellness“-Motiv aus Harfen-Glissandi und Glockenspiel für Tung Tungs Dusche.
- **Stimmung je Akt:**
  - **Akt 1 (0–12 s, Der Angriff):** S01 schwebendes, fieses Pizzicato-Plan-Motiv mit Fagott, tief und triumphierend; S02 Spannung, Streicher-Tremolo beim Zielen; **Musik-Stopp exakt auf den PLATSCH** in S03, nur eine Grille.
  - **Akt 2 (12–25 s, Die Dusche):** S04 Harfen-Glissando, wenn Tung Tung zu strahlen beginnt; S05 hektisches Plan-Motiv, immer schneller (Tralaleros Wut); S06 kitschiges Wellness-Motiv (Harfe, Glockenspiel, weiche Streicher) – der Kontrast ist der Witz.
  - **Akt 3 (25–45 s, Pop-pop-pop):** S07 Crescendo auf den Wurf, Stopp auf den ersten POP; S08 die Pops **sind** der Rhythmus (Holzblöcke/Pizzicato synchron zu den Pops), absteigende Slide-Whistle; harter Stopp auf den PLATSCH (S09); S10 Holzblöcke im Lach-Rhythmus; S11 kurzer Fanfarenstoß auf „Staffel drei“, dann Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts with a sneaky triumphant pizzicato strings and bassoon theme that feels like floating, then tense string tremolo and a sudden full stop. A harp glissando, then the sneaky theme getting faster and angrier, then a cheesy relaxing spa melody with harp, glockenspiel and soft strings. A crescendo and a stop, then playful rhythmic wood block and pizzicato hits in a chain like popping balloons with a descending slide whistle and a hard stop. Rhythmic wood blocks like laughter, a short brass fanfare sting, then a return to the sneaky pizzicato theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–10** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald.“ (S01) ab ca. 0,5 s, kurze Pause vor „Phase eins: Luftüberlegenheit.“
- „Volltreffer.“ (S03) erst **nach** dem PLATSCH, mitten in die Stille.
- „Tung Tung findet das … herrlich.“ (S04) mit echter Pause an den Auslassungspunkten.
- „Ein winziger Konstruktionsfehler.“ (S07) **vor** dem ersten POP enden lassen.
- S09 ohne Erzähler: der PLATSCH hat die Bühne.
- „Staffel drei.“ (S11) als eigener kleiner Satz, kurze Pause, dann der Serien-Schlusssatz.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Ballon-Gummi-Quietschen, Wind über den Baumkronen, Blätterrauschen, fieses Kichern (SFX) |
| S02 | 0:04–0:08 | Wasserbomben-Gummi-Quietschen, Wasser-Gluckern im Ballon, ferne hohle Holzschritte „tung tung“ |
| S03 | 0:08–0:12 | Fallpfeifen, lautes PLATSCH, Tropfen, Stille mit einer Grille |
| S04 | 0:12–0:16 | Tropfen, Holz-Knarzen, Schläger-„Tock“ an der Rinde, fröhliches Holz-Klappern |
| S05 | 0:16–0:20 | Wurf-Whooshes im Stakkato, Gummi-Quietschen, ferne Platscher, Wut-Grunzen (SFX) |
| S06 | 0:20–0:25 | Dusch-Platschen durchgehend, Schrubb-Quietschen, Schaum-Blubbern, glückliches Summen (SFX, ohne Worte) |
| S07 | 0:25–0:29 | Großer Wurf-Whoosh, Kratzen von Gummi am Zweig, erster lauter POP |
| S08 | 0:29–0:33 | POP-POP-POP-Kette (rhythmisch), flatternder Gummi, Panik-Wimmern (SFX), Blätterrascheln beim Sinken |
| S09 | 0:33–0:36 | Letzter POP, Fallpfeifen, Riesen-PLATSCH, Matsch-Regen, Cartoon-Boing |
| S10 | 0:36–0:40 | Glitzer-Ping, maniakales Lachen (SFX), Holz-Klappern, Knie-Klopfen „tock“ |
| S11 | 0:40–0:45 | Quatschende Sneaker, Matsch-Tropfen, pfeifendes Luft-Entweichen aus dem Ballonrest, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
