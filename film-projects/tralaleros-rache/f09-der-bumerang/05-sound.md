# Sound – Tralaleros Rache, Folge 9: Der Bumerang

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Sirren, Platsch, Klatschen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für diese Folge: ein kreisendes „Bumerang“-Motiv aus auf- und absteigenden Xylophon-Läufen (wie ein Doppler) und ein kurzes Walzer-Thema auf Celesta für Tung Tungs Pirouette.
- **Stimmung je Akt:**
  - **Akt 1 (0–7 s, Der Wurf):** S01 keine Musik – nur das Sirren ist der Hook; Einsatz mit einem Blechbläser-Stich auf den Schnitt zu S02, dann stolzes Pizzicato-Plan-Motiv.
  - **Akt 2 (7–20 s, Das Spiel):** S03 Bumerang-Motiv kreist; S04 Musik-Stopp auf den Fang („Klack“), dann Holzblock-Kichern; S05 kurzer, kitschiger Celesta-Walzer (3/4 gegen 150 BPM) für die Pirouette.
  - **Akt 3 (20–45 s, Die Jagd):** S06/S07 hektischer Galopp, Bumerang-Motiv immer schneller (accelerando, Schleifen enger), Slide-Whistle beim Hechtsprung, **harter Musik-Stopp exakt auf den PLATSCH** (S08). S09 komplette Stille bis zum „Tock“ der Hut-Landung, dann ein einzelner Triangel-Ping. S10 Holzblöcke im Lach-Rhythmus. S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts after 3 seconds with a brass sting and a proud sneaky pizzicato strings theme. Then circling xylophone runs rising and falling like a boomerang, a sudden stop, playful wood block giggles and a short kitschy celesta waltz. Then a frantic galloping chase with accelerating xylophone loops, a slide whistle and a hard stop. A few seconds of silence, one triangle ping, rhythmic wood blocks like laughter, then a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–8** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald.“ (S01) erst nach dem Vorbeiflug setzen (~1,5 s), damit das Sirren den Hook trägt.
- „Eine Waffe, die immer zurückkommt.“ (S02) mit leichter, wissender Pause davor.
- S08 und S10 ohne Erzähler: PLATSCH und Lachen haben die Bühne.
- „Immerhin: Er steht ihm.“ (S09) erst **nach** dem „Tock“ der Hut-Landung.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:03 | Sirrendes Wirbel-Whoosh, steigend, scharfer Doppler-Vorbeiflug, Blätter-Wirbel |
| S02 | 0:03–0:07 | Wurf-Ächzen (SFX), Sirren entfernt sich, Sneaker-Schaben auf Erde |
| S03 | 0:07–0:11 | Durchgehendes Sirren (näherkommend), hohles Holz-Knarzen beim Kopfneigen |
| S04 | 0:11–0:15 | Trockenes Holz-„Klack“ beim Fang, fröhliches Holz-Klappern, Hüpfer-„Tock“ |
| S05 | 0:15–0:20 | Eleganter Dreh-Whoosh, Glitzer-Ping, Sirren entfernt sich |
| S06 | 0:20–0:24 | Cartoon-Rennschritte, Panik-Schrei (SFX), Sirren dicht dahinter |
| S07 | 0:24–0:29 | Zischende/qualmende Sneaker, Doppler-Schleifen um die Bäume, Rennschritte |
| S08 | 0:29–0:32 | Sprung-Whoosh, Riesen-PLATSCH, Matsch-Regen, dann abrupte Stille |
| S09 | 0:32–0:36 | Stille, Tropfen, sanftes Holz-„Tock“ (Hut-Landung), ein einzelner Vogel |
| S10 | 0:36–0:40 | Hohles Holz-Klatschen, maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:40–0:45 | Quatschende Sneaker, Matsch-Tropfen, Bumerang-Wackel-Klappern, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
