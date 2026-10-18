# Sound – Tralaleros Rache, Folge 14: Der Zaubertrick

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Türknall, Rumpeln, Platsch) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle, Staffel-3-Fanfarenstoß; neu für diese Folge: ein Zirkus-/Varieté-Motiv mit Trommelwirbel, Becken und Kirmes-Orgel für die Zaubershow.
- **Stimmung je Akt:**
  - **Akt 1 (0–16 s, Die Show):** S01 Becken-Akzent auf den Rauch-Puff, dann großspuriges Varieté-Motiv; S02/S03 verschmitztes Pizzicato-Plan-Motiv, Stopp auf den Türknall; S04 **Trommelwirbel** beim Zauberstab-Kreisen, Tusch auf den Jubel.
  - **Akt 2 (16–25 s, Der Trick):** S05 **Musik-Stopp exakt auf das Antippen**, nur Plattenkratzer und Grille; S06 leises, fragendes Fagott, ein hohler Holzblock-Ton beim Klopfen in der Kiste.
  - **Akt 3 (25–45 s, Die Schlittenfahrt):** S07 Fall-Akkord beim Umkippen; S08 rasendes Xylophon-Galopp-Motiv mit aufsteigender Slide-Whistle; harter Stopp auf den PLATSCH (S09); S10 Mini-Tusch auf das Konfetti, dann Holzblöcke im Lach-Rhythmus; S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a cymbal crash and a pompous circus variety theme with organ and pizzicato strings, then a sneaky pizzicato and bassoon theme that stops on a hit. A snare drum roll building up to a big brassy ta-da fanfare. A sudden full stop and silence, then a lonely questioning bassoon. A falling chord, then a frantic galloping xylophone with a rising slide whistle and a hard stop. A tiny ta-da sting, rhythmic wood blocks like laughter, then a return to the sneaky pizzicato theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–13** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald.“ (S01) erst **nach** dem Rauch-Puff, kurze Pause vor „Phase eins: Magie.“
- „Simsalabim. Verschwunden.“ (S04) völlig unbeeindruckt sprechen – der Kontrast zum Jubel ist der Witz.
- „Fast.“ (S05) erst nach dem Plattenkratzer, mitten in die Stille.
- „Die Natur ist grausam.“ (S07) und „Und abschüssig.“ (S08) als zwei getrennte Einsätze über den Schnitt hinweg.
- S09 ohne Erzähler: der PLATSCH hat die Bühne.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Magischer Rauch-Puff (weich, kein Knall), Glitzer-Schimmern, Umhang-Swoosh, selbstgefälliges Kichern (SFX) |
| S02 | 0:04–0:08 | Tür-Knarzen, hohles Holz-Klatschen, freches Pfeifen (SFX), Waldatmo |
| S03 | 0:08–0:12 | Hohle Holzschritte „tung tung“, Scharnier-Knarzen, lauter Türknall |
| S04 | 0:12–0:16 | Schwerer Riegel-Klack, Zauber-Schimmern, Trommelwirbel, wortloser Triumph-Jubel (SFX) |
| S05 | 0:16–0:20 | Holz-Tipp-Tipp auf der Schulter, Plattenkratzer, Stille mit einer Grille |
| S06 | 0:20–0:25 | Riegel-Klack, Tür-Knarzen, Klappern des fallenden Zauberstabs, hohles Klopfen in der Kiste |
| S07 | 0:25–0:29 | Gedämpftes Quieken (SFX), Türknall, Wackeln, schwerer Holz-Rums, Anrutschen |
| S08 | 0:29–0:33 | Holz-Schaben und Rumpeln über Wurzeln, Matsch-Spritzer, gedämpftes Jammern (SFX), aufsteigende Slide-Whistle |
| S09 | 0:33–0:36 | Riesen-PLATSCH, Matsch-Regen, Tür-Aufspringen, Cartoon-Boing, Blubbern |
| S10 | 0:36–0:40 | Konfetti-Puff, Papierrascheln, Mini-Tusch, maniakales Lachen (SFX), Holz-Klappern |
| S11 | 0:40–0:45 | Quatschende Sneaker, Matsch-Tropfen vom Zylinder, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
