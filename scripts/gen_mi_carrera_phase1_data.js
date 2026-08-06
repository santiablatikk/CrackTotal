/**
 * Phase 1 dataset generator for Mi Carrera.
 * Run: node scripts/gen_mi_carrera_phase1_data.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROSTERS = require('./mi_carrera_rosters_data');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const IMG = path.join(ROOT, 'assets', 'images', 'mi-carrera');
const FLAGS = path.join(ROOT, 'assets', 'images', 'flags');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(rel, data) {
  const full = path.join(OUT, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return full;
}

function slug(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const COUNTRIES = [
  { code: 'AR', name: 'Argentina', continent: 'SA', confederation: 'CONMEBOL', demonym: 'argentino' },
  { code: 'BR', name: 'Brasil', continent: 'SA', confederation: 'CONMEBOL', demonym: 'brasileño' },
  { code: 'UY', name: 'Uruguay', continent: 'SA', confederation: 'CONMEBOL', demonym: 'uruguayo' },
  { code: 'CL', name: 'Chile', continent: 'SA', confederation: 'CONMEBOL', demonym: 'chileno' },
  { code: 'CO', name: 'Colombia', continent: 'SA', confederation: 'CONMEBOL', demonym: 'colombiano' },
  { code: 'EC', name: 'Ecuador', continent: 'SA', confederation: 'CONMEBOL', demonym: 'ecuatoriano' },
  { code: 'PY', name: 'Paraguay', continent: 'SA', confederation: 'CONMEBOL', demonym: 'paraguayo' },
  { code: 'PE', name: 'Perú', continent: 'SA', confederation: 'CONMEBOL', demonym: 'peruano' },
  { code: 'BO', name: 'Bolivia', continent: 'SA', confederation: 'CONMEBOL', demonym: 'boliviano' },
  { code: 'VE', name: 'Venezuela', continent: 'SA', confederation: 'CONMEBOL', demonym: 'venezolano' },
  { code: 'MX', name: 'México', continent: 'NA', confederation: 'CONCACAF', demonym: 'mexicano' },
  { code: 'US', name: 'Estados Unidos', continent: 'NA', confederation: 'CONCACAF', demonym: 'estadounidense' },
  { code: 'CA', name: 'Canadá', continent: 'NA', confederation: 'CONCACAF', demonym: 'canadiense' },
  { code: 'CR', name: 'Costa Rica', continent: 'NA', confederation: 'CONCACAF', demonym: 'costarricense' },
  { code: 'HN', name: 'Honduras', continent: 'NA', confederation: 'CONCACAF', demonym: 'hondureño' },
  { code: 'PA', name: 'Panamá', continent: 'NA', confederation: 'CONCACAF', demonym: 'panameño' },
  { code: 'JM', name: 'Jamaica', continent: 'NA', confederation: 'CONCACAF', demonym: 'jamaicano' },
  { code: 'GB', name: 'Inglaterra', continent: 'EU', confederation: 'UEFA', demonym: 'inglés', flagCode: 'gb' },
  { code: 'SCT', name: 'Escocia', continent: 'EU', confederation: 'UEFA', demonym: 'escocés', flagCode: 'gb' },
  { code: 'ES', name: 'España', continent: 'EU', confederation: 'UEFA', demonym: 'español' },
  { code: 'IT', name: 'Italia', continent: 'EU', confederation: 'UEFA', demonym: 'italiano' },
  { code: 'DE', name: 'Alemania', continent: 'EU', confederation: 'UEFA', demonym: 'alemán' },
  { code: 'FR', name: 'Francia', continent: 'EU', confederation: 'UEFA', demonym: 'francés' },
  { code: 'PT', name: 'Portugal', continent: 'EU', confederation: 'UEFA', demonym: 'portugués' },
  { code: 'NL', name: 'Países Bajos', continent: 'EU', confederation: 'UEFA', demonym: 'neerlandés' },
  { code: 'BE', name: 'Bélgica', continent: 'EU', confederation: 'UEFA', demonym: 'belga' },
  { code: 'TR', name: 'Turquía', continent: 'EU', confederation: 'UEFA', demonym: 'turco' },
  { code: 'GR', name: 'Grecia', continent: 'EU', confederation: 'UEFA', demonym: 'griego' },
  { code: 'AT', name: 'Austria', continent: 'EU', confederation: 'UEFA', demonym: 'austríaco' },
  { code: 'CH', name: 'Suiza', continent: 'EU', confederation: 'UEFA', demonym: 'suizo' },
  { code: 'DK', name: 'Dinamarca', continent: 'EU', confederation: 'UEFA', demonym: 'danés' },
  { code: 'NO', name: 'Noruega', continent: 'EU', confederation: 'UEFA', demonym: 'noruego' },
  { code: 'SE', name: 'Suecia', continent: 'EU', confederation: 'UEFA', demonym: 'sueco' },
  { code: 'PL', name: 'Polonia', continent: 'EU', confederation: 'UEFA', demonym: 'polaco' },
  { code: 'CZ', name: 'República Checa', continent: 'EU', confederation: 'UEFA', demonym: 'checo' },
  { code: 'HR', name: 'Croacia', continent: 'EU', confederation: 'UEFA', demonym: 'croata' },
  { code: 'RS', name: 'Serbia', continent: 'EU', confederation: 'UEFA', demonym: 'serbio' },
  { code: 'UA', name: 'Ucrania', continent: 'EU', confederation: 'UEFA', demonym: 'ucraniano' },
  { code: 'IE', name: 'Irlanda', continent: 'EU', confederation: 'UEFA', demonym: 'irlandés' },
  { code: 'RU', name: 'Rusia', continent: 'EU', confederation: 'UEFA', demonym: 'ruso' },
  { code: 'RO', name: 'Rumania', continent: 'EU', confederation: 'UEFA', demonym: 'rumano' },
  { code: 'HU', name: 'Hungría', continent: 'EU', confederation: 'UEFA', demonym: 'húngaro' },
  { code: 'JP', name: 'Japón', continent: 'AS', confederation: 'AFC', demonym: 'japonés' },
  { code: 'KR', name: 'Corea del Sur', continent: 'AS', confederation: 'AFC', demonym: 'surcoreano' },
  { code: 'CN', name: 'China', continent: 'AS', confederation: 'AFC', demonym: 'chino' },
  { code: 'SA', name: 'Arabia Saudita', continent: 'AS', confederation: 'AFC', demonym: 'saudí' },
  { code: 'QA', name: 'Qatar', continent: 'AS', confederation: 'AFC', demonym: 'catarí' },
  { code: 'AE', name: 'Emiratos Árabes Unidos', continent: 'AS', confederation: 'AFC', demonym: 'emiratí' },
  { code: 'IR', name: 'Irán', continent: 'AS', confederation: 'AFC', demonym: 'iraní' },
  { code: 'AU', name: 'Australia', continent: 'OC', confederation: 'AFC', demonym: 'australiano' },
  { code: 'NZ', name: 'Nueva Zelanda', continent: 'OC', confederation: 'OFC', demonym: 'neozelandés' },
  { code: 'EG', name: 'Egipto', continent: 'AF', confederation: 'CAF', demonym: 'egipcio' },
  { code: 'MA', name: 'Marruecos', continent: 'AF', confederation: 'CAF', demonym: 'marroquí' },
  { code: 'NG', name: 'Nigeria', continent: 'AF', confederation: 'CAF', demonym: 'nigeriano' },
  { code: 'GH', name: 'Ghana', continent: 'AF', confederation: 'CAF', demonym: 'ghanés' },
  { code: 'SN', name: 'Senegal', continent: 'AF', confederation: 'CAF', demonym: 'senegalés' },
  { code: 'CI', name: "Côte d'Ivoire", continent: 'AF', confederation: 'CAF', demonym: 'marfileño' },
  { code: 'CM', name: 'Camerún', continent: 'AF', confederation: 'CAF', demonym: 'camerunés' },
  { code: 'ZA', name: 'Sudáfrica', continent: 'AF', confederation: 'CAF', demonym: 'sudafricano' },
  { code: 'TN', name: 'Túnez', continent: 'AF', confederation: 'CAF', demonym: 'tunecino' },
  { code: 'DZ', name: 'Argelia', continent: 'AF', confederation: 'CAF', demonym: 'argelino' }
];

const LEAGUES = [
  { id: 'ar_primera', name: 'Liga Profesional', shortName: 'LPF', countryCode: 'AR', continent: 'SA', level: 1, prestige: 72 },
  { id: 'br_serie_a', name: 'Brasileirão Série A', shortName: 'Série A', countryCode: 'BR', continent: 'SA', level: 1, prestige: 78 },
  { id: 'uy_primera', name: 'Primera División', shortName: 'Primera UY', countryCode: 'UY', continent: 'SA', level: 1, prestige: 64 },
  { id: 'cl_primera', name: 'Primera División', shortName: 'Primera CL', countryCode: 'CL', continent: 'SA', level: 1, prestige: 62 },
  { id: 'co_primera', name: 'Primera A', shortName: 'Primera CO', countryCode: 'CO', continent: 'SA', level: 1, prestige: 63 },
  { id: 'ec_serie_a', name: 'Serie A', shortName: 'Serie A EC', countryCode: 'EC', continent: 'SA', level: 1, prestige: 58 },
  { id: 'py_primera', name: 'División de Honor', shortName: 'Primera PY', countryCode: 'PY', continent: 'SA', level: 1, prestige: 56 },
  { id: 'pe_liga1', name: 'Liga 1', shortName: 'Liga 1', countryCode: 'PE', continent: 'SA', level: 1, prestige: 55 },
  { id: 'bo_primera', name: 'División Profesional', shortName: 'Primera BO', countryCode: 'BO', continent: 'SA', level: 1, prestige: 50 },
  { id: 've_primera', name: 'Liga FUTVE', shortName: 'FUTVE', countryCode: 'VE', continent: 'SA', level: 1, prestige: 52 },
  { id: 'mx_liga_mx', name: 'Liga MX', shortName: 'Liga MX', countryCode: 'MX', continent: 'NA', level: 1, prestige: 74 },
  { id: 'us_mls', name: 'Major League Soccer', shortName: 'MLS', countryCode: 'US', continent: 'NA', level: 1, prestige: 68 },
  { id: 'gb_premier', name: 'Premier League', shortName: 'Premier', countryCode: 'GB', continent: 'EU', level: 1, prestige: 96 },
  { id: 'gb_championship', name: 'EFL Championship', shortName: 'Championship', countryCode: 'GB', continent: 'EU', level: 2, prestige: 72 },
  { id: 'sct_prem', name: 'Scottish Premiership', shortName: 'SPFL', countryCode: 'SCT', continent: 'EU', level: 1, prestige: 66 },
  { id: 'es_laliga', name: 'LaLiga', shortName: 'LaLiga', countryCode: 'ES', continent: 'EU', level: 1, prestige: 94 },
  { id: 'es_segunda', name: 'LaLiga Hypermotion', shortName: 'Segunda', countryCode: 'ES', continent: 'EU', level: 2, prestige: 70 },
  { id: 'it_serie_a', name: 'Serie A', shortName: 'Serie A', countryCode: 'IT', continent: 'EU', level: 1, prestige: 92 },
  { id: 'it_serie_b', name: 'Serie B', shortName: 'Serie B', countryCode: 'IT', continent: 'EU', level: 2, prestige: 68 },
  { id: 'de_bundesliga', name: 'Bundesliga', shortName: 'Bundesliga', countryCode: 'DE', continent: 'EU', level: 1, prestige: 90 },
  { id: 'de_2bundesliga', name: '2. Bundesliga', shortName: '2. Bundesliga', countryCode: 'DE', continent: 'EU', level: 2, prestige: 68 },
  { id: 'fr_ligue1', name: 'Ligue 1', shortName: 'Ligue 1', countryCode: 'FR', continent: 'EU', level: 1, prestige: 88 },
  { id: 'fr_ligue2', name: 'Ligue 2', shortName: 'Ligue 2', countryCode: 'FR', continent: 'EU', level: 2, prestige: 64 },
  { id: 'pt_liga', name: 'Liga Portugal', shortName: 'Liga Portugal', countryCode: 'PT', continent: 'EU', level: 1, prestige: 80 },
  { id: 'nl_eredivisie', name: 'Eredivisie', shortName: 'Eredivisie', countryCode: 'NL', continent: 'EU', level: 1, prestige: 78 },
  { id: 'be_pro', name: 'Jupiler Pro League', shortName: 'Pro League', countryCode: 'BE', continent: 'EU', level: 1, prestige: 74 },
  { id: 'tr_super', name: 'Süper Lig', shortName: 'Süper Lig', countryCode: 'TR', continent: 'EU', level: 1, prestige: 76 },
  { id: 'gr_super', name: 'Super League Greece', shortName: 'Super League', countryCode: 'GR', continent: 'EU', level: 1, prestige: 68 },
  { id: 'at_bundesliga', name: 'Admiral Bundesliga', shortName: 'Bundesliga AT', countryCode: 'AT', continent: 'EU', level: 1, prestige: 66 },
  { id: 'ch_super', name: 'Super League', shortName: 'Super League CH', countryCode: 'CH', continent: 'EU', level: 1, prestige: 65 },
  { id: 'dk_superliga', name: 'Superliga', shortName: 'Superliga', countryCode: 'DK', continent: 'EU', level: 1, prestige: 64 },
  { id: 'no_eliteserien', name: 'Eliteserien', shortName: 'Eliteserien', countryCode: 'NO', continent: 'EU', level: 1, prestige: 60 },
  { id: 'se_allsvenskan', name: 'Allsvenskan', shortName: 'Allsvenskan', countryCode: 'SE', continent: 'EU', level: 1, prestige: 60 },
  { id: 'pl_ekstraklasa', name: 'Ekstraklasa', shortName: 'Ekstraklasa', countryCode: 'PL', continent: 'EU', level: 1, prestige: 62 },
  { id: 'cz_fortuna', name: 'Chance Liga', shortName: 'Chance Liga', countryCode: 'CZ', continent: 'EU', level: 1, prestige: 61 },
  { id: 'hr_hnl', name: 'HNL', shortName: 'HNL', countryCode: 'HR', continent: 'EU', level: 1, prestige: 63 },
  { id: 'rs_superliga', name: 'Mozzart Bet Superliga', shortName: 'Superliga RS', countryCode: 'RS', continent: 'EU', level: 1, prestige: 62 },
  { id: 'ua_premier', name: 'Ukrainian Premier League', shortName: 'UPL', countryCode: 'UA', continent: 'EU', level: 1, prestige: 64 },
  { id: 'jp_j1', name: 'J1 League', shortName: 'J1', countryCode: 'JP', continent: 'AS', level: 1, prestige: 66 },
  { id: 'kr_k1', name: 'K League 1', shortName: 'K League 1', countryCode: 'KR', continent: 'AS', level: 1, prestige: 62 },
  { id: 'cn_csl', name: 'Chinese Super League', shortName: 'CSL', countryCode: 'CN', continent: 'AS', level: 1, prestige: 60 },
  { id: 'sa_pro', name: 'Saudi Pro League', shortName: 'SPL', countryCode: 'SA', continent: 'AS', level: 1, prestige: 82 },
  { id: 'qa_stars', name: 'Qatar Stars League', shortName: 'QSL', countryCode: 'QA', continent: 'AS', level: 1, prestige: 64 },
  { id: 'ae_pro', name: 'UAE Pro League', shortName: 'UAE Pro', countryCode: 'AE', continent: 'AS', level: 1, prestige: 63 },
  { id: 'au_aleague', name: 'A-League Men', shortName: 'A-League', countryCode: 'AU', continent: 'OC', level: 1, prestige: 58 },
  { id: 'eg_premier', name: 'Egyptian Premier League', shortName: 'EPL EG', countryCode: 'EG', continent: 'AF', level: 1, prestige: 60 },
  { id: 'ma_botola', name: 'Botola Pro', shortName: 'Botola', countryCode: 'MA', continent: 'AF', level: 1, prestige: 58 },
  { id: 'za_psl', name: 'DStv Premiership', shortName: 'PSL', countryCode: 'ZA', continent: 'AF', level: 1, prestige: 56 },
  { id: 'ng_npfl', name: 'NPFL', shortName: 'NPFL', countryCode: 'NG', continent: 'AF', level: 1, prestige: 52 }
];

const COMPETITIONS = [
  { id: 'uefa_cl', name: 'UEFA Champions League', shortName: 'Champions', region: 'EU', type: 'club_continental', tier: 'legendary', prestige: 98, rarity: 'legendary' },
  { id: 'uefa_el', name: 'UEFA Europa League', shortName: 'Europa League', region: 'EU', type: 'club_continental', tier: 'major', prestige: 86, rarity: 'major' },
  { id: 'uefa_uecl', name: 'UEFA Conference League', shortName: 'Conference', region: 'EU', type: 'club_continental', tier: 'notable', prestige: 74, rarity: 'notable' },
  { id: 'conmebol_libertadores', name: 'Copa Libertadores', shortName: 'Libertadores', region: 'SA', type: 'club_continental', tier: 'legendary', prestige: 94, rarity: 'legendary' },
  { id: 'conmebol_sudamericana', name: 'Copa Sudamericana', shortName: 'Sudamericana', region: 'SA', type: 'club_continental', tier: 'major', prestige: 80, rarity: 'major' },
  { id: 'conmebol_recopa', name: 'Recopa Sudamericana', shortName: 'Recopa', region: 'SA', type: 'club_continental', tier: 'notable', prestige: 76, rarity: 'notable' },
  { id: 'fifa_club_world_cup', name: 'Mundial de Clubes', shortName: 'Mundial Clubes', region: 'WORLD', type: 'club_world', tier: 'legendary', prestige: 90, rarity: 'legendary' },
  { id: 'fifa_world_cup', name: 'Copa del Mundo', shortName: 'Mundial', region: 'WORLD', type: 'national_major', tier: 'mythic', prestige: 100, rarity: 'mythic' },
  { id: 'conmebol_copa_america', name: 'Copa América', shortName: 'Copa América', region: 'SA', type: 'national_continental', tier: 'legendary', prestige: 92, rarity: 'legendary' },
  { id: 'uefa_euro', name: 'Eurocopa', shortName: 'Euro', region: 'EU', type: 'national_continental', tier: 'legendary', prestige: 93, rarity: 'legendary' },
  { id: 'caf_afcon', name: 'Copa Africana de Naciones', shortName: 'AFCON', region: 'AF', type: 'national_continental', tier: 'major', prestige: 84, rarity: 'major' },
  { id: 'afc_asian_cup', name: 'Copa Asiática', shortName: 'Asian Cup', region: 'AS', type: 'national_continental', tier: 'major', prestige: 82, rarity: 'major' },
  { id: 'concacaf_gold_cup', name: 'Copa Oro', shortName: 'Gold Cup', region: 'NA', type: 'national_continental', tier: 'major', prestige: 78, rarity: 'major' },
  { id: 'ar_league', name: 'Liga Profesional', shortName: 'Liga AR', region: 'AR', type: 'domestic_league', tier: 'notable', prestige: 72, rarity: 'notable', countryCode: 'AR' },
  { id: 'ar_copa', name: 'Copa Argentina', shortName: 'Copa AR', region: 'AR', type: 'domestic_cup', tier: 'normal', prestige: 64, rarity: 'normal', countryCode: 'AR' },
  { id: 'br_league', name: 'Brasileirão', shortName: 'Brasileirão', region: 'BR', type: 'domestic_league', tier: 'major', prestige: 78, rarity: 'major', countryCode: 'BR' },
  { id: 'br_copa', name: 'Copa do Brasil', shortName: 'Copa BR', region: 'BR', type: 'domestic_cup', tier: 'notable', prestige: 70, rarity: 'notable', countryCode: 'BR' },
  { id: 'gb_league', name: 'Premier League', shortName: 'Premier', region: 'GB', type: 'domestic_league', tier: 'legendary', prestige: 96, rarity: 'legendary', countryCode: 'GB' },
  { id: 'gb_fa_cup', name: 'FA Cup', shortName: 'FA Cup', region: 'GB', type: 'domestic_cup', tier: 'major', prestige: 84, rarity: 'major', countryCode: 'GB' },
  { id: 'gb_efl_cup', name: 'EFL Cup', shortName: 'Carabao', region: 'GB', type: 'domestic_cup', tier: 'notable', prestige: 74, rarity: 'notable', countryCode: 'GB' },
  { id: 'es_league', name: 'LaLiga', shortName: 'LaLiga', region: 'ES', type: 'domestic_league', tier: 'legendary', prestige: 94, rarity: 'legendary', countryCode: 'ES' },
  { id: 'es_copa', name: 'Copa del Rey', shortName: 'Copa del Rey', region: 'ES', type: 'domestic_cup', tier: 'major', prestige: 82, rarity: 'major', countryCode: 'ES' },
  { id: 'es_supercopa', name: 'Supercopa de España', shortName: 'Supercopa ES', region: 'ES', type: 'domestic_super', tier: 'notable', prestige: 72, rarity: 'notable', countryCode: 'ES' },
  { id: 'it_league', name: 'Serie A', shortName: 'Serie A', region: 'IT', type: 'domestic_league', tier: 'legendary', prestige: 92, rarity: 'legendary', countryCode: 'IT' },
  { id: 'it_copa', name: 'Coppa Italia', shortName: 'Coppa Italia', region: 'IT', type: 'domestic_cup', tier: 'major', prestige: 78, rarity: 'major', countryCode: 'IT' },
  { id: 'de_league', name: 'Bundesliga', shortName: 'Bundesliga', region: 'DE', type: 'domestic_league', tier: 'legendary', prestige: 90, rarity: 'legendary', countryCode: 'DE' },
  { id: 'de_copa', name: 'DFB-Pokal', shortName: 'DFB-Pokal', region: 'DE', type: 'domestic_cup', tier: 'major', prestige: 80, rarity: 'major', countryCode: 'DE' },
  { id: 'fr_league', name: 'Ligue 1', shortName: 'Ligue 1', region: 'FR', type: 'domestic_league', tier: 'major', prestige: 88, rarity: 'major', countryCode: 'FR' },
  { id: 'fr_copa', name: 'Coupe de France', shortName: 'Coupe FR', region: 'FR', type: 'domestic_cup', tier: 'notable', prestige: 74, rarity: 'notable', countryCode: 'FR' },
  { id: 'pt_league', name: 'Liga Portugal', shortName: 'Liga PT', region: 'PT', type: 'domestic_league', tier: 'major', prestige: 80, rarity: 'major', countryCode: 'PT' },
  { id: 'pt_copa', name: 'Taça de Portugal', shortName: 'Taça PT', region: 'PT', type: 'domestic_cup', tier: 'notable', prestige: 70, rarity: 'notable', countryCode: 'PT' },
  { id: 'nl_league', name: 'Eredivisie', shortName: 'Eredivisie', region: 'NL', type: 'domestic_league', tier: 'major', prestige: 78, rarity: 'major', countryCode: 'NL' },
  { id: 'mx_league', name: 'Liga MX', shortName: 'Liga MX', region: 'MX', type: 'domestic_league', tier: 'major', prestige: 74, rarity: 'major', countryCode: 'MX' },
  { id: 'us_league', name: 'MLS Cup', shortName: 'MLS Cup', region: 'US', type: 'domestic_league', tier: 'notable', prestige: 68, rarity: 'notable', countryCode: 'US' },
  { id: 'uefa_super_cup', name: 'UEFA Super Cup', shortName: 'Supercopa UEFA', region: 'EU', type: 'club_continental', tier: 'notable', prestige: 78, rarity: 'notable' }
];

const AWARDS = [
  { id: 'ballon_dor', name: 'Balón de Oro', shortName: 'Balón de Oro', scope: 'global', rarity: 'mythic', prestige: 100 },
  { id: 'golden_boot_europe', name: 'Bota de Oro', shortName: 'Bota de Oro', scope: 'europe', rarity: 'legendary', prestige: 90 },
  { id: 'best_fifa_player', name: 'The Best', shortName: 'The Best', scope: 'global', rarity: 'legendary', prestige: 92 },
  { id: 'continental_player_sa', name: 'Rey de América', shortName: 'Rey de América', scope: 'SA', rarity: 'major', prestige: 84 },
  { id: 'continental_player_eu', name: 'Mejor Jugador UEFA', shortName: 'UEFA Player', scope: 'EU', rarity: 'major', prestige: 86 },
  { id: 'league_mvp', name: 'Jugador de la Temporada', shortName: 'MVP Liga', scope: 'league', rarity: 'notable', prestige: 72 },
  { id: 'league_top_scorer', name: 'Máximo Goleador', shortName: 'Goleador', scope: 'league', rarity: 'notable', prestige: 70 },
  { id: 'league_top_assist', name: 'Máximo Asistidor', shortName: 'Asistidor', scope: 'league', rarity: 'normal', prestige: 64 },
  { id: 'young_player', name: 'Mejor Jugador Joven', shortName: 'Mejor Joven', scope: 'league', rarity: 'notable', prestige: 68 },
  { id: 'competition_mvp', name: 'MVP de Competición', shortName: 'MVP', scope: 'competition', rarity: 'major', prestige: 78 },
  { id: 'team_of_season', name: 'Equipo de la Temporada', shortName: 'XI Ideal', scope: 'league', rarity: 'normal', prestige: 60 },
  { id: 'goalkeeper_season', name: 'Mejor Arquero', shortName: 'Mejor Arquero', scope: 'league', rarity: 'notable', prestige: 66 },
  { id: 'world_cup_golden_ball', name: 'Balón de Oro del Mundial', shortName: 'Balón Mundial', scope: 'world_cup', rarity: 'mythic', prestige: 98 },
  { id: 'world_cup_golden_boot', name: 'Bota de Oro del Mundial', shortName: 'Bota Mundial', scope: 'world_cup', rarity: 'legendary', prestige: 90 },
  { id: 'club_player_of_year', name: 'Jugador del Club', shortName: 'Jugador del Club', scope: 'club', rarity: 'normal', prestige: 55 }
];

const PROFILES = [
  { id: 'creator', name: 'El Creador', positions: ['MCO', 'MC', 'EI', 'ED'], bias: { assist: 1.25, goal: 0.9, vision: 1.2 } },
  { id: 'finisher', name: 'El Goleador', positions: ['DC', 'ED', 'EI', 'MCO'], bias: { goal: 1.35, assist: 0.85, shot: 1.25 } },
  { id: 'winger', name: 'El Extremo', positions: ['ED', 'EI', 'DC'], bias: { pace: 1.25, dribble: 1.2, goal: 1.05 } },
  { id: 'engine', name: 'Box to Box', positions: ['MC', 'MCD', 'MCO'], bias: { stamina: 1.3, tackle: 1.1, assist: 1.05 } },
  { id: 'wall', name: 'El Muro', positions: ['DFC', 'MCD', 'LD', 'LI'], bias: { defend: 1.3, aerial: 1.2, pace: 0.9 } },
  { id: 'fullback', name: 'El Carrilero', positions: ['LD', 'LI'], bias: { pace: 1.2, cross: 1.2, defend: 1.05 } },
  { id: 'specialist', name: 'El Especialista', positions: ['MCO', 'MC', 'DC'], bias: { setpiece: 1.4, shot: 1.1 } },
  { id: 'modern_gk', name: 'Portero Moderno', positions: ['POR'], bias: { reflex: 1.15, distribution: 1.25, command: 1.1 } },
  { id: 'brain', name: 'El Cerebro', positions: ['MC', 'MCO', 'MCD'], bias: { vision: 1.35, pass: 1.3, pace: 0.9 } }
];

function parseClubLine(line, league) {
  const parts = line.split('|');
  if (parts.length < 7) throw new Error('Bad club line: ' + line);
  const [name, shortName, tierS, prestigeS, primaryColor, secondaryColor, city, tagsS] = parts;
  if (shortName === 'SKIP' || name.includes('Placeholder') || name.includes('Skip')) return null;
  const prestige = Number(prestigeS);
  const tier = Number(tierS);
  const tags = (tagsS || '').split(',').map((t) => t.trim()).filter(Boolean);
  const id = `${league.countryCode.toLowerCase()}_${slug(name)}`;
  return {
    id,
    name,
    shortName,
    countryCode: league.countryCode,
    continent: league.continent,
    leagueId: league.id,
    league: league.name,
    tier,
    prestige,
    financialLevel: Math.max(20, prestige - 4),
    youthLevel: tags.includes('youth_factory') ? Math.max(prestige + 6, 80) : Math.max(25, prestige - 10),
    squadStrength: prestige,
    internationalReputation: Math.max(15, prestige - 8),
    primaryColor,
    secondaryColor,
    city: city || undefined,
    tags
  };
}

function buildClubs() {
  const leagueById = Object.fromEntries(LEAGUES.map((l) => [l.id, l]));
  const clubs = [];
  const seen = new Set();

  for (const [leagueId, lines] of Object.entries(ROSTERS)) {
    const league = leagueById[leagueId];
    if (!league) throw new Error('Unknown league in rosters: ' + leagueId);
    for (const line of lines) {
      const club = parseClubLine(line, league);
      if (!club) continue;
      if (seen.has(club.id)) {
        club.id = club.id + '_' + slug(league.shortName);
      }
      seen.add(club.id);
      clubs.push(club);
    }
  }
  clubs.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return clubs;
}

function buildBadgeManifest(clubs) {
  const badges = {};
  let real = 0;
  let missing = 0;
  for (const club of clubs) {
    const candidates = [
      path.join(IMG, 'clubs', club.id + '.svg'),
      path.join(IMG, 'clubs', club.id + '.webp'),
      path.join(IMG, 'clubs', club.id + '.png')
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      const ext = path.extname(found);
      badges[club.id] = {
        status: 'real',
        src: `assets/images/mi-carrera/clubs/${club.id}${ext}`,
        license: 'pending_review',
        source: 'local'
      };
      real += 1;
    } else {
      badges[club.id] = {
        status: 'missing',
        src: null,
        license: null,
        source: null,
        fallback: {
          type: 'color_tile',
          primaryColor: club.primaryColor,
          secondaryColor: club.secondaryColor,
          label: club.shortName
        }
      };
      missing += 1;
    }
  }
  return { version: 1, generatedAt: new Date().toISOString().slice(0, 10), counts: { real, missing, total: clubs.length }, badges };
}

function buildAssetManifest(ids, folder, prefix) {
  const items = {};
  let real = 0;
  let missing = 0;
  for (const id of ids) {
    const candidates = ['.svg', '.webp', '.png'].map((ext) => path.join(IMG, folder, id + ext));
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      const ext = path.extname(found);
      items[id] = {
        status: 'real',
        src: `assets/images/mi-carrera/${folder}/${id}${ext}`,
        license: 'pending_review',
        source: 'local'
      };
      real += 1;
    } else {
      items[id] = {
        status: 'missing',
        src: null,
        fallback: { type: prefix, label: id }
      };
      missing += 1;
    }
  }
  return { version: 1, counts: { real, missing, total: ids.length }, items };
}

function flagExists(code) {
  const cc = String(code).toLowerCase();
  return fs.existsSync(path.join(FLAGS, cc + '.svg'));
}

function main() {
  ensureDir(OUT);
  [
    'clubs',
    'competitions',
    'trophies',
    'awards',
    'ui'
  ].forEach((d) => {
    ensureDir(path.join(IMG, d));
    const keep = path.join(IMG, d, '.gitkeep');
    if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
  });

  const clubs = buildClubs();
  const countries = COUNTRIES.map((c) => {
    const flagCode = (c.flagCode || c.code).toLowerCase();
    return {
      code: c.code,
      name: c.name,
      continent: c.continent,
      confederation: c.confederation,
      demonym: c.demonym,
      flagCode,
      flagStatus: flagExists(flagCode) ? 'real' : 'missing',
      playable: true
    };
  });

  writeJson('countries.json', { version: 1, count: countries.length, countries });
  writeJson('leagues.json', { version: 1, count: LEAGUES.length, leagues: LEAGUES });
  writeJson('clubs.json', { version: 1, count: clubs.length, clubs });
  writeJson('competitions.json', { version: 1, count: COMPETITIONS.length, competitions: COMPETITIONS });
  writeJson('awards.json', { version: 1, count: AWARDS.length, awards: AWARDS });
  writeJson('profiles.json', { version: 1, count: PROFILES.length, profiles: PROFILES });

  const badgeManifest = buildBadgeManifest(clubs);
  writeJson('manifests/club-badges.json', badgeManifest);
  writeJson(
    'manifests/competition-logos.json',
    buildAssetManifest(
      COMPETITIONS.map((c) => c.id),
      'competitions',
      'competition_wordmark'
    )
  );
  writeJson(
    'manifests/trophy-images.json',
    buildAssetManifest(
      COMPETITIONS.map((c) => c.id),
      'trophies',
      'trophy_silhouette'
    )
  );
  writeJson(
    'manifests/award-images.json',
    buildAssetManifest(
      AWARDS.map((a) => a.id),
      'awards',
      'award_mark'
    )
  );

  const byContinent = clubs.reduce((acc, c) => {
    acc[c.continent] = (acc[c.continent] || 0) + 1;
    return acc;
  }, {});

  console.log('Mi Carrera Phase 1 data generated');
  console.log('countries:', countries.length);
  console.log('leagues:', LEAGUES.length);
  console.log('clubs:', clubs.length, byContinent);
  console.log('competitions:', COMPETITIONS.length);
  console.log('awards:', AWARDS.length);
  console.log('profiles:', PROFILES.length);
  console.log('badges real/missing:', badgeManifest.counts.real, badgeManifest.counts.missing);
  console.log('flags real:', countries.filter((c) => c.flagStatus === 'real').length);
}

main();
