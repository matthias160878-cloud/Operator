# Sound – Tralaleros Rache, Folge 10: Das Unwetter

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Regen, Platschen, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle, Pauke; neu für das Staffelfinale: tiefe Pauken-Wirbel als Donner-Motiv, ein kleines „Surf“-Gitarrenriff (Hai im Wasser) und ein kitschiges Streicher-Rührungsthema mit Celesta für die Übergabe.
- **Stimmung je Akt:**
  - **Akt 1 (0–7 s, Das Unwetter):** S01 keine Musik vor dem Donner – Blitz + Donner sind der Hook; danach Pauken-Wirbel und ein fröhliches, platschendes Pizzicato (Tralalero genießt).
  - **Akt 2 (7–22 s, Die Rettung):** S03 hektisches Fagott-Stolpern (Tung Tung treibt); S04 Stopp, nur ein Ticken; S05 Surf-Riff auf den Hai-Sprung; S06 wird leiser und weicher, Regen und Musik klingen gemeinsam aus.
  - **Akt 3 (22–40 s, Das Geschenk):** S07 Rührungsthema (Streicher + Celesta, übertrieben feierlich); S08 Fanfare auf den Triumph, kippt in den Rotor-Wirbel (Motiv aus Folge 6); **harter Musik-Stopp exakt auf den PLATSCH** (S09); S10 Holzblöcke im Lach-Rhythmus.
  - **Loop (40–45 s):** Rückkehr zum Plan-Motiv aus Folge 1 mit einem kleinen „Staffelfinale“-Schlussakkord auf dem letzten Wort – aber ohne Fade, damit der Loop zu Folge 1, S01 nahtlos bleibt.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts after 1 second with a timpani roll like thunder, then a happy splashing pizzicato theme. Then a clumsy panicked bassoon line, a sudden stop with only a ticking clock, a short heroic surf guitar riff, and a soft calm fade into a kitschy sentimental strings and celesta theme. Then a triumphant brass fanfare that turns into a spinning whirling helicopter motif and a hard stop. A few seconds of silence, rhythmic wood blocks like laughter, then a return to the sneaky pizzicato plan theme with a small final chord so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–9** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Staffelfinale.“ (S01) erst **nach** dem Donner setzen (~1,2 s).
- „Ein Dilemma. Der Plan … oder der Feind.“ (S04) mit echter Pause bei „…“.
- „Ein historischer Moment.“ (S07) feierlich, minimal langsamer – Callback Folge 5.
- S09 ohne Erzähler: der PLATSCH hat die Bühne.
- „Für Staffel drei.“ (S11) als trockener Nachsatz, kleine Pause davor.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:03 | Blitz-Knall, rollender Donner, schlagartig prasselnder Starkregen |
| S02 | 0:03–0:07 | Starkregen, gluckerndes steigendes Wasser, fröhliches Planschen |
| S03 | 0:07–0:11 | Regen, Wasserschwappen, hohles Holz-Klopfen beim Zappeln, panisches Holz-Quietschen |
| S04 | 0:11–0:14 | Regen, zwei Whip-Whooshes, Ticken einer Uhr |
| S05 | 0:14–0:18 | Sprung-Whoosh, sauberer Eintauch-Platsch, Flossen-Zischen durchs Wasser |
| S06 | 0:18–0:22 | Regen klingt aus, sanftes Wellenplätschern, weiches Holz-„Tock“ am Ufer |
| S07 | 0:22–0:27 | Tropfen, erste Vogelstimmen, sentimentales Glitzer-„Pling“, leises Holzknarzen |
| S08 | 0:27–0:32 | Triumph-Whoosh, schwerer Schwung, steigender Rotor-Wusch (wie Folge 6), Wasser-Gischt |
| S09 | 0:32–0:36 | Rotor-Wusch, Fallpfeifen, Riesen-PLATSCH, steigender Whoosh (Schläger), Cartoon-Boing |
| S10 | 0:36–0:40 | Fallpfeifen, Holz-„Klack“ beim Fangen, maniakales Lachen, Holz-Klappern |
| S11 | 0:40–0:45 | Quatschende nasse Sneaker, Tropfen, Holzkratzen (geht nahtlos in Folge 1, S01 über) |
