# Sound – Tralaleros Rache, Folge 3: Der Riesenhammer

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Schritte, Holzknarzen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in Folge 1 (Serien-Wiedererkennung); Akt 1 schwerfällig „halbes Tempo“-Gefühl, Akt 2/3 wieder voll.
- **Instrumente:** Tuba und Fagott (schwerer Cartoon-Bass für den Hammer), Pizzicato-Streicher, Holzblöcke/Bongos (Tung-Tung-Motiv aus Folge 1), Xylophon; für die Rührung: Celesta und ein kitschiges Streicher-Swell; Slide-Whistle.
- **Stimmung je Akt:**
  - **Akt 1 (0–17 s, Die Waffe):** heroischer Fanfaren-Ansatz, der unter dem Gewicht „einknickt“ – Tuba schleppt, Tempo stolpert bei jedem Wackeln; bei S04 absteigende Slide-Whistle, dann Stille + Vogel-Piep.
  - **Akt 2 (17–28 s, Die Begegnung):** Holzblock-Schritte (S05), Stopp + Grillen; S06 plötzlich übertrieben kitschige Celesta + Streicher-Swell (Familienwiedersehen-Pathos); S07 Tempo explodiert beim Losrennen.
  - **Akt 3 (28–45 s, Die Adoption):** fröhlicher, wirbelnder Walzer im 3/4-Feeling beim Herumdrehen (S08), abrupter Stopp auf Tralaleros Augenrollen (S09), dann leise Spieluhr-Version des Walzers zum Wegtragen (S10). Ab S11 Rückkehr zum schleichenden „Plan“-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv aus Folge 1, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a heroic brass fanfare that keeps stumbling under heavy tuba and bassoon, wooden block percussion, slide whistle falling down. Middle: sudden over-the-top sentimental celesta and string swell like a family reunion, then a fast run. Final section: joyful spinning waltz with pizzicato strings and xylophone, abrupt stop, a soft music box version of the waltz, then returning to a sneaky pizzicato villain plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (eine Zeile pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1** verwenden (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- Bei „Und er sieht … Familie.“ eine echte Pause (~0,6 s) vor „Familie“.
- S08 und S10 sind die längsten Sätze (je 10 Wörter in 5 s) – ggf. Tempo 1,05×.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Schweres Holz-Knarzen, Sneaker quatschen im Matsch, angestrengtes Ächzen, Whoosh beim Wackeln |
| S02 | 0:04–0:08 | Snap-Zoom-Whoosh, Knarzen, Schnaufen, Schweißtropfen-„Plink“ |
| S03 | 0:08–0:13 | Schleifendes Holz durch Matsch, Keuchen, quatschende Schritte |
| S04 | 0:13–0:17 | Langes Kipp-Knarzen, weicher Cartoon-Plumps ins Moos, einzelner Vogel-Piep |
| S05 | 0:17–0:21 | Hohle Holzschritte „tung … tung“, abrupter Stopp, Grillenzirpen |
| S06 | 0:21–0:25 | Leises Holzknarzen, Glitzer-„Pling“ der Harzträne, Herzschlag |
| S07 | 0:25–0:28 | Schläger fällt: lautes „TOCK“ + Nachhüpfen, schnelle Holz-Rennschritte, Whoosh |
| S08 | 0:28–0:33 | Dreh-Whooshes, glückliches Holz-Klappern, Blätterwirbel |
| S09 | 0:33–0:36 | Holz-Quietschen beim Drücken, langer Seufzer |
| S10 | 0:36–0:41 | Leiser werdende Holzschritte, gesummtes Schlaflied, Blatt fällt, Stille |
| S11 | 0:41–0:45 | Schlurfen, Seufzer, dann schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
