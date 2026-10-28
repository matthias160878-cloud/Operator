# Sound – Tralaleros Rache, Folge 16: Der Schneemann

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Schneeknirschen, Eis-Rutschen, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für die Winter-Staffel: **Schlittenglöckchen** und **Glockenspiel/Celesta** als Winterfarbe, eine kitschig-süße **Walzer-Figur** (3/4, Celesta + Streicher) für die Liebe zum Schneemann und ein schwungvolles **Eislauf-Walzer-Zitat** (frei komponiert, kein bekanntes Stück) für das Schlittern.
- **Stimmung je Akt:**
  - **Akt 1 (0–11 s, Die Tarnung):** S01 fast still – nur Wind und ein einzelnes Glockenspiel-Ping auf das Blinzeln. Ab S02 schleichendes Pizzicato mit Schlittenglöckchen im Schritt-Takt, S03 kurzer Celesta-Glitzer aufs Entzücken.
  - **Akt 2 (11–24 s, Die Liebe):** S04/S05 kitschiger Walzer (Celesta, weiche Streicher), darunter ein immer höheres Kitzel-Tremolo (Violinen) – Spannung steigt. **Harter Musik-Stopp exakt auf das HATSCHI** (S06), dann nur Pulverschnee-Puff.
  - **Akt 3 (24–45 s, Das Eis):** S07 überdrehter Eislauf-Walzer, wackelig, mit Slide-Whistle-Glissandi auf den Pirouetten. S08 Musik bricht ab – **zwei Sekunden Stille** nach „Gerettet.“. S09 KNACK ohne Musik, dann Fagott-Zittern im Zähneklapper-Rhythmus. S10 Holzblöcke im Lach-Rhythmus mit Schlittenglöckchen. S11 Rückkehr zum Plan-Motiv aus Folge 1 (mit leisen Schlittenglöckchen), damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop, winter mood. Starts almost silent with soft wind and a single glockenspiel ping, then a sneaky pizzicato strings theme with sleigh bells. A sweet, over-the-top cheesy waltz on celesta and soft strings with a rising tickling violin tremolo, then a hard stop. A wobbly, exaggerated ice-skating waltz with slide whistle glissandos, then a sudden stop and two seconds of silence. Shivering bassoon notes, rhythmic wood blocks like laughter with sleigh bells, then a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–15** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Winter.“ (S01) erst nach dem ersten Blinzeln (~1,5 s), „Phase eins: Tarnung.“ direkt danach.
- „Tung Tung ist verliebt.“ (S03) ein wenig gerührt.
- „Doch Wolle kitzelt.“ (S06) **vor** dem HATSCHI fertig – der Nieser hat die Bühne.
- „Gerettet.“ (S08) langsam und zufrieden, danach Stille bis zum KNACK.
- „Die Natur ist grausam. Und eiskalt.“ (S09) nach dem Platsch, über dem Zähneklappern.
- S10 ohne Erzähler: das Lachen hat die Bühne.
- „Staffel vier.“ (S11) mit kleiner Pause danach, dann der Serien-Schlusssatz.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Leiser Winterwind, rieselnder Schnee, Nasen-Zuck-„Boing“ (in der 1. Sekunde), zwei Blinzel-Klicks |
| S02 | 0:04–0:08 | Schneeknirschen im Schritt-Rhythmus, Holz-Klopfen, Wind |
| S03 | 0:08–0:11 | Entzückt-Glitzer-Ping, Holz-Knarzen, nervöses Schlucken im Schneemann |
| S04 | 0:11–0:16 | Woll-Rascheln, Schnee-Knirschen, feines Kitzel-„Fluff“ |
| S05 | 0:16–0:20 | Tannenzapfen-Plopp, langes zufriedenes Holz-Knarzen, ansteigendes Kitzel-Quietschen |
| S06 | 0:20–0:24 | Dreimal Einatmen-Zucken, Riesen-„HATSCHI“ (SFX, kein Dialog), weicher Pulverschnee-Puff, Schnee rieselt nach, Schal-Flattern |
| S07 | 0:24–0:29 | Sneaker-Quietschen auf Eis, Kratz-Rutschen, Whoosh je Pirouette, Cartoon-Rudern |
| S08 | 0:29–0:32 | Wackel-Quietschen, langes erleichtertes Ausatmen, Stille, winziges Eis-Ticken am Ende |
| S09 | 0:32–0:36 | Lautes Eis-KNACK, Platsch, klirrende Eisschollen, Zähneklappern (schnell, cartoonhaft) |
| S10 | 0:36–0:40 | Maniakales Lachen (SFX), Holz-Klappern, Schnee rieselt ab |
| S11 | 0:40–0:45 | Zähneklappern, Tropfen, quatschende Sneaker im Schnee, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
