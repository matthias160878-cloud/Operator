# Sound – Tralaleros Rache, Folge 6: Der geklaute Schläger

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Schnarchen, Wusch, Platsch) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in Staffel 1 (Serien-Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Schleich-/Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für Staffel 2: ein kurzer Pauken-Wirbel + Blechbläser-Stich als Staffel-Opener-Signal, und ein „Rotor“-Ostinato aus schnellen Streicher-Tremoli.
- **Stimmung je Akt:**
  - **Akt 1 (0–12 s, Der Diebstahl):** S01 kurzer Pauken-Wirbel + Stich unter „Neue Staffel“, dann fast Stille – das Schnarchen ist der Beat. S02/S03 Pizzicato-Schleichmotiv auf Zehenspitzen, Fagott-Kichern beim Diebstahl.
  - **Akt 2 (12–28 s, Der Hubschrauber):** S04 ein schwerer Bläser-Akzent auf den Schwung, dann beschleunigt das Rotor-Ostinato (accelerando) durch S05/S06, Slide-Whistle abwärts beim Wegschleudern, Musik-Stopp exakt auf den PLATSCH (S07).
  - **Akt 3 (28–45 s, Heimkehr):** S08 Slide-Whistle abwärts + Triangel-„Ping“ bei der Landung; S09/S10 kitschiges Spieluhr-/Celesta-Schlaflied (Kuschel-Kontrast); ab S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a short timpani roll and brass sting like a new season opener, then near silence, then a sneaky pizzicato strings tiptoe theme with a giggling bassoon. Middle: a heavy brass hit, then a fast accelerating string tremolo ostinato like a helicopter rotor, a falling slide whistle and a sudden stop. Final section: a descending slide whistle and a triangle ping, a sweet celesta music-box lullaby, then a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–5** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Neue Staffel. Alter Groll.“ mit kleiner Pause zwischen den Sätzen, wie ein Doku-Kapiteltitel.
- „Phase eins“/„Phase zwei“ geflüstert-leiser (S02/S03 – es wird geschlichen), ab S04 wieder normale Lautstärke.
- S06 und S07 bleiben ohne Erzähler: Rotor, Fallpfeifen und PLATSCH haben die Bühne.
- „Wie immer.“ (S10) erst nach ca. 1,5 s setzen, nachdem Tung Tung den Schläger umarmt hat.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Lautes Holz-Schnarchen (3×), Blätter-Windstoß je Schnarcher, Holzknarzen |
| S02 | 0:04–0:08 | Cartoon-Zehenspitzen-Schritte, geflüstertes „Psst“ (SFX), Schnarchen im Hintergrund |
| S03 | 0:08–0:12 | Holz-Schaben (Schläger vom Stamm), fieses Kichern (SFX), Snap-Zoom-Whoosh, Schnarchen |
| S04 | 0:12–0:16 | Schwerer Schwung-Whoosh, Holz-Ächzen, Sneaker-Rutschen auf Erde |
| S05 | 0:16–0:21 | Rotor-Wusch, immer schneller, Blätter-/Staubwirbel, Cartoon-Hubschrauber |
| S06 | 0:21–0:25 | Kreiselnder Rotor-Wusch (Doppler), Fallpfeifen, ferner Schrei (SFX) |
| S07 | 0:25–0:28 | Riesen-PLATSCH, Matsch-Regen, steigender Whoosh (Schläger), Cartoon-Boing |
| S08 | 0:28–0:32 | Fallpfeifen abwärts, Holz-„Klack“, kurzes Wackeln, Triangel-Ping, Schnarchen |
| S09 | 0:32–0:36 | Langes knarzendes Holz-Gähnen, Finger tippen auf Holz |
| S10 | 0:36–0:41 | Zufriedenes Holz-Knarzen, leises Schnarchen, Blatt-Flattern, Vogel-Piep |
| S11 | 0:41–0:45 | Quatschende Sneaker, Matsch-Tropfen, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
