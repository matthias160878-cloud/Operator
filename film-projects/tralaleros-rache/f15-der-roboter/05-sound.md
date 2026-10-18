# Sound – Tralaleros Rache, Folge 15: Der Roboter (Staffelfinale 3)

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Stampfen, Knarzen, Pops, Platsch, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu fürs Staffelfinale: **tiefe, übertrieben bombastische Monsterfilm-Blechbläser + Pauke** im Schritt-Takt des Roboters und ein **Walzer-/Showtanz-Thema** (Xylophon + Pizzicato + Holzblöcke) für den Zwillingstanz, das das Tanzmotiv aus Folge 4 zitiert.
- **Stimmung je Akt:**
  - **Akt 1 (0–16 s, Der Koloss):** S01 Pauke + tiefe Blechbläser exakt auf die BUMM-Schritte (Musik darf hier die Schritte verstärken, nicht übertönen). S02 Blechbläser-Fanfare des Größenwahns. S03 alles kippt in eine zarte Celesta-Glitzerfigur (Tung Tungs Begeisterung). S04 Fanfare bricht ab, Fagott-Stolpern auf den falschen Hebel.
  - **Akt 2 (16–32 s, Der Tanz):** S05 Showtanz-Thema, Holzblöcke im Takt der Schritte. S06 auf dem Tanzfinale ein großer Tusch – **harter Stopp exakt auf das KLONG**. S07 nur Bumerang-Surren, darunter ein leises, kreisendes Xylophon-Ostinato. S08 keine Musik – SCHNIPP und pop-pop-pop sind die Pointe.
  - **Akt 3 (32–45 s, Der Absturz):** S09 ein einzelner, absteigender Fagott-Ton mit dem Kippen, Fallpfeife, PLATSCH ohne Musik. S10 Holzblöcke im Lach- und Klatsch-Rhythmus. S11 Rückkehr zum Plan-Motiv aus Folge 1, diesmal mit einem kleinen, augenzwinkernden Blechbläser-Schlussakkord als Staffel-Ende – aber ohne Fade, damit der Loop zu Folge 1, S01 sitzt.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens instantly with huge over-the-top monster-movie brass and timpani hits on every heavy footstep, then a pompous brass fanfare. A sudden delicate sparkling celesta figure, then a clumsy bassoon stumble. A bouncy showtime dance theme with xylophone, pizzicato strings and wood blocks, ending in a big orchestral flourish that stops dead. A soft circling xylophone ostinato, a few seconds of silence, a single descending bassoon note and a slide whistle fall. Rhythmic wood blocks like laughter and clapping, then a return to the sneaky pizzicato plan theme with a tiny cheeky brass chord, so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–14** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Staffelfinale.“ (S01) nach dem zweiten BUMM setzen (~1,2 s), feierlich wie in Folge 10.
- „Das Ziel: Tung Tung Sahur. Begeistert.“ (S03) – „Begeistert.“ nach kurzer Pause, wenn er zu winken beginnt.
- „Erinnern Sie sich an den Zwillingstanz? Der Roboter erinnert sich.“ (S05) über dem Tanz, ruhig bleiben.
- „Der Magnet findet den Helm. Alte Liebe.“ (S06) **direkt nach** dem KLONG.
- S08 ohne Erzähler: SCHNIPP und pop-pop-pop haben die Bühne.
- „Die Natur ist grausam.“ (S09) während des Kippens – vor dem PLATSCH fertig.
- „Für Staffel vier.“ (S11) mit kleiner Pause davor, minimal wärmer – das Augenzwinkern zum Staffelende.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | BUMM-BUMM-Stampfen (1. Frame), Bodenbeben, Holz-Knarzen, Vogelschwarm flattert auf, Rinde rieselt |
| S02 | 0:04–0:08 | Holzhebel-Klonk-Klonk, Korb-Knarzen, gedämpftes Stampfen |
| S03 | 0:08–0:12 | Roboter-Knarzen von oben, fröhliches Holz-Knarzen (Tung Tung), Glitzer-Ping |
| S04 | 0:12–0:16 | Hebel-Klonk, quietschendes Gelenk beim Winken (2×), Cartoon-Boing „falscher Hebel“ |
| S05 | 0:16–0:21 | Holz-Klack im Tanzrhythmus, Gelenk-Quietschen, Bodenwummern beim Hüpfer, panisches Hebelklappern |
| S06 | 0:21–0:25 | Seil-Twang, Metall-KLONG (Magnet an Helm), Scheppern auf dem Weg |
| S07 | 0:25–0:28 | Seil-Schnapp, kreisendes Bumerang-Surren mit Doppler, Vorbeiflug-Whoosh |
| S08 | 0:28–0:32 | Holz-Plumps, SCHNIPP-Twang der Seilfeder, POP-POP-POP, Lineal-Boing |
| S09 | 0:32–0:36 | Langes Holz-Ächzen, Fallpfeife, Riesen-PLATSCH, Matsch-Regen |
| S10 | 0:36–0:40 | Holz-Klatschen, maniakales Lachen (SFX), Bumerang-Rückkehr-Whoosh, sanftes Holz-Klock |
| S11 | 0:40–0:45 | Tropfen, quatschende Sneaker, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
