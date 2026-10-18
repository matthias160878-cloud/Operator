# Sound – Tralaleros Rache, Folge 8: Die Torte

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Schritte, Rascheln) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in allen Folgen (Serien-Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Schleich-/Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für diese Folge: eine schiefe, kindliche „Geburtstags-Fanfare“ auf Spielzeug-Glockenspiel und Kazoo-artigem Synth (eigene Melodie, **kein** bekanntes Geburtstagslied zitieren).
- **Stimmung je Akt:**
  - **Akt 1 (0–20 s, Die Überraschung):** S01 Pizzicato-Lauermotiv, Plopp-Akzent auf den Augen; S02 Holzblock-Schritte, Stopp + Grillen; S03 Glitzer + erste Töne der Geburtstags-Fanfare; S04 feierlich-höfliches Menuett-Zitat (2 Takte); S05 Fanfare voll, Tröte auf den Hut.
  - **Akt 2 (20–29 s, Das Pusten):** Musik hält auf einem langen, steigenden Fagott-Ton (Einatmen), dann **Stille** – S07 nur Orkan-Puste und WUMMS, kurze Zeitlupen-„Hall“-Fläche am höchsten Punkt.
  - **Akt 3 (29–45 s, Die Rutschbahn):** S08 Slide-Whistle abwärts + schnelles Xylophon-Glissando; Stille auf dem PLATSCH (S09), ein Vogel-Piep; S10 Tung-Tung-Lach-Motiv mit der Fanfare in schräger Dur-Variante; ab S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a sneaky pizzicato strings lurking theme and a cartoon pop accent, then wooden block footsteps that stop abruptly. A silly off-key original birthday fanfare on toy glockenspiel and kazoo-like synth grows, with a short polite minuet moment and a party horn hit. Then a long rising low bassoon note, sudden silence, a huge wind gust hit. Final section: a falling slide whistle with fast xylophone glissando, silence for a splash, a crooked happy variation of the fanfare, then a return to the sneaky pizzicato theme so the end connects to the beginning. No vocals, no lyrics, no well-known melodies.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in allen Folgen** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Mit Füllung.“ (S01) nach kurzer Pause, ganz beiläufig – der Gag lebt vom Understatement.
- Bei „Er sieht … eine Überraschung. Für sich.“ echte Pause (~0,6 s) nach „sieht“ – Callback auf Folge 3/4.
- „Alles Gute zum Geburtstag, Tung Tung.“ (S10) feierlich-trocken, *über* das Lachen gelegt, Lachen nicht wegducken, nur leicht.
- S07 und S09 bleiben ohne Erzähler: Pusten und PLATSCH haben die Bühne.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Kerzen-Knistern, Cartoon-Plopp (Augen weg), Sahne-Schmatz |
| S02 | 0:04–0:08 | Holzschritte „tung … tung“, abrupter Stopp, Grillenzirpen |
| S03 | 0:08–0:12 | Holz-Hüpfer „bonk bonk“, Glitzer-„Pling“, freudiges Knarzen |
| S04 | 0:12–0:16 | Holz-Klack des Schlägers am Baum, zweimal Zurechtrücken, Tätschel-„Tock“ |
| S05 | 0:16–0:20 | Blatt-Rascheln, Falt-Swishes, kleine Party-Tröte |
| S06 | 0:20–0:24 | Langes, steigendes Einatmen-Whoosh, Holz-Ächzen wie ein Ballon, Blätter werden angesaugt |
| S07 | 0:24–0:29 | Orkan-Puste, Kerzen „pff“, Sahne-Kanonen-WUMMS, Überraschungsschrei (SFX), Erdbeeren-„Fwip“ |
| S08 | 0:29–0:33 | Weicher Sahne-Platsch bei der Landung, langes Rutsch-Quietschen, Fallpfeife |
| S09 | 0:33–0:36 | Riesen-PLATSCH, Matsch-Regen, Cartoon-Boing, Vogel-Piep |
| S10 | 0:36–0:40 | Genüssliches Schlecken, maniakales Lachen (SFX), Holz-Klappern, Partyhut-Rascheln |
| S11 | 0:40–0:45 | Quatschende Sneaker, Tropfen, Erdbeer-Plopp, dann schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
