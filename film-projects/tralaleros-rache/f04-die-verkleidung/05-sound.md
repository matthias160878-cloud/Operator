# Sound – Tralaleros Rache, Folge 4: Die Verkleidung

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Schritte, Holzknarzen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in Folge 1–3 (Serien-Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Schleich-/Plan-Motiv aus Folge 1), Holzblöcke und Kastagnetten (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; für den Tanz: kurzer, absurd feierlicher Polka-/Tango-Groove mit Akkordeon-artigem Synth.
- **Stimmung je Akt:**
  - **Akt 1 (0–8 s, Die Tarnung):** S01 Schlag + Stille-Hit beim „KLONK“, dann Agenten-Schleichmotiv (Pizzicato, gedämpfte Trompete angedeutet), steife Staccato-Schritte im Takt von Tralaleros Trippeln.
  - **Akt 2 (8–24 s, Der Zwilling):** Holzblock-Schritte (S03), Stopp + Grillen; S04 kitschiges Celesta-Glitzern (Wiedersehen-Pathos, Callback Folge 3); S05 zögerliche Einzeltöne, die jede Bewegung „spiegeln“; S06 voller Tanz-Groove, Kastagnetten exakt auf den gespiegelten Moves.
  - **Akt 3 (24–45 s, Das Fass):** Musik bricht in S07 ab, nur Tropfen + Knarzen (Spannung); S08 tiefer Fagott-Ton steigt mit dem Aufblähen; S09 Tung-Tung-Lach-Motiv; S10 Slide-Whistle abwärts beim Rollen, Stille auf dem PLATSCH, ein Vogel-Piep; ab S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a heavy wooden thunk hit, then a sneaky spy theme with pizzicato strings and stiff staccato steps. Middle: wooden block footsteps stop, a short sparkly celesta reunion moment, then hesitant mirrored single notes that grow into a silly festive polka-tango dance groove with castanets and wood blocks. Final section: music stops, tension with low bassoon rising, a falling slide whistle, silence, then a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–3** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „undercover“ deutsch-trocken aussprechen, nicht englisch-cool.
- Bei „Er sieht … seinen lange verschollenen Zwillingsbruder.“ eine echte Pause (~0,6 s) nach „sieht“ – Callback auf „Er sieht … Familie.“ aus Folge 3.
- S08 ist mit 8 Wörtern in 4 s der dichteste Satz – ggf. Tempo 1,05×.
- S09 bleibt ohne Erzähler: Tung Tungs Lachen hat die Bühne.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Holz-Ruck „KLONK“, Knarzen, Cartoon-Plopp der Flosse, Sägemehl-Rieseln |
| S02 | 0:04–0:08 | Hohles Holz-Klacken bei jedem Trippelschritt, Sneaker-Quietschen, Knarzen beim Umdrehen |
| S03 | 0:08–0:11 | Holzschritte „tung … tung“, abrupter Stopp, Grillenzirpen |
| S04 | 0:11–0:15 | Herzschlag, Glitzer-„Pling“, leises Holzknarzen |
| S05 | 0:15–0:19 | Holzknarzen, nervöses Schlucken (SFX), Sneaker-Quietschen beim Wackeln |
| S06 | 0:19–0:24 | Rhythmisches Holz-Klacken wie Kastagnetten, Sneaker-Quietschen, Wassertropfen-Spritzer |
| S07 | 0:24–0:28 | Tropfen, langes Dehnen und Knarzen des Holzes, feines Knistern |
| S08 | 0:28–0:32 | Aufbläh-Sound (Ballon), Holz-Ächzen, hektisches Sneaker-Zappeln |
| S09 | 0:32–0:36 | Maniakales Lachen (SFX), Holz-Klappern, sanftes „Tipp“, erstes Kippen |
| S10 | 0:36–0:41 | Holpriges Holz-Rollen, Fallpfeife, Riesen-PLATSCH, weiches Auseinanderfallen, Blubbern, Vogel-Piep |
| S11 | 0:41–0:45 | Quatschende Sneaker, Matsch-Tropfen, Holzstück fliegt weg, dann schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
