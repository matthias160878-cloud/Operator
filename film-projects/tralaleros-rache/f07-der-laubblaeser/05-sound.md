# Sound – Tralaleros Rache, Folge 7: Der Laubbläser

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Motor, Wind, Laub) kann als Basis bleiben, auf ca. -12 dB. **Achtung:** Der Motorlärm ist in dieser Folge Dauergast – unter dem Erzähler konsequent ducken.

## Musik-Brief

- **Tempo:** 150 BPM wie in Folge 1–6 (Serien-Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Slide-Whistle; für den Flug: kitschig-majestätisches Orchester mit Hörnern, Streicher-Tremolo und Harfe; Snaredrum-Wirbel für die Landung.
- **Stimmung je Akt:**
  - **Akt 1 (0–12 s, Der Orkan):** S01 harter Hit auf das Startseil, dann ein treibendes „Maschinen“-Ostinato (tiefe Streicher, Staccato), das auf den Motorrhythmus spielt; S02 Spannung, Snap-Hit beim Zoom; S03 Crescendo auf Vollgas, kurzer „Es klappt!“-Triumph-Akkord beim Abheben.
  - **Akt 2 (12–25 s, Der Adler):** S04 übertriebenes, majestätisches Flug-Thema (Hörner, Harfen-Glissandi, Streicher) – völlig unpassend feierlich; S05 Snare-Wirbel + Becken-Schlag auf die Landung, „Ding“ der Punktetafel; S06 hüpfendes Holzblock-Motiv zum Klatschen, Musik stoppt auf dem erhobenen Finger.
  - **Akt 3 (25–45 s, Der Bumerang):** S07 Stille bis auf den Leerlauf, ein tiefer Fagott-Ton beim Umdrehen der Düse; S08 Slide-Whistle und flatternde Flöten-Triller beim Blatt-Flug; S09 Stille auf dem PLATSCH, ein Vogel-Piep; S10 Tung-Tung-Lach-Motiv, chaotisch; ab S11 Rückkehr zum Pizzicato-Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop. Opens with a hard hit and a driving mechanical staccato ostinato on low strings, building to a short triumphant chord. Middle: an absurdly majestic, over-the-top soaring flight theme with french horns, harp glissandi and lush strings, then a snare drum roll and cymbal crash for a perfect landing, then bouncy wood block clapping rhythm that stops abruptly. Final section: near silence with one low bassoon note, a falling slide whistle with fluttering flute trills, silence, a chaotic playful wood block laughing motif, then a return to a sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–6** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Und tatsächlich: Es funktioniert.“ mit hörbarer, leiser Verwunderung – das ist für die Serie eine Sensation.
- „Doch leichtes Holz fliegt gut. … Sehr gut.“ – Pause (~0,5 s) vor „Sehr gut.“
- „Er möchte … nochmal.“ – echte Pause (~0,6 s) nach „möchte“ (Callback auf die „Er sieht …“-Pausen aus Folge 3/4).
- S09 und S10 bleiben ohne Erzähler: PLATSCH und Tung Tungs Lachen haben die Bühne.
- Musik und Motorton unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Startseil-„Ratsch“, Motor knattert los (Zweitakt-Rattern), Blätter-Explosion, Whoosh |
| S02 | 0:04–0:08 | Motor im Leerlauf, hohle Holzschritte „tung … tung“, Snap-Zoom-Whoosh |
| S03 | 0:08–0:12 | Vollgas-Kreischen, Orkan-Wind, Laub-Prasseln, Holz-Knarzen beim Abheben |
| S04 | 0:12–0:17 | Sanfter Höhenwind, Blätter-Rauschen, ein Adlerschrei (Gag), Motor nur noch fern |
| S05 | 0:17–0:21 | Swoosh der Kurve, weicher Holz-„Tock“ bei der Landung, „Ding“ (Punktetafel) |
| S06 | 0:21–0:25 | Schnelles hohles Holz-Klatschen, Hüpfer-Tock, Grillenzirpen, Blinzel-„Plink“ |
| S07 | 0:25–0:29 | Gurt-Klicken, Leerlauf-Knattern, Quietschen der drehenden Düse, Schlucken (SFX) |
| S08 | 0:29–0:33 | Vollgas, Wind-Heulen, flatterndes Papier-/Blatt-Geräusch, Fallpfeife, Schrei (SFX) |
| S09 | 0:33–0:36 | Riesen-PLATSCH, Matsch-Regen, Brillen-„Plopp“, Blubbern, Ausspucken |
| S10 | 0:36–0:40 | Maniakales Lachen (SFX), Motor-Knattern, Laub-Tornado, Holz-Klappern |
| S11 | 0:40–0:45 | Quatschende Sneaker, Blatt-Zupfen, fernes Laubbläser-Knattern, dann schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
