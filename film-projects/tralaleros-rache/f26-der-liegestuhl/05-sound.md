# Sound – Tralaleros Rache, Folge 26: Der Liegestuhl

Die Kling-Clips werden mit „no music, no dialogue“ erzeugt – Musik, Erzähler und die wichtigsten SFX kommen im Schnitt dazu. Kling-Eigenton (Klack, Platsch, Lachen) kann als Basis bleiben, auf ca. -12 dB.

## Musik-Brief

- **Tempo:** 150 BPM wie in der ganzen Serie (Wiedererkennung).
- **Instrumente:** Pizzicato-Streicher (Plan-Motiv aus Folge 1), Holzblöcke (Tung-Tung-Motiv), Fagott, Xylophon, Slide-Whistle; neu für die Sommer-Staffel: **Ukulele**, **Steel Drums** und **Surf-Gitarre mit Twang** als Sommerfarbe, eine träge **Hawaii-Slide-Gitarre** fürs Einschlafen. Blockflöte/Vogeltriller und Harfe der Frühlings-Staffel fallen weg.
- **Stimmung je Akt:**
  - **Akt 1 (0–8 s, Die Falle):** S01 Surf-Gitarren-Twang exakt auf das KLACK, dann Ukulele-Strumming mit Pizzicato-Plan-Motiv. S02 schleichendes Pizzicato, Steel-Drum-Tupfer auf das Feder-Quietschen.
  - **Akt 2 (8–23 s, Der Gast):** S03 träge, hitzige Ukulele (langsam „geschmolzen“, leicht verstimmt), Holzblöcke im Schritt-Takt. S04 entspannte Steel Drums. **Musik-Stopp auf jeden Fehlzug** in S05 (Grille in der Stille). S06 schläfrige Hawaii-Slide-Gitarre abwärts.
  - **Akt 3 (23–45 s, Der Test):** S07 vorsichtiges Pizzicato auf Zehenspitzen. S08 kurzes Tremolo – **harter Stopp exakt auf das KLACK**. S09 Slide-Whistle aufwärts beim BOING, Stille im Flug, PLATSCH ohne Musik, dann gemütliche Steel Drums „im Schlauchboot“. S10 Holzblöcke im Lach-Rhythmus. S11 Rückkehr zum Plan-Motiv aus Folge 1, damit der Loop nahtlos ist.
- **Loop-Regel:** Track endet genau bei 0:45 im Plan-Motiv, kein Fade-out.

**Prompt für einen Musikgenerator (instrumental):**
```
Instrumental cartoon comedy score, 150 BPM, 45 seconds, seamless loop, hot lazy summer mood. Opens with a twangy surf guitar hit, then bright ukulele strumming over a sneaky pizzicato strings theme and steel drum accents. A slow, heat-drunk ukulele with wood blocks, relaxed steel drums, two sudden stops with silence, then a sleepy descending Hawaiian slide guitar. Careful tiptoeing pizzicato, a short string tremolo and a hard stop. A rising slide whistle, silence, then cozy floating steel drums, rhythmic wood blocks like laughter, and a return to the sneaky pizzicato plan theme so the end connects to the beginning. No vocals, no lyrics.
```

## Erzähler (TTS)

- Text: `04-voiceover.txt` (ein Absatz pro Einsatz, in Shot-Reihenfolge). **Dieselbe Stimme und dieselben Einstellungen wie in Folge 1–25** (ElevenLabs: Stability ~70 %, Style niedrig) – trocken, nicht lustig *gespielt*.
- „Der Wald. Sommer.“ (S01) ab ~1 s, nach dem Libellen-Surren, vor dem KLACK fertig oder direkt danach.
- „Jetzt. Jetzt! Nichts.“ (S05) exakt auf die beiden Fehlzüge, „Nichts.“ in die Grillen-Stille.
- „Eine kurze Sicherheitsprüfung.“ (S08) vor dem KLACK fertig.
- „Die Feder funktioniert.“ (S09) nach dem PLATSCH, zufrieden-sachlich.
- „Die Natur ist grausam.“ (S10) gleich am Anfang, dann hat das Lachen die Bühne.
- „Staffel sechs.“ (S11) mit kleiner Pause danach, dann der Serien-Schlusssatz.
- Musik unter dem Erzähler auf ca. -18 dB ducken.

## Sound-Design-Liste

| Shot | Zeit | Sound-Effekte |
|---|---|---|
| S01 | 0:00–0:04 | Libellen-Surren (1. Sekunde), Hitze-Sirren, lautes Holz-KLACK, Thunk beim Rammen, Schirm-Whump |
| S02 | 0:04–0:08 | Feder-Quietschen, Seil-Knarzen, Schleichschritte, Whip-Whoosh, unterdrücktes Kichern |
| S03 | 0:08–0:12 | Hohle Holzschritte „tung tung“, Grillen/Insektensirren, müdes Holz-Ächzen, Glitzer-Ping |
| S04 | 0:12–0:16 | Holz-Klock (Schläger an Schirmstange), Stoff-Plumps, Knarzen, langes wohliges Seufzen (SFX) |
| S05 | 0:16–0:20 | Zwei Seil-Rucke, dumpfes Feder-Klonk (klemmt), Grillenzirpen in der Stille |
| S06 | 0:20–0:23 | Leises Holz-Schnarchen, Libellen-Surren |
| S07 | 0:23–0:28 | Ungeduldiges Stapfen, sanftes Holz-Knarzen, Grasrascheln, Schnarchen läuft weiter |
| S08 | 0:28–0:32 | Metall-Ping (Stupser), Stoff-Knarzen, riesiges KLACK, gedämpftes Zappeln |
| S09 | 0:32–0:37 | Riesen-BOING, Pfeif-Whoosh, Riesen-PLATSCH, Matsch-Regen, Plätschern, Libellen-Surren |
| S10 | 0:37–0:40 | Aufschreck-Holzklappern, maniakales Lachen (SFX), Plätschern im Hintergrund |
| S11 | 0:40–0:45 | Matsch-Tropfen, quatschende Sneaker, Brillen-Rutschen „fwip“, schnelles Holzkratzen (geht nahtlos in Folge 1, S01 über) |
