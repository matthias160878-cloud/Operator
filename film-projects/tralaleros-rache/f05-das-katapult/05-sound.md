# Sound – Tralaleros Rache, Folge 5: Das Katapult (Staffelfinale)

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Holzknarzen, Blätter) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in allen Folgen (Serien-Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher und Holzblöcke/Bongos (Tung-Tung-Motiv aus Folge 1), Snare-Wirbel und Mini-Fanfare (Blechbläser) für den Abschuss, Slide-Whistle, Xylophon; für die Versöhnung: Celesta, Akustikgitarre, kitschiges Streicher-Swell.
- **Stimmung je Akt:**
  - **Akt 1 (0–16 s, Der Abschuss):** pompöser „Kriegsmaschinen“-Marsch mit Snare-Wirbel, steigert sich beim Zielen (S02–S03), Trommelwirbel auf dem Hebel – dann bricht alles ab, aufsteigende Slide-Whistle in den Himmel (S04).
  - **Akt 2 (16–28 s, Die Rettung):** schiefes, hängendes Pizzicato kopfüber (S05), rhythmische Holzblöcke im Takt des Baumschüttelns (S06), Stopp beim Fallen, weicher Celesta-Akkord beim Auffangen (S07).
  - **Akt 3 (28–45 s, Der Frieden – kurz):** übertrieben gefühlvolles Finale-Thema (Gitarre + Streicher-Swell) beim Bananen-Teilen (S08–S09), abrupter Plattenkratzer beim Ausrutschen (S10), dann Rückkehr zum schleichenden „Plan“-Motiv aus Folge 1 (S11), damit die Staffel nahtlos loopt.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv aus Folge 1, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a pompous military march with snare rolls and a small brass fanfare building tension, a drum roll that suddenly breaks into a rising slide whistle. Middle: wobbly upside-down pizzicato, rhythmic wooden block percussion, a sudden stop, then a soft celesta chord. Final section: an over-the-top heartfelt finale theme with acoustic guitar and sweeping strings, interrupted by a record scratch, then returning to a sneaky pizzicato villain plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (eine Zeile pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–4** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Die Flugbahn war … unkonventionell.“ mit echter Pause (~0,5 s) vor dem letzten Wort.
- „Staffelfinale.“ (S01) leicht gewichtig; „Für Staffel zwei.“ (S11) trocken nachgeschoben, ganz am Ende des Clips.
- S07 und S11 sind die längsten Sätze (9 bzw. 12 Wörter) – ggf. Tempo 1,05×.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Holzrumpeln, quietschende Räder, Stopp-Ruck, Knarzen des schwankenden Katapults |
| S02 | 0:04–0:08 | Snap-Zoom-Whoosh, Wind-Pfeifen, kleines „Ping“ beim Zielen |
| S03 | 0:08–0:12 | Grillenzirpen, Wind, einzelnes hohles „tung“ |
| S04 | 0:12–0:16 | Hebel-Klack, Seil-Twang, Holz-„FWOMP“, aufsteigendes Pfeifen, Schrei (SFX) |
| S05 | 0:16–0:20 | Blätterrascheln, Ast-Knarzen, Sneaker-Zappeln, beleidigtes Schnaufen |
| S06 | 0:20–0:24 | Rhythmisches Baumschütteln „tung tung“, Blätterregen, Stamm-Knarzen |
| S07 | 0:24–0:28 | Fallpfeifen, weiches Holz-„Plopp“ beim Fangen, rieselnde Blätter, Stille |
| S08 | 0:28–0:33 | Bananen-Knacken, zufriedenes Mampfen, Vogelgezwitscher |
| S09 | 0:33–0:36 | Whoosh der fliegenden Schale, nasses „Flatsch“, zufriedener Seufzer |
| S10 | 0:36–0:40 | Rutsch-Quietschen (**dasselbe SFX wie Folge 1, S08**), Fallpfeifen, Schrei, Platsch aus dem Off |
| S11 | 0:40–0:45 | Tropfen, quatschende Sneaker, Holzkratzen (geht nahtlos in Folge 1, S01 über) |
