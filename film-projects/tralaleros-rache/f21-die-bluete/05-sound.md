# Sound – Tralaleros Rache, Folge 21: Die Blüte

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Wasserprasseln, Sprenger-Ticken, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für die Frühlings-Staffel: **Blockflöte/Piccolo mit Vogelzwitscher-Trillern**, **Harfen-Glissandi** und **Marimba** als Frühlingsfarbe, eine verträumte **Harfen-Celesta-Fläche** fürs Aufblühen. Die Schlittenglöckchen der Winter-Staffel fallen weg.
- **Stimmung je Akt:**
  - **Akt 1 (0–12 s, Der Sprenger):** S01 rasantes Zeitraffer-Glissando (Harfe aufwärts, Piccolo-Triller), dann Pizzicato-Plan-Motiv mit Marimba. S02/S03 schleichendes Pizzicato, Holzblöcke im Schritt-Takt.
  - **Akt 2 (12–24 s, Die Blüte):** **Musik-Stopp auf das FSCHHH** (S04). S05 zarte Harfen-Celesta-Fläche, die mit jeder Blüte aufblüht; S06 beschwingte, leicht kitschige Frühlings-Melodie (Flöte + Streicher).
  - **Akt 3 (24–45 s, Die Pollen):** S07 schwebende Flöte, dann ein langsam steigendes Tremolo auf die zuckende Nase (S08) – **harter Stopp exakt auf das HATSCHI**. S09 Slide-Whistle abwärts beim Rollen, Platsch ohne Musik, dann Fagott-Tröpfeln im Sprenger-Takt. S10 Holzblöcke im Lach-Rhythmus mit Vogeltrillern. S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop, fresh spring mood. Opens with a fast rising harp glissando and piccolo bird trills like a time-lapse, then a sneaky pizzicato strings theme with marimba and wood blocks. A sudden stop, then a dreamy harp and celesta texture blooming slowly into a bouncy, slightly cheesy spring melody on flute and strings. A floating flute line, a rising string tremolo and a hard stop. A descending slide whistle, silence, plinking bassoon notes, rhythmic wood blocks like laughter with bird trills, then a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–20** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Frühling.“ (S01) ab ~1 s, über dem Zeitraffer; „Phase eins: der Rasensprenger.“ auf das Aufdrehen des Hahns.
- „Volltreffer.“ (S04) direkt nach dem FSCHHH, knapp und zufrieden.
- „Doch Tung Tung ist aus Holz.“ (S05) langsam, mit leichtem Staunen.
- „Frühling bedeutet: Pollen.“ (S07) ahnungsvoll, vor dem Nieser fertig.
- S08 und S10 ohne Erzähler: HATSCHI und Lachen haben die Bühne.
- „Die Natur ist grausam. Und sie blüht.“ (S09) nach dem Platsch, über dem Sprenger-Takt.
- „Staffel fünf.“ (S11) mit kleiner Pause danach, dann der Serien-Schlusssatz.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:05 | Zeitraffer-Whoosh, schmelzendes Tropfen, Blumen-Plopps (in der 1. Sekunde), Metall-Thunk beim Rammen, quietschender Messinghahn, Wasser-Zischen |
| S02 | 0:05–0:08 | Blätterrascheln, Sprenger-Ticken „tick-tick-tick“, unterdrücktes Kichern |
| S03 | 0:08–0:12 | Hohle Holz-Schritte „tung tung“, Vogelgezwitscher, Sprenger-Ticken lauter werdend |
| S04 | 0:12–0:15 | Lautes FSCHHH, Wasser klatscht auf Holz, Tropfen |
| S05 | 0:15–0:20 | Knospen-Plopps, wohliges Holz-Knarzen, Glitzer-Ping, sanftes Wasserprasseln |
| S06 | 0:20–0:24 | Dusch-Plätschern, zufriedenes Holz-Seufzen, Vögel |
| S07 | 0:24–0:28 | Windstoß, Blüten-Rascheln, schwebender Glitzer-Whoosh |
| S08 | 0:28–0:32 | Dreimal Einatmen-Zucken, Riesen-„HATSCHI“ (SFX, kein Dialog), Blätter-Explosion, Whoosh rückwärts |
| S09 | 0:32–0:37 | Roll-Plumpser, Riesen-Platsch, Matsch-Regen, Sprenger-Strahl „fsch-fsch-fsch“ im Takt |
| S10 | 0:37–0:40 | Maniakales Lachen (SFX), Holz-Klappern, Blütenblatt-„Pling“ |
| S11 | 0:40–0:45 | Tropfen, quatschende Sneaker, kleiner Nieser (SFX), schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
