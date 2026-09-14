import pytest

from core import logic


def test_auftrag_anlegen_validiert_agent_und_stufe():
    with pytest.raises(logic.JarvisError):
        logic.auftrag_anlegen("unbekannt", 1, "Titel")
    with pytest.raises(logic.JarvisError):
        logic.auftrag_anlegen("research", 9, "Titel")


def test_auftrag_anlegen_stufe_3_braucht_sofort_freigabe():
    auftrag = logic.auftrag_anlegen("content", 3, "Post veröffentlichen")
    assert auftrag["status"] == logic.STATUS_BRAUCHT_FREIGABE


def test_auftrag_anlegen_ist_idempotent_ueber_schluessel():
    erster = logic.auftrag_anlegen("research", 1, "Recherche", schluessel="abc")
    zweiter = logic.auftrag_anlegen("research", 1, "Recherche (Duplikat)", schluessel="abc")
    assert erster["id"] == zweiter["id"]
    assert zweiter["neu_angelegt"] is False


def test_ergebnis_ablegen_schliesst_auftrag_ab():
    auftrag = logic.auftrag_anlegen("research", 1, "Recherche")
    logic.ergebnis_ablegen(auftrag["id"], "Zwischenstand")
    ergebnis = logic.ergebnis_ablegen(auftrag["id"], "Endstand", fertig=True)
    assert ergebnis["status"] == logic.STATUS_ABGESCHLOSSEN


def test_stufe_3_kann_nicht_ohne_freigabe_abgeschlossen_werden():
    auftrag = logic.auftrag_anlegen("social", 3, "Beitrag veröffentlichen")
    with pytest.raises(logic.JarvisError):
        logic.ergebnis_ablegen(auftrag["id"], "Entwurf steht", fertig=True)


def test_stufe_3_nach_erteilter_freigabe_abschliessbar():
    auftrag = logic.auftrag_anlegen("social", 3, "Beitrag veröffentlichen")
    freigabe = logic.freigabe_anfordern(auftrag["id"], "Heute 18 Uhr veröffentlichen?")
    logic.freigabe_entscheiden(freigabe["id"], erteilt=True, antwort="Ja")
    ergebnis = logic.ergebnis_ablegen(auftrag["id"], "Veröffentlicht", fertig=True)
    assert ergebnis["status"] == logic.STATUS_ABGESCHLOSSEN


def test_abgelehnte_freigabe_bricht_auftrag_ab():
    auftrag = logic.auftrag_anlegen("social", 3, "Beitrag veröffentlichen")
    freigabe = logic.freigabe_anfordern(auftrag["id"], "Heute veröffentlichen?")
    logic.freigabe_entscheiden(freigabe["id"], erteilt=False, antwort="Nein")
    status = logic.auftrag_status(auftrag_id=auftrag["id"])[0]
    assert status["status"] == logic.STATUS_ABGEBROCHEN


def test_gedaechtnis_suchen_ignoriert_abgelaufene_eintraege():
    logic.gedaechtnis_merken("Kunde X mag Blau", verfaellt="2000-01-01")
    logic.gedaechtnis_merken("Kunde X bevorzugt E-Mail")
    treffer = logic.gedaechtnis_suchen("Kunde X")
    inhalte = [t["inhalt"] for t in treffer]
    assert "Kunde X bevorzugt E-Mail" in inhalte
    assert "Kunde X mag Blau" not in inhalte


def test_kosten_buchen_summiert_pro_auftrag():
    auftrag = logic.auftrag_anlegen("trading", 2, "Analyse")
    logic.kosten_buchen(auftrag["id"], 150, "API-Aufruf")
    ergebnis = logic.kosten_buchen(auftrag["id"], 50, "Weiterer Aufruf")
    assert ergebnis["summe_cent"] == 200


def test_notaus_pausiert_offene_auftraege_und_blockiert_neue():
    auftrag = logic.auftrag_anlegen("rpa", 2, "Automatisierung")
    ergebnis = logic.notaus("Sicherheitsvorfall")
    assert auftrag["id"] in ergebnis["pausiert"]

    status = logic.auftrag_status(auftrag_id=auftrag["id"])[0]
    assert status["status"] == logic.STATUS_PAUSIERT

    with pytest.raises(logic.JarvisError):
        logic.auftrag_anlegen("rpa", 2, "Weitere Automatisierung")

    # Stufe 0/1 bleiben während Not-Aus erlaubt (nur lesen/vorschlagen).
    logic.auftrag_anlegen("rpa", 0, "Nur lesen")


def test_notaus_aufheben_laesst_pausierte_weiterlaufen_aber_nicht_abgebrochene():
    abgebrochen_auftrag = logic.auftrag_anlegen("social", 3, "Beitrag")
    freigabe = logic.freigabe_anfordern(abgebrochen_auftrag["id"], "Frage?")
    logic.freigabe_entscheiden(freigabe["id"], erteilt=False)

    pausiert = logic.auftrag_anlegen("rpa", 2, "Automatisierung")
    logic.notaus("Sicherheitsvorfall")

    logic.notaus("Sicherheitsvorfall", aufheben=True)

    status_pausiert = logic.auftrag_status(auftrag_id=pausiert["id"])[0]
    assert status_pausiert["status"] == logic.STATUS_OFFEN

    status_abgebrochen = logic.auftrag_status(auftrag_id=abgebrochen_auftrag["id"])[0]
    assert status_abgebrochen["status"] == logic.STATUS_ABGEBROCHEN
