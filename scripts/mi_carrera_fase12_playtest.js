/**
 * FASE 12 playtest harness — 10 careers through engine+UI decisions (Node).
 * Run: node scripts/mi_carrera_fase12_playtest.js
 */
'use strict';

const { loadMiCarreraUI } = require('./_load_mi_carrera_ui');

const { MC } = loadMiCarreraUI();
const Eng = MC.Engine;
const Rules = Eng.Rules;

function band(id) {
  const c = MC.Providers.clubs.getById(id);
  return c ? Rules.bandRank(Rules.clubBand(c)) : 0;
}

function playCareer(cfg) {
  const career = Eng.createCareer(cfg);
  const first = Eng.generateFirstClubs(career)[0];
  Eng.chooseFirstClub(career, first.clubId, first);
  const path = [first.clubId];
  let transfers = 0;
  let loans = 0;
  let stayOnlyMarkets = 0;
  let transferMarkets = 0;
  let loanMarkets = 0;
  let inferiorOffers = 0;
  let similarOffers = 0;
  let superiorOffers = 0;
  let offerMoves = 0;
  let goodMarkets = 0;
  let goodSuperiorish = 0;

  while (career.status !== 'retired' && career.player.age < 40) {
    const turned = Eng.playSeason(career);
    const fromRank = band(career.currentClubId);
    const opts = (turned.market && turned.market.options) || [];
    const moves = opts.filter((o) => o.type === 'transfer' || o.type === 'loan');
    if (!moves.length) stayOnlyMarkets += 1;
    if (moves.some((o) => o.type === 'transfer')) transferMarkets += 1;
    if (moves.some((o) => o.type === 'loan')) loanMarkets += 1;
    const form = Eng.Market.seasonForm(career);
    moves.forEach((o) => {
      offerMoves += 1;
      const r = band(o.clubId);
      if (r > fromRank) superiorOffers += 1;
      else if (r === fromRank) similarOffers += 1;
      else inferiorOffers += 1;
    });
    if (form.good && moves.length) {
      goodMarkets += 1;
      if (Math.max(...moves.map((o) => band(o.clubId))) >= fromRank) goodSuperiorish += 1;
    }

    // Decision policy by intent
    let pick = opts.find((o) => o.type === 'stay') || opts[0];
    if (cfg.intent === 'stay' || cfg.intent === 'one-club') {
      pick = opts.find((o) => o.type === 'stay') || pick;
    } else if (cfg.intent === 'jump' || cfg.intent === 'giant') {
      const up = moves
        .filter((o) => o.type === 'transfer')
        .sort((a, b) => band(b.clubId) - band(a.clubId))[0];
      if (up && (form.good || band(up.clubId) >= fromRank)) pick = up;
    } else if (cfg.intent === 'journeyman') {
      pick = moves[0] || pick;
    } else if (cfg.intent === 'loan-hunt') {
      pick = moves.find((o) => o.type === 'loan') || moves[0] || pick;
    } else {
      // mix: take step up when good, else stay often
      if (form.good) {
        const up = moves.find((o) => o.type === 'transfer' && band(o.clubId) >= fromRank);
        if (up) pick = up;
      } else if (form.poor && moves.find((o) => o.type === 'loan')) {
        pick = moves.find((o) => o.type === 'loan');
      }
    }

    if (pick.type === 'transfer') transfers += 1;
    if (pick.type === 'loan') loans += 1;
    Eng.applyDecision(career, pick);
    if (career.currentClubId !== path[path.length - 1]) path.push(career.currentClubId);
    if (turned.retirement && turned.retirement.force) {
      Eng.retire(career, turned.retirement.reason);
      break;
    }
    if (turned.retirement && turned.retirement.shouldRetire && career.player.age >= 34) {
      Eng.retire(career, turned.retirement.reason);
      break;
    }
  }
  if (career.status !== 'retired') Eng.retire(career, 'playtest_end');
  const totals = Eng.History.liveTotals(career);
  const legacy = career.legacy || Eng.History.buildLegacy(career);
  return {
    name: cfg.name,
    intent: cfg.intent,
    country: cfg.country,
    position: cfg.position,
    firstClub: MC.Providers.clubs.getById(path[0])?.shortName || path[0],
    clubs: path.map((id) => MC.Providers.clubs.getById(id)?.shortName || id),
    seasons: totals.seasons,
    pj: totals.appearances,
    g: totals.goals,
    a: totals.assists,
    titles: totals.titles,
    ovrPeak: totals.peakOverall,
    agePeak: totals.peakAge,
    retireAge: totals.retireAge,
    archetype: legacy.archetype,
    phrase: MC.UI.Narrative.legacyLine(career),
    transfers,
    loans,
    market: {
      stayOnlyMarkets,
      transferMarkets,
      loanMarkets,
      inferiorOffers,
      similarOffers,
      superiorOffers,
      offerMoves,
      goodSuperiorRate: goodMarkets ? +(goodSuperiorish / goodMarkets).toFixed(2) : null
    },
    hudOk: totals.appearances > 0 && totals.clubId
  };
}

const specs = [
  { name: 'Sol', intent: 'sa', country: 'AR', age: 17, position: 'ST', profile: 'finisher', seed: 1201 },
  { name: 'Euro', intent: 'jump', country: 'ES', age: 17, position: 'CM', profile: 'finisher', seed: 1202 },
  { name: 'Kid', intent: 'jump', country: 'BR', age: 16, position: 'LW', profile: 'finisher', seed: 1203 },
  { name: 'Late', intent: 'mix', country: 'UY', age: 19, position: 'AM', profile: 'finisher', seed: 1204 },
  { name: 'Uno', intent: 'one-club', country: 'AR', age: 17, position: 'CB', profile: 'finisher', seed: 1205 },
  { name: 'Via', intent: 'journeyman', country: 'MX', age: 18, position: 'CM', profile: 'finisher', seed: 1206 },
  { name: 'Gig', intent: 'giant', country: 'CO', age: 17, position: 'ST', profile: 'finisher', seed: 1207 },
  { name: 'Fall', intent: 'journeyman', country: 'IT', age: 17, position: 'ST', profile: 'finisher', seed: 1208 },
  { name: 'Les', intent: 'mix', country: 'CL', age: 17, position: 'CM', profile: 'finisher', seed: 1209 },
  { name: 'Sel', intent: 'jump', country: 'AR', age: 16, position: 'ST', profile: 'finisher', seed: 1210 }
];

const rows = specs.map(playCareer);
console.log(JSON.stringify({ n: rows.length, rows }, null, 2));
