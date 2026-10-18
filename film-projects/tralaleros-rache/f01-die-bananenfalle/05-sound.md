# Sound – Tralaleros Rache, Folge 1: Die Bananenfalle

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Schritte, Platschen) kann als Basis bleiben, wird aber auf ca. -12 dB gezogen.

## Musik-Brief

- **Tempo:** 150 BPM (schnell, hektisch), im Akt 2 kurzzeitig halbiertes Feeling
- **Instrumente:** Pizzicato-Streicher, Fagott und Tuba (Cartoon-Bass), Xylophon, Bongos/Holzblöcke (passend zu „Tung Tung“), Slide-Whistle, Stabs auf Blechbläsern
- **Stimmung je Akt:**
  - **Akt 1 (0–16 s, Der Plan):** schleichend-verschwörerisch, Pizzicato + Fagott, „Bösewicht-Plan“-Gefühl, mit Augenzwinkern
  - **Akt 2 (16–26 s, Die Falle):** Holzblock-Rhythmus synchron zu Tung Tungs Schritten; bei S06 (Ballettschritt) kurzer, absurd schöner Walzer-/Celesta-Moment, dann abrupte Stille + Grillen
  - **Akt 3 (26–45 s, Der Bumerang):** Vollgas – triumphierender Blech-Stab bei S07, Slide-Whistle aufwärts beim Flug (S08), harter Stopp beim Platscher (S09), dann Tuba-„Wah-wah-wah-waaah“ zum Lachen. Ab S11 Rückkehr zum schleichenden Motiv aus Akt 1, damit der Loop musikalisch nahtlos ist.
- **Loop-Regel:** Track beginnt und endet im selben Motiv/Tempo, letzter Takt endet genau bei 0:45, kein Fade-out.

**Prompt für einen Musikgenerator (z. B. Suno/Udio, instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Sneaky villain plan theme with pizzicato strings, bassoon and tuba, wooden block percussion and bongos, xylophone accents. Middle section: a short absurd elegant waltz moment with celesta, then sudden silence. Final section: chaotic fast slapstick chase, brass stabs, slide whistle, sad trombone "wah wah wah", returning to the sneaky opening theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (eine Zeile pro Einsatz, in Shot-Reihenfolge).
- Stimme: männlich oder weiblich, tief, ruhig, Doku-Tonfall (ElevenLabs: „Stability“ hoch ~70 %, „Style“ niedrig) – trocken, nicht lustig *gespielt*.
- Einsätze an den Shot-Anfang legen (Zeiten siehe `edit/subtitles.srt`); bei S03 und S11 die Sprechgeschwindigkeit ggf. leicht erhöhen (1,05×).
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Schnelles Holzkratzen, splitternde Rinde, Whoosh |
| S02 | 0:04–0:07 | Zwei „Tock“-Tipper, Snap-Zoom-Whoosh, fieses Kichern |
| S03 | 0:07–0:12 | Bananen-Squish, Cartoon-Schleichschritte, Glitzer-„Ping“ auf der Schale |
| S04 | 0:12–0:16 | Blätterrascheln, unterdrücktes Kichern, Cartoon-Herzklopfen |
| S05 | 0:16–0:21 | Hohle Holzschritte „tung … tung … tung“, Boden-Rumpeln, Wasser-Plätschern der Pfütze |
| S06 | 0:21–0:26 | Eleganter Whoosh, Holzschritt, danach Grillenzirpen (peinliche Stille) |
| S07 | 0:26–0:29 | Blätter-Explosion, Jubelschrei, Cartoon-Rennschritte (schnelles Trommeln) |
| S08 | 0:29–0:34 | Rutsch-Quietschen, Slide-Whistle aufwärts, Fallpfeifen, Schrei |
| S09 | 0:34–0:37 | Riesen-Platsch, Matsch-Regen, „Boing“, Schwindel-Zwitschern |
| S10 | 0:37–0:41 | Maniakales Lachen, Holz-Klappern, „Tock“ beim Knieklopfen |
| S11 | 0:41–0:45 | Wassertropfen, quatschende Sneaker, Holzkratzen – endet im selben Sound wie S01 beginnt (Loop) |

**Lautstärke-Ziel:** -14 LUFS integriert (TikTok/Reels/Shorts), True Peak ≤ -1 dBTP. Laut und dicht – aber Erzähler muss immer verständlich bleiben.
