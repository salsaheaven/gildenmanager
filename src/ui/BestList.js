// ============================================================
// BESTLIST – Bestenliste der Läufe, nur im Browser gespeichert (nicht im Spielstand)
// Jeder Sieg über den Endboss kommt hinein: Gildenname, Tage, Rang, Datum.
// Sortiert nach Tagen (wenigste zuerst). Sie bleibt auch nach "Neu" erhalten, damit man sich schlagen kann.
// Der Speicher kann blockiert sein (privates Fenster): dann gibt es einfach keine Bestenliste.
// ============================================================

import { BEST_LIST_SIZE } from '../data/endEvaluation.js';

const STORAGE_KEY = 'gildenmanager-bestenliste';

// Alle gespeicherten Läufe: [{ guildName, day, rank, rankColor, date }]
export function loadBestList() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

// Trägt einen Lauf ein und gibt die neue Liste zurück (plus den Platz des Laufs, 1 = bester, null = nicht drin)
export function addToBestList(evaluation) {
  const list = loadBestList();
  const entry = {
    guildName: evaluation.guildName,
    day: evaluation.day,
    rank: evaluation.rank,
    rankColor: evaluation.rankColor,
    date: new Date().toLocaleDateString('de-DE'),
  };
  list.push(entry);
  list.sort((a, b) => a.day - b.day);
  const kept = list.slice(0, BEST_LIST_SIZE);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch (error) {
    // nicht schlimm: dann bleibt es bei dieser Anzeige
  }
  const place = kept.indexOf(entry);
  return { list: kept, place: place === -1 ? null : place + 1 };
}
