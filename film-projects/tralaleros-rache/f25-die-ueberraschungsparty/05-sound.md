# Sound – Tralaleros Rache, Folge 25: Die Überraschungsparty

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Rascheln, PLATSCH, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung); in der Zeitlupe (S08) halbes Tempo, danach zurück.
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; Frühlings-Farben der Staffel 5: Flöte/Piccolo und Glockenspiel. Neu für das Finale: ein warmes „Party“-Motiv (Akkordeon + Ukulele + Glockenspiel im Walzer-Swing) und ein gefühlvolles Streicher-/Harfen-Thema für die Rührung – beides bewusst kitschig (Ironie).
- **Stimmung je Akt:**
  - **Akt 1 (0–13 s, Der Verdacht):** S01 Spionage-Pizzicato mit tiefem Kontrabass ab Frame 1 (Agentenfilm-Gefühl). S02 kurzer Fagott-„Verdacht“-Ton, dann Plan-Motiv. S03 Zehenspitzen-Pizzicato – **abrupter Stopp** mit Platten-Kratzer, wenn er erstarrt.
  - **Akt 2 (13–30 s, Die Party):** S04 Glockenspiel-Glitzern, Party-Motiv setzt leise ein. S05 Spieluhr-Version des Plan-Motivs (Erinnerung an alle Folgen). S06 Party-Motiv voll mit Tusch auf das „Überraschung!“. S07 Streicher + Harfe, schwelgend.
  - **Akt 3 (30–40 s, Die Banane):** S08 Streicher dehnen sich in Zeitlupe (Tape-Stop-Effekt), Chor-„Aaah“-Pad (ohne Worte). S09 harter Stopp auf den PLATSCH, ein einzelner Tuba-Ton. S10 Holzblöcke im Lach-Rhythmus.
  - **Loop (40–45 s):** Eine Sekunde Party-Motiv auf dem Lächeln, dann Rückkehr zum Plan-Motiv aus Folge 1 mit Piccolo – nahtlos in Folge 1, S01.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental spring cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Starts immediately with a sneaky spy-style pizzicato and double bass, a suspicious bassoon note, tiptoe pizzicato ending in an abrupt record scratch stop. Then a sparkling glockenspiel reveal, a music-box version of the sneaky theme, a cheerful party theme with accordion, ukulele and glockenspiel with a short brass fanfare, and swelling sentimental strings and harp. A tape-stop slow-motion stretch with a wordless choir pad, a hard stop, one low tuba note, rhythmic wood blocks like laughter, one second of the party theme, then a return to the sneaky pizzicato plan theme with piccolo so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–24** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Frühling.“ (S01) ab ~0,5 s, leise wie ein Tierfilmer im Versteck.
- „… eine Falle.“ (S02) wissend, verschwörerisch.
- „Moment. Das ist keine Falle.“ (S04) nach einer kurzen Pause, ehrlich überrascht.
- „Folge fünfundzwanzig. Ein Jubiläum. …“ (S06) feierlich-trocken, mit hörbarem Augenzwinkern.
- „Auch die Banane.“ (S07) und „Die Banane vergisst nicht.“ (S08) wie eine düstere Prophezeiung.
- „Die Natur ist grausam.“ (S09) erst **nach** dem PLATSCH.
- „Staffel fünf endet. Im Matsch.“ (S10) über dem Lachen, Lachen dafür kurz ducken.
- „Für den Sommer.“ (S11) als letzte Worte der Staffel, leicht verheißungsvoll.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Blätterrascheln im Vordergrund, hastiges Stoff-Flattern, Holz-Knarzen, Vogelzwitschern |
| S02 | 0:04–0:08 | Augen-Verengen-„Ziiing“, Blätterrascheln, ein großes Cartoon-GLUPP, kleiner Triumph-Ping |
| S03 | 0:08–0:13 | Cartoon-Schleichschritte (Zehenspitzen), Zweig-Swisch, abrupte Stille, Platten-Kratzer |
| S04 | 0:13–0:18 | Sanfter Windhauch, flatternde Wimpel, leises Glitzer-Schimmern, Ballon-Quietschen |
| S05 | 0:18–0:22 | Slider-Whoosh, drei kleine Erinnerungs-„Pings“ (Magnet, Bumerang, Figur), Spieluhr-Glitzern |
| S06 | 0:22–0:26 | Party-Popper-PLOPP, Blütenblätter-Whoosh, fröhliches Holz-Klacken, Ballon-Quietschen |
| S07 | 0:26–0:30 | Schniefen, leises Bananen-„Flapp“ ins Gras (deutlich hörbar!), sanfte Schritte |
| S08 | 0:30–0:34 | Langgezogenes Zeitlupen-Rutsch-Quietschen, gedehnter Zeitlupen-Schrei (SFX, ohne Worte), Fallpfeifen |
| S09 | 0:34–0:37 | Riesen-PLATSCH, Matsch-Regen, Blubbern, Cartoon-Boing |
| S10 | 0:37–0:40 | Kurzer Schreck-„Tock“, maniakales Lachen (SFX), Holz-Klappern, Blatt-Frisbee-Whoosh |
| S11 | 0:40–0:45 | Matsch-Quietschen, kurzes Rührungs-Seufzen, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
