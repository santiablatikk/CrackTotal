/**
 * Extra leagues + clubs for Mi Carrera FASE 5C catalog expansion.
 * Format: Name|Short|tier|prestige|primary|secondary|city|tags
 * Never reuse existing club IDs from phase-1 rosters.
 */
'use strict';

module.exports = {
  leagues: [
    { id: 'ar_nacional', name: 'Primera Nacional', shortName: 'Nacional AR', countryCode: 'AR', continent: 'SA', level: 2, prestige: 54 },
    { id: 'br_serie_b', name: 'Brasileirão Série B', shortName: 'Série B', countryCode: 'BR', continent: 'SA', level: 2, prestige: 58 },
    { id: 'uy_segunda', name: 'Segunda División', shortName: 'Segunda UY', countryCode: 'UY', continent: 'SA', level: 2, prestige: 46 },
    { id: 'cl_primera_b', name: 'Primera B', shortName: 'Primera B CL', countryCode: 'CL', continent: 'SA', level: 2, prestige: 46 },
    { id: 'co_primera_b', name: 'Primera B', shortName: 'Primera B CO', countryCode: 'CO', continent: 'SA', level: 2, prestige: 48 },
    { id: 'mx_expansion', name: 'Liga de Expansión MX', shortName: 'Expansión', countryCode: 'MX', continent: 'NA', level: 2, prestige: 50 },
    { id: 'us_usl', name: 'USL Championship', shortName: 'USL', countryCode: 'US', continent: 'NA', level: 2, prestige: 46 },
    { id: 'pt_liga2', name: 'Liga Portugal 2', shortName: 'Liga 2 PT', countryCode: 'PT', continent: 'EU', level: 2, prestige: 54 },
    { id: 'nl_eerste', name: 'Keuken Kampioen Divisie', shortName: 'Eerste', countryCode: 'NL', continent: 'EU', level: 2, prestige: 52 },
    { id: 'be_challenger', name: 'Challenger Pro League', shortName: 'Challenger', countryCode: 'BE', continent: 'EU', level: 2, prestige: 50 },
    { id: 'tr_1lig', name: '1. Lig', shortName: '1. Lig', countryCode: 'TR', continent: 'EU', level: 2, prestige: 52 },
    { id: 'at_2liga', name: '2. Liga', shortName: '2. Liga AT', countryCode: 'AT', continent: 'EU', level: 2, prestige: 48 },
    { id: 'ch_challenge', name: 'Challenge League', shortName: 'Challenge CH', countryCode: 'CH', continent: 'EU', level: 2, prestige: 48 },
    { id: 'gr_super2', name: 'Super League 2', shortName: 'SL2', countryCode: 'GR', continent: 'EU', level: 2, prestige: 46 },
    { id: 'se_superettan', name: 'Superettan', shortName: 'Superettan', countryCode: 'SE', continent: 'EU', level: 2, prestige: 46 },
    { id: 'no_obos', name: 'OBOS-ligaen', shortName: 'OBOS', countryCode: 'NO', continent: 'EU', level: 2, prestige: 44 },
    { id: 'dk_1div', name: '1. Division', shortName: '1. Div DK', countryCode: 'DK', continent: 'EU', level: 2, prestige: 46 },
    { id: 'pl_1liga', name: 'I liga', shortName: 'I liga', countryCode: 'PL', continent: 'EU', level: 2, prestige: 48 },
    { id: 'sct_championship', name: 'Scottish Championship', shortName: 'Champ SCT', countryCode: 'SCT', continent: 'EU', level: 2, prestige: 48 },
    { id: 'ie_premier', name: 'League of Ireland Premier', shortName: 'LOI Prem', countryCode: 'IE', continent: 'EU', level: 1, prestige: 44 },
    { id: 'ie_first', name: 'LOI First Division', shortName: 'LOI 1st', countryCode: 'IE', continent: 'EU', level: 2, prestige: 40 },
    { id: 'ua_persha', name: 'Persha Liga', shortName: 'Persha', countryCode: 'UA', continent: 'EU', level: 2, prestige: 44 },
    { id: 'rs_prva', name: 'Prva Liga', shortName: 'Prva RS', countryCode: 'RS', continent: 'EU', level: 2, prestige: 42 },
    { id: 'hr_prva_nl', name: 'Prva NL', shortName: 'Prva NL', countryCode: 'HR', continent: 'EU', level: 2, prestige: 42 },
    { id: 'cz_fnl', name: 'Chance Národní Liga', shortName: 'FNL', countryCode: 'CZ', continent: 'EU', level: 2, prestige: 44 },
    { id: 'jp_j2', name: 'J2 League', shortName: 'J2', countryCode: 'JP', continent: 'AS', level: 2, prestige: 50 },
    { id: 'kr_k2', name: 'K League 2', shortName: 'K2', countryCode: 'KR', continent: 'AS', level: 2, prestige: 46 },
    { id: 'cn_league1', name: 'China League One', shortName: 'CL1', countryCode: 'CN', continent: 'AS', level: 2, prestige: 44 },
    { id: 'sa_first', name: 'Saudi First Division', shortName: 'Yelo', countryCode: 'SA', continent: 'AS', level: 2, prestige: 48 },
    { id: 'ae_first', name: 'UAE Division 1', shortName: 'UAE D1', countryCode: 'AE', continent: 'AS', level: 2, prestige: 42 },
    { id: 'au_npl', name: 'NPL', shortName: 'NPL', countryCode: 'AU', continent: 'OC', level: 2, prestige: 40 },
    { id: 'pe_liga2', name: 'Liga 2', shortName: 'Liga 2 PE', countryCode: 'PE', continent: 'SA', level: 2, prestige: 42 },
    { id: 'ec_serie_b', name: 'Serie B', shortName: 'Serie B EC', countryCode: 'EC', continent: 'SA', level: 2, prestige: 42 },
    { id: 'py_intermedia', name: 'División Intermedia', shortName: 'Intermedia', countryCode: 'PY', continent: 'SA', level: 2, prestige: 40 },
    { id: 've_segunda', name: 'Segunda División', shortName: 'Segunda VE', countryCode: 'VE', continent: 'SA', level: 2, prestige: 38 },
    { id: 'bo_copa_sb', name: 'Copa Simón Bolívar', shortName: 'Simón Bolívar', countryCode: 'BO', continent: 'SA', level: 2, prestige: 36 },
    { id: 'eg_second', name: 'Egyptian Second Division A', shortName: '2nd EG', countryCode: 'EG', continent: 'AF', level: 2, prestige: 40 },
    { id: 'ma_botola2', name: 'Botola 2', shortName: 'Botola 2', countryCode: 'MA', continent: 'AF', level: 2, prestige: 38 },
    { id: 'za_motsepe', name: 'Motsepe Foundation Championship', shortName: 'Motsepe', countryCode: 'ZA', continent: 'AF', level: 2, prestige: 40 },
    { id: 'ng_nnl', name: 'Nigeria National League', shortName: 'NNL', countryCode: 'NG', continent: 'AF', level: 2, prestige: 36 }
  ],

  // Existing top leagues: fill recognizable missing clubs
  ar_primera: [
    'Instituto|Instituto|3|58|#E30613|#FFFFFF|Córdoba|',
    'Barracas Central|Barracas|2|52|#E30613|#FFFFFF|Buenos Aires|',
    'Deportivo Riestra|Riestra|2|50|#000000|#FFFFFF|Buenos Aires|',
    'Central Córdoba|Central Cba|2|53|#000000|#FFFFFF|Santiago del Estero|'
  ],
  ar_nacional: [
    'Chacarita Juniors|Chacarita|2|48|#000000|#FFFFFF|Villa Crespo|historic',
    'Atlanta|Atlanta|2|45|#003DA5|#FFD100|Buenos Aires|',
    'Ferro|Ferro|2|47|#007A33|#FFFFFF|Buenos Aires|historic',
    'Quilmes|Quilmes|2|49|#FFFFFF|#003DA5|Quilmes|historic',
    'Almagro|Almagro|2|44|#003DA5|#000000|José Ingenieros|',
    'San Martín Tucumán|SM Tucumán|2|50|#E30613|#FFFFFF|Tucumán|',
    'Deportivo Morón|Morón|2|46|#E30613|#FFFFFF|Morón|',
    'Agropecuario|Agropecuario|1|42|#007A33|#FFFFFF|Carlos Casares|',
    'Estudiantes Río Cuarto|Estudiantes RC|2|45|#003DA5|#FFFFFF|Río Cuarto|',
    'Defensores de Belgrano|Defensores|2|44|#E30613|#000000|Buenos Aires|',
    'Nueva Chicago|Chicago|2|46|#000000|#007A33|Buenos Aires|',
    'Temperley|Temperley|2|45|#003DA5|#FFFFFF|Temperley|',
    'All Boys|All Boys|2|44|#FFFFFF|#003DA5|Buenos Aires|',
    'Brown Adrogué|Brown|1|41|#003DA5|#FFFFFF|Adrogué|',
    'Guillermo Brown|Guillermo Brown|1|40|#003DA5|#FFFFFF|Puerto Madryn|',
    'Mitre Santiago|Mitre|2|43|#FFFFFF|#003DA5|Santiago del Estero|',
    'Gimnasia Mendoza|Gimnasia MZA|2|47|#FFFFFF|#003DA5|Mendoza|',
    'Independiente Rivadavia|Ind. Rivadavia|3|54|#003DA5|#FFFFFF|Mendoza|'
  ],
  br_serie_a: [
    'Ceará|Ceará|4|66|#000000|#FFFFFF|Fortaleza|',
    'Fortaleza|Fortaleza|4|68|#E30613|#003DA5|Fortaleza|',
    'Sport Recife|Sport|4|65|#E30613|#000000|Recife|',
    'Vitória|Vitória|3|62|#E30613|#000000|Salvador|',
    'Cuiabá|Cuiabá|3|58|#007A33|#FFD100|Cuiabá|',
    'Juventude|Juventude|3|57|#007A33|#FFFFFF|Caxias do Sul|'
  ],
  br_serie_b: [
    'Goiás|Goiás|3|58|#007A33|#FFFFFF|Goiânia|',
    'Guarani|Guarani|3|56|#007A33|#FFFFFF|Campinas|',
    'Ponte Preta|Ponte Preta|3|55|#FFFFFF|#000000|Campinas|',
    'CRB|CRB|2|52|#E30613|#FFFFFF|Maceió|',
    'Operário-PR|Operário|2|50|#000000|#FFFFFF|Ponta Grossa|',
    'Amazonas|Amazonas|2|49|#FFD100|#000000|Manaus|',
    'Paysandu|Paysandu|3|54|#003DA5|#FFFFFF|Belém|',
    'Remo|Remo|3|53|#003DA5|#FFFFFF|Belém|',
    'Novorizontino|Novorizontino|2|51|#FFD100|#000000|Novo Horizonte|',
    'Avaí|Avaí|3|55|#003DA5|#FFFFFF|Florianópolis|',
    'Chapecoense|Chapecoense|3|57|#007A33|#FFFFFF|Chapecó|historic',
    'Criciúma|Criciúma|3|56|#FFD100|#000000|Criciúma|',
    'Vila Nova|Vila Nova|2|52|#E30613|#FFFFFF|Goiânia|',
    'América-RN|América RN|2|48|#E30613|#FFFFFF|Natal|',
    'Botafogo-SP|Botafogo SP|2|50|#FFFFFF|#000000|Ribeirão Preto|',
    'Ituano|Ituano|2|49|#E30613|#000000|Itu|',
    'Amazonas FC B|Amazonas B|1|38|#FFD100|#000000|Manaus|',
    'Tombense|Tombense|2|47|#E30613|#FFFFFF|Tombos|'
  ],
  uy_primera: [
    'Liverpool Montevideo|Liverpool|3|58|#003DA5|#000000|Montevideo|',
    'Montevideo City Torque|Torque|2|52|#7B2D8E|#FFFFFF|Montevideo|',
    'Racing Montevideo|Racing UY|2|54|#82C91E|#FFFFFF|Montevideo|',
    'Cerro Largo|Cerro Largo|2|50|#003DA5|#FFFFFF|Melo|',
    'Boston River|Boston River|2|51|#E30613|#FFFFFF|Montevideo|',
    'Progreso|Progreso|2|48|#E30613|#FFD100|Montevideo|'
  ],
  uy_segunda: [
    'Albion|Albion|1|40|#003DA5|#FFFFFF|Montevideo|',
    'Atenas|Atenas|1|39|#003DA5|#FFFFFF|San Carlos|',
    'Juventud Las Piedras|Juventud|2|44|#007A33|#FFFFFF|Las Piedras|',
    'Rampla Juniors|Rampla|2|45|#E30613|#007A33|Montevideo|historic',
    'Sud América|Sud América|1|38|#FF6600|#003DA5|Montevideo|',
    'Villa Española|Villa Española|1|37|#E30613|#FFFFFF|Montevideo|'
  ],
  cl_primera: [
    'Cobresal|Cobresal|2|52|#FF6600|#003DA5|El Salvador|',
    'Huachipato|Huachipato|3|56|#003DA5|#000000|Talcahuano|',
    'Everton Viña|Everton|3|55|#003DA5|#FFD100|Viña del Mar|',
    'Ñublense|Ñublense|2|53|#E30613|#FFFFFF|Chillán|',
    'Deportes Copiapó|Copiapó|2|48|#FFFFFF|#003DA5|Copiapó|',
    'Unión La Calera|La Calera|2|51|#E30613|#FFFFFF|La Calera|'
  ],
  cl_primera_b: [
    'Santiago Wanderers|Wanderers|2|50|#007A33|#FFFFFF|Valparaíso|historic',
    'Magallanes|Magallanes|2|48|#003DA5|#FFFFFF|San Bernardo|',
    'San Luis Quillota|San Luis|2|45|#FFFFFF|#003DA5|Quillota|',
    'Rangers Talca|Rangers|2|46|#000000|#FFFFFF|Talca|',
    'Deportes Temuco|Temuco|2|47|#FFFFFF|#007A33|Temuco|',
    'Barnechea|Barnechea|1|40|#003DA5|#FFFFFF|Lo Barnechea|'
  ],
  co_primera: [
    'Once Caldas|Once Caldas|3|58|#FFFFFF|#007A33|Manizales|',
    'Independiente Medellín|Medellín|4|64|#E30613|#003DA5|Medellín|',
    'Deportes Tolima|Tolima|4|62|#E30613|#FFD100|Ibagué|',
    'La Equidad|Equidad|3|54|#007A33|#FFFFFF|Bogotá|',
    'Águilas Doradas|Águilas|3|55|#FFD100|#000000|Rionegro|',
    'Alianza FC|Alianza|2|52|#FFD100|#003DA5|Valledupar|'
  ],
  co_primera_b: [
    'Patriotas|Patriotas|2|46|#E30613|#007A33|Tunja|',
    'Real Cartagena|Cartagena|2|45|#FFD100|#003DA5|Cartagena|',
    'Cúcuta Deportivo|Cúcuta|2|48|#E30613|#000000|Cúcuta|historic',
    'Llaneros|Llaneros|2|44|#007A33|#FFFFFF|Villavicencio|',
    'Orsomarso|Orsomarso|1|40|#003DA5|#FFFFFF|Palmira|',
    'Real Santander|R. Santander|1|39|#E30613|#FFFFFF|Floridablanca|'
  ],
  mx_liga_mx: [
    'Santos Laguna|Santos|4|68|#007A33|#FFFFFF|Torreón|',
    'León|León|4|70|#007A33|#FFFFFF|León|',
    'Necaxa|Necaxa|3|60|#E30613|#FFFFFF|Aguascalientes|',
    'Querétaro|Querétaro|3|58|#003DA5|#000000|Querétaro|',
    'FC Juárez|Juárez|3|56|#007A33|#000000|Ciudad Juárez|',
    'Mazatlán|Mazatlán|2|54|#7B2D8E|#FFFFFF|Mazatlán|'
  ],
  mx_expansion: [
    'Atlante|Atlante|3|54|#E30613|#003DA5|Cancún|historic',
    'Celaya|Celaya|2|48|#003DA5|#FFFFFF|Celaya|',
    'Cancún FC|Cancún|2|47|#FF6600|#003DA5|Cancún|',
    'Venados|Venados|2|46|#FFD100|#E30613|Mérida|',
    'Alebrijes|Alebrijes|2|45|#7B2D8E|#FFD100|Oaxaca|',
    'Tepatitlán|Tepatitlán|2|44|#E30613|#FFFFFF|Tepatitlán|'
  ],
  us_mls: [
    'Charlotte FC|Charlotte|3|58|#003DA5|#FFFFFF|Charlotte|',
    'St. Louis City|St. Louis|3|57|#E30613|#003DA5|St. Louis|',
    'Nashville SC|Nashville|3|59|#FFD100|#003DA5|Nashville|',
    'FC Cincinnati|Cincinnati|4|62|#003DA5|#FF6600|Cincinnati|',
    'Austin FC|Austin|3|56|#007A33|#000000|Austin|',
    'Inter Miami|Inter Miami|4|66|#F5B5C8|#000000|Miami|'
  ],
  us_usl: [
    'Louisville City|Louisville|2|48|#7B2D8E|#FFFFFF|Louisville|',
    'Phoenix Rising|Phoenix|2|47|#E30613|#000000|Phoenix|',
    'Sacramento Republic|Sacramento|2|46|#7B2D8E|#FFFFFF|Sacramento|',
    'Tampa Bay Rowdies|Rowdies|2|45|#007A33|#FFD100|Tampa|',
    'Orange County SC|Orange County|2|44|#FF6600|#000000|Irvine|',
    'El Paso Locomotive|El Paso|2|43|#003DA5|#FFFFFF|El Paso|'
  ],
  gb_championship: [
    'Leeds United|Leeds|5|74|#FFFFFF|#003DA5|Leeds|historic',
    'Leicester City|Leicester|5|76|#003DA5|#FFFFFF|Leicester|',
    'Southampton|Southampton|4|72|#E30613|#FFFFFF|Southampton|',
    'Norwich City|Norwich|4|68|#FFD100|#007A33|Norwich|',
    'Middlesbrough|Boro|4|66|#E30613|#FFFFFF|Middlesbrough|',
    'Sheffield United|Sheffield Utd|4|67|#E30613|#FFFFFF|Sheffield|',
    'Coventry City|Coventry|3|62|#003DA5|#FFFFFF|Coventry|',
    'Watford|Watford|4|65|#FFD100|#000000|Watford|',
    'Birmingham City|Birmingham|3|63|#003DA5|#FFFFFF|Birmingham|',
    'West Brom|West Brom|4|66|#003DA5|#FFFFFF|West Bromwich|',
    'Swansea City|Swansea|3|64|#FFFFFF|#000000|Swansea|',
    'Hull City|Hull|3|60|#FF6600|#000000|Hull|'
  ],
  es_segunda: [
    'Espanyol|Espanyol|4|70|#003DA5|#FFFFFF|Barcelona|',
    'Real Oviedo|Oviedo|3|62|#003DA5|#FFFFFF|Oviedo|',
    'Sporting Gijón|Sporting|3|63|#E30613|#FFFFFF|Gijón|',
    'Zaragoza|Zaragoza|4|65|#FFFFFF|#003DA5|Zaragoza|historic',
    'Tenerife|Tenerife|3|58|#FFFFFF|#003DA5|Santa Cruz|',
    'Racing Santander|Racing SAN|3|60|#007A33|#FFFFFF|Santander|',
    'Albacete|Albacete|2|55|#FFFFFF|#000000|Albacete|',
    'Eibar|Eibar|3|58|#7B2D8E|#E30613|Eibar|',
    'Mirandés|Mirandés|2|54|#E30613|#000000|Miranda de Ebro|',
    'Levante|Levante|4|64|#E30613|#003DA5|Valencia|'
  ],
  it_serie_b: [
    'Palermo|Palermo|4|66|#E30613|#FFD100|Palermo|historic',
    'Sampdoria|Sampdoria|4|68|#003DA5|#FFFFFF|Genova|historic',
    'Bari|Bari|3|60|#FFFFFF|#E30613|Bari|',
    'Brescia|Brescia|3|58|#003DA5|#FFFFFF|Brescia|',
    'Spezia|Spezia|3|61|#FFFFFF|#000000|La Spezia|',
    'Pisa|Pisa|3|57|#003DA5|#000000|Pisa|',
    'Modena|Modena|2|55|#FFD100|#003DA5|Modena|',
    'Cosenza|Cosenza|2|52|#003DA5|#E30613|Cosenza|',
    'Reggiana|Reggiana|2|53|#A52A2A|#FFFFFF|Reggio Emilia|',
    'Frosinone|Frosinone|3|59|#FFD100|#003DA5|Frosinone|'
  ],
  de_2bundesliga: [
    'Hamburger SV|HSV|5|74|#003DA5|#FFFFFF|Hamburg|historic',
    'Schalke 04|Schalke|5|73|#003DA5|#FFFFFF|Gelsenkirchen|historic',
    'Hertha BSC|Hertha|4|68|#003DA5|#FFFFFF|Berlin|',
    'Hannover 96|Hannover|3|62|#E30613|#000000|Hannover|',
    'Kaiserslautern|Lautern|3|61|#E30613|#FFFFFF|Kaiserslautern|historic',
    'Nürnberg|Nürnberg|3|60|#A52A2A|#FFFFFF|Nürnberg|',
    'Magdeburg|Magdeburg|2|55|#003DA5|#FFFFFF|Magdeburg|',
    'Elversberg|Elversberg|2|52|#FFFFFF|#000000|Spiesen-Elversberg|',
    'Greuther Fürth|Fürth|3|58|#007A33|#FFFFFF|Fürth|',
    'Paderborn|Paderborn|3|57|#003DA5|#000000|Paderborn|'
  ],
  fr_ligue2: [
    'Saint-Étienne|ASSE|4|70|#007A33|#FFFFFF|Saint-Étienne|historic',
    'Bordeaux|Bordeaux|3|64|#003DA5|#FFFFFF|Bordeaux|historic',
    'Caen|Caen|3|58|#E30613|#003DA5|Caen|',
    'Guingamp|Guingamp|3|57|#E30613|#000000|Guingamp|',
    'Grenoble|Grenoble|2|54|#003DA5|#FFFFFF|Grenoble|',
    'Amiens|Amiens|2|55|#FFFFFF|#000000|Amiens|',
    'Bastia|Bastia|3|56|#003DA5|#FFFFFF|Bastia|',
    'Pau FC|Pau|2|52|#FFD100|#003DA5|Pau|',
    'Rodez|Rodez|2|51|#E30613|#FFD100|Rodez|',
    'Laval|Laval|2|50|#FF6600|#000000|Laval|'
  ],
  pt_liga2: [
    'FC Porto B|Porto B|2|52|#003DA5|#FFFFFF|Porto|youth_factory',
    'Benfica B|Benfica B|2|53|#E30613|#FFFFFF|Lisboa|youth_factory',
    'Sporting B|Sporting B|2|51|#007A33|#FFFFFF|Lisboa|youth_factory',
    'Académico Viseu|Viseu|2|48|#000000|#FFFFFF|Viseu|',
    'Mafra|Mafra|2|47|#007A33|#FFFFFF|Mafra|',
    'Torreense|Torreense|2|46|#E30613|#FFFFFF|Torres Vedras|',
    'Paços de Ferreira|Paços|3|54|#FFD100|#007A33|Paços de Ferreira|',
    'Feirense|Feirense|2|49|#003DA5|#FFFFFF|Santa Maria da Feira|',
    'Leixões|Leixões|2|48|#E30613|#FFFFFF|Matosinhos|',
    'Penafiel|Penafiel|2|45|#E30613|#000000|Penafiel|'
  ],
  nl_eerste: [
    'Jong Ajax|Jong Ajax|2|55|#E30613|#FFFFFF|Amsterdam|youth_factory',
    'Jong PSV|Jong PSV|2|54|#E30613|#FFFFFF|Eindhoven|youth_factory',
    'Cambuur|Cambuur|3|56|#FFD100|#003DA5|Leeuwarden|',
    'De Graafschap|De Graafschap|2|53|#003DA5|#FFFFFF|Doetinchem|',
    'Emmen|Emmen|2|52|#E30613|#FFFFFF|Emmen|',
    'VVV-Venlo|VVV|2|51|#FFD100|#000000|Venlo|',
    'Telstar|Telstar|2|48|#FFFFFF|#003DA5|Velsen|',
    'Helmond Sport|Helmond|1|45|#000000|#FFFFFF|Helmond|',
    'ADO Den Haag|ADO|3|57|#FFD100|#007A33|The Hague|',
    'NAC Breda|NAC|3|58|#FFD100|#000000|Breda|'
  ],
  be_challenger: [
    'Beerschot|Beerschot|3|55|#7B2D8E|#FFFFFF|Antwerp|',
    'Lierse K|Lierse|2|50|#FFD100|#000000|Lier|',
    'Patro Eisden|Patro|2|47|#003DA5|#FFFFFF|Maasmechelen|',
    'Lokeren-Temse|Lokeren|2|48|#FFFFFF|#000000|Lokeren|',
    'Zulte Waregem|Zulte|3|56|#E30613|#FFFFFF|Waregem|',
    'RFC Seraing|Seraing|2|46|#000000|#E30613|Seraing|'
  ],
  tr_1lig: [
    'Bandırmaspor|Bandırma|2|50|#E30613|#FFFFFF|Bandırma|',
    'Boluspor|Bolu|2|49|#E30613|#FFFFFF|Bolu|',
    'Erzurumspor|Erzurum|2|51|#003DA5|#FFFFFF|Erzurum|',
    'Ümraniyespor|Ümraniye|2|48|#E30613|#FFFFFF|Istanbul|',
    'Eyüpspor|Eyüp|3|58|#7B2D8E|#FFD100|Istanbul|',
    'Göztepe|Göztepe|3|60|#E30613|#FFD100|Izmir|'
  ],
  tr_super: [
    'Çaykur Rizespor|Rize|3|60|#007A33|#003DA5|Rize|',
    'Sivasspor|Sivas|3|58|#E30613|#FFFFFF|Sivas|',
    'Kayserispor|Kayseri|3|57|#FFD100|#E30613|Kayseri|',
    'Alanyaspor|Alanya|3|56|#FF6600|#007A33|Alanya|'
  ],
  at_bundesliga: [
    'Rapid Wien|Rapid|4|66|#007A33|#FFFFFF|Vienna|',
    'Austria Wien|Austria Wien|4|64|#7B2D8E|#FFFFFF|Vienna|',
    'Sturm Graz|Sturm|4|65|#000000|#FFFFFF|Graz|',
    'LASK|LASK|3|62|#000000|#FFFFFF|Linz|'
  ],
  at_2liga: [
    'Blau-Weiß Linz|BW Linz|2|50|#003DA5|#FFFFFF|Linz|',
    'First Vienna|First Vienna|2|48|#003DA5|#FFD100|Vienna|',
    'Admira|Admira|2|49|#000000|#FFFFFF|Maria Enzersdorf|',
    'Kapfenberg|Kapfenberg|1|42|#FFFFFF|#E30613|Kapfenberg|'
  ],
  ch_super: [
    'Young Boys|Young Boys|5|74|#FFD100|#000000|Bern|',
    'Basel|Basel|4|70|#E30613|#003DA5|Basel|',
    'Zürich|Zürich|4|66|#003DA5|#FFFFFF|Zürich|',
    'Lugano|Lugano|3|60|#000000|#FFFFFF|Lugano|',
    'Servette|Servette|3|61|#A52A2A|#FFFFFF|Geneva|'
  ],
  ch_challenge: [
    'Aarau|Aarau|2|50|#000000|#FFFFFF|Aarau|',
    'Schaffhausen|Schaffhausen|2|46|#003DA5|#FFFFFF|Schaffhausen|',
    'Wil|Wil|2|45|#FFFFFF|#000000|Wil|',
    'Vaduz|Vaduz|2|48|#E30613|#FFFFFF|Vaduz|'
  ],
  gr_super: [
    'Olympiacos|Olympiacos|5|76|#E30613|#FFFFFF|Piraeus|giant',
    'Panathinaikos|Panathinaikos|5|74|#007A33|#FFFFFF|Athens|giant',
    'AEK Athens|AEK|5|73|#FFD100|#000000|Athens|giant',
    'PAOK|PAOK|5|72|#000000|#FFFFFF|Thessaloniki|giant',
    'Aris|Aris|3|60|#FFD100|#000000|Thessaloniki|'
  ],
  gr_super2: [
    'Levadiakos|Levadiakos|2|48|#007A33|#FFFFFF|Livadeia|',
    'Ionikos|Ionikos|2|46|#003DA5|#FFFFFF|Nikaia|',
    'Kallithea|Kallithea|2|45|#003DA5|#FFFFFF|Kallithea|',
    'Kalamata|Kalamata|1|42|#000000|#FFFFFF|Kalamata|'
  ],
  se_allsvenskan: [
    'Malmö FF|Malmö|4|68|#003DA5|#FFFFFF|Malmö|',
    'AIK|AIK|3|62|#000000|#FFD100|Stockholm|',
    'Djurgården|Djurgården|3|61|#003DA5|#FFFFFF|Stockholm|',
    'Hammarby|Hammarby|3|60|#007A33|#FFFFFF|Stockholm|'
  ],
  se_superettan: [
    'Öster|Öster|2|50|#E30613|#003DA5|Växjö|',
    'Landskrona|Landskrona|2|48|#FFFFFF|#003DA5|Landskrona|',
    'Örebro|Örebro|2|49|#000000|#FFFFFF|Örebro|',
    'Helsingborg|Helsingborg|2|51|#E30613|#003DA5|Helsingborg|'
  ],
  no_eliteserien: [
    'Bodø/Glimt|Bodø/Glimt|4|70|#FFD100|#000000|Bodø|',
    'Rosenborg|Rosenborg|4|66|#FFFFFF|#000000|Trondheim|',
    'Molde|Molde|4|65|#003DA5|#FFFFFF|Molde|',
    'Brann|Brann|3|60|#E30613|#FFFFFF|Bergen|'
  ],
  no_obos: [
    'Start|Start|2|50|#FFD100|#000000|Kristiansand|',
    'Kongsvinger|Kongsvinger|2|46|#E30613|#FFFFFF|Kongsvinger|',
    'Ranheim|Ranheim|2|45|#003DA5|#FFFFFF|Trondheim|',
    'Sogndal|Sogndal|2|47|#FFFFFF|#003DA5|Sogndal|'
  ],
  dk_superliga: [
    'FC København|FCK|5|74|#FFFFFF|#003DA5|Copenhagen|',
    'Midtjylland|Midtjylland|4|70|#000000|#E30613|Herning|',
    'Brøndby|Brøndby|4|68|#FFD100|#003DA5|Brøndby|',
    'Nordsjælland|Nordsjælland|3|62|#E30613|#FFFFFF|Farum|youth_factory',
    'Vejle|Vejle|2|54|#E30613|#FFFFFF|Vejle|'
  ],
  dk_1div: [
    'Hobro|Hobro|2|46|#007A33|#FFFFFF|Hobro|',
    'Hillerød|Hillerød|1|42|#003DA5|#FFFFFF|Hillerød|',
    'Kolding|Kolding|2|48|#003DA5|#FFFFFF|Kolding|',
    'Hvidovre|Hvidovre|2|47|#E30613|#FFFFFF|Hvidovre|'
  ],
  pl_ekstraklasa: [
    'Legia Warszawa|Legia|4|68|#007A33|#FFFFFF|Warsaw|',
    'Lech Poznań|Lech|4|66|#003DA5|#FFFFFF|Poznań|',
    'Raków|Rakow|4|64|#E30613|#003DA5|Częstochowa|',
    'Jagiellonia|Jagiellonia|3|60|#FFD100|#E30613|Białystok|'
  ],
  pl_1liga: [
    'Wisła Kraków|Wisła|3|58|#E30613|#003DA5|Kraków|historic',
    'GKS Katowice|Katowice|2|50|#FFD100|#007A33|Katowice|',
    'Arka Gdynia|Arka|2|49|#FFD100|#003DA5|Gdynia|',
    'Miedź Legnica|Miedź|2|48|#007A33|#FFFFFF|Legnica|'
  ],
  sct_prem: [
    'Hearts|Hearts|4|64|#A52A2A|#FFFFFF|Edinburgh|',
    'Hibernian|Hibs|3|60|#007A33|#FFFFFF|Edinburgh|',
    'Aberdeen|Aberdeen|3|62|#FF0000|#FFFFFF|Aberdeen|'
  ],
  sct_championship: [
    'Dundee United|Dundee Utd|3|56|#FF6600|#000000|Dundee|',
    'Partick Thistle|Partick|2|50|#E30613|#FFD100|Glasgow|',
    'Raith Rovers|Raith|2|48|#003DA5|#FFFFFF|Kirkcaldy|',
    'Ayr United|Ayr|2|47|#FFFFFF|#000000|Ayr|',
    'Greenock Morton|Morton|2|46|#003DA5|#FFFFFF|Greenock|',
    "Queen's Park|Queen's Park|2|45|#FFFFFF|#000000|Glasgow|"
  ],
  ie_premier: [
    'Shamrock Rovers|Shamrock|3|56|#007A33|#FFFFFF|Dublin|',
    'Bohemians|Bohemians|2|52|#E30613|#000000|Dublin|',
    'Derry City|Derry|2|51|#E30613|#FFFFFF|Derry|',
    'Shelbourne|Shelbourne|2|50|#E30613|#FFFFFF|Dublin|',
    'Galway United|Galway|2|49|#A52A2A|#FFFFFF|Galway|',
    'St Patrick\'s Athletic|St Pats|2|51|#E30613|#FFFFFF|Dublin|'
  ],
  ie_first: [
    'Cork City|Cork|2|48|#007A33|#FFFFFF|Cork|',
    'Waterford|Waterford|2|46|#003DA5|#FFFFFF|Waterford|',
    'Athlone Town|Athlone|1|40|#003DA5|#FFFFFF|Athlone|',
    'Treaty United|Treaty|1|41|#E30613|#FFFFFF|Limerick|'
  ],
  ua_premier: [
    'Shakhtar Donetsk|Shakhtar|5|78|#FF6600|#000000|Donetsk|giant',
    'Dynamo Kyiv|Dynamo|5|76|#003DA5|#FFFFFF|Kyiv|giant',
    'Dnipro-1|Dnipro-1|3|60|#003DA5|#FFFFFF|Dnipro|',
    'Polissya|Polissya|3|56|#007A33|#FFFFFF|Zhytomyr|'
  ],
  ua_persha: [
    'Metalist 1925|Metalist|2|50|#003DA5|#FFD100|Kharkiv|',
    'Karpaty|Karpaty|2|52|#007A33|#FFFFFF|Lviv|',
    'Obolon|Obolon|2|48|#007A33|#FFFFFF|Kyiv|',
    'Livyi Bereh|Livyi Bereh|1|44|#003DA5|#FFFFFF|Kyiv|'
  ],
  rs_superliga: [
    'Red Star Belgrade|Crvena Zvezda|5|74|#E30613|#FFFFFF|Belgrade|giant',
    'Partizan|Partizan|5|72|#000000|#FFFFFF|Belgrade|giant',
    'Vojvodina|Vojvodina|3|58|#E30613|#FFFFFF|Novi Sad|',
    'TSC|TSC|3|56|#003DA5|#FFFFFF|Bačka Topola|'
  ],
  rs_prva: [
    'Radnički Niš|Radnički|2|50|#E30613|#FFFFFF|Niš|',
    'Javor|Javor|2|46|#007A33|#FFFFFF|Ivanjica|',
    'Macva|Macva|1|42|#003DA5|#FFFFFF|Šabac|',
    'Grafičar|Grafičar|1|41|#E30613|#FFFFFF|Belgrade|'
  ],
  hr_hnl: [
    'Dinamo Zagreb|Dinamo|5|74|#003DA5|#FFFFFF|Zagreb|giant',
    'Hajduk Split|Hajduk|4|68|#FFFFFF|#003DA5|Split|historic',
    'Rijeka|Rijeka|4|64|#FFFFFF|#003DA5|Rijeka|',
    'Osijek|Osijek|3|58|#003DA5|#FFFFFF|Osijek|',
    'Lokomotiva|Lokomotiva|2|52|#003DA5|#FFFFFF|Zagreb|'
  ],
  hr_prva_nl: [
    'Varaždin|Varaždin|2|48|#003DA5|#FFFFFF|Varaždin|',
    'Cibalia|Cibalia|2|45|#003DA5|#FFFFFF|Vinkovci|',
    'Sesvete|Sesvete|1|40|#E30613|#FFFFFF|Zagreb|',
    'Dugopolje|Dugopolje|1|39|#003DA5|#FFFFFF|Dugopolje|'
  ],
  cz_fortuna: [
    'Slavia Prague|Slavia|5|74|#E30613|#FFFFFF|Prague|giant',
    'Sparta Prague|Sparta|5|73|#A52A2A|#FFFFFF|Prague|giant',
    'Viktoria Plzeň|Plzeň|4|68|#E30613|#003DA5|Plzeň|',
    'Baník Ostrava|Baník|3|58|#003DA5|#FFFFFF|Ostrava|',
    'Sigma Olomouc|Sigma|3|56|#003DA5|#FFFFFF|Olomouc|'
  ],
  cz_fnl: [
    'Zbrojovka Brno|Brno|2|50|#E30613|#FFFFFF|Brno|',
    'Opava|Opava|2|46|#003DA5|#FFFFFF|Opava|',
    'Varnsdorf|Varnsdorf|1|40|#003DA5|#FFFFFF|Varnsdorf|',
    'Líšeň|Líšeň|1|41|#E30613|#FFFFFF|Brno|'
  ],
  jp_j1: [
    'Shimizu S-Pulse|Shimizu|3|58|#FF6600|#FFFFFF|Shizuoka|',
    'Avispa Fukuoka|Avispa|3|55|#003DA5|#FFFFFF|Fukuoka|',
    'Albirex Niigata|Albirex|2|52|#FF6600|#003DA5|Niigata|'
  ],
  jp_j2: [
    'Yokohama FC|Yokohama FC|2|52|#003DA5|#FFFFFF|Yokohama|',
    'JEF United|JEF|2|50|#007A33|#FFD100|Chiba|',
    'Montedio Yamagata|Yamagata|2|48|#003DA5|#FFFFFF|Yamagata|',
    'Vegalta Sendai|Sendai|2|51|#FFD100|#003DA5|Sendai|',
    'Tokyo Verdy|Verdy|3|56|#007A33|#FFFFFF|Tokyo|',
    'Júbilo Iwata|Júbilo|3|55|#003DA5|#FFFFFF|Iwata|'
  ],
  kr_k1: [
    'Suwon Samsung|Suwon|3|58|#003DA5|#E30613|Suwon|',
    'Jeonbuk Hyundai|Jeonbuk|4|64|#007A33|#FFFFFF|Jeonju|',
    'Gimcheon Sangmu|Sangmu|3|55|#E30613|#000000|Gimcheon|'
  ],
  kr_k2: [
    'Seoul E-Land|E-Land|2|48|#003DA5|#FFFFFF|Seoul|',
    'Busan IPark|Busan|2|50|#E30613|#FFFFFF|Busan|',
    'Gyeongnam|Gyeongnam|2|47|#E30613|#FFFFFF|Changwon|',
    'Chungnam Asan|Asan|2|45|#FFD100|#003DA5|Asan|'
  ],
  cn_csl: [
    'Shanghai Port|Port|4|66|#E30613|#FFFFFF|Shanghai|',
    'Shandong Taishan|Taishan|4|64|#FF6600|#FFFFFF|Jinan|',
    'Beijing Guoan|Guoan|3|62|#007A33|#FFFFFF|Beijing|',
    'Chengdu Rongcheng|Chengdu|3|58|#E30613|#003DA5|Chengdu|'
  ],
  cn_league1: [
    'Meizhou Hakka|Meizhou|2|48|#E30613|#FFFFFF|Meizhou|',
    'Yunnan Yukun|Yunnan|2|47|#007A33|#FFFFFF|Yuxi|',
    'Guangzhou|Guangzhou|2|50|#E30613|#FFFFFF|Guangzhou|historic',
    'Dalian Yingbo|Dalian|2|46|#003DA5|#FFFFFF|Dalian|'
  ],
  sa_pro: [
    'Al-Fayha|Fayha|3|56|#FF6600|#003DA5|Al Majmaah|',
    'Al-Okhdood|Okhdood|2|52|#FFD100|#003DA5|Najran|',
    'Al-Riyadh|Riyadh|2|54|#7B2D8E|#FFFFFF|Riyadh|',
    'Al-Khaleej|Khaleej|2|53|#FFD100|#007A33|Saihat|'
  ],
  sa_first: [
    'Al-Ettifaq|Ettifaq|3|58|#007A33|#FFFFFF|Dammam|',
    'Al-Qadsiah B|Qadsiah B|1|40|#FFD100|#003DA5|Khobar|',
    'Al-Jabalain|Jabalain|2|46|#003DA5|#FFFFFF|Hail|',
    'Al-Arabi SA|Arabi SA|2|45|#007A33|#FFFFFF|Unaizah|'
  ],
  ae_pro: [
    'Shabab Al Ahli|Shabab|4|64|#E30613|#FFFFFF|Dubai|',
    'Al Wasl|Wasl|3|60|#FFD100|#000000|Dubai|',
    'Al Nasr Dubai|Nasr Dubai|3|58|#003DA5|#FFFFFF|Dubai|'
  ],
  ae_first: [
    'Khor Fakkan|Khor Fakkan|2|46|#FF6600|#003DA5|Khor Fakkan|',
    'Al Arabi UAE|Arabi UAE|2|44|#E30613|#FFFFFF|Umm Al Quwain|',
    'Dibba Al Fujairah|Dibba|2|43|#003DA5|#FFFFFF|Fujairah|',
    'Al Hamriyah|Hamriyah|1|40|#007A33|#FFFFFF|Sharjah|'
  ],
  qa_stars: [
    'Al-Arabi|Arabi|3|58|#E30613|#FFFFFF|Doha|',
    'Al-Wakrah|Wakrah|3|56|#A52A2A|#FFFFFF|Al Wakrah|',
    'Umm Salal|Umm Salal|2|52|#FF6600|#FFFFFF|Umm Salal|'
  ],
  au_aleague: [
    'Melbourne City|Melbourne City|3|58|#82C91E|#FFFFFF|Melbourne|',
    'Sydney FC|Sydney|3|60|#003DA5|#FFFFFF|Sydney|',
    'Western United|Western Utd|2|52|#007A33|#000000|Melbourne|',
    'Macarthur FC|Macarthur|2|50|#FF6600|#000000|Sydney|'
  ],
  au_npl: [
    'API A Leichhardt|API A|1|40|#A52A2A|#FFFFFF|Sydney|',
    'Oakleigh Cannons|Oakleigh|1|39|#003DA5|#FFFFFF|Melbourne|',
    'Heidelberg United|Heidelberg|1|41|#FFD100|#000000|Melbourne|',
    'Sydney United 58|Sydney Utd|1|40|#E30613|#FFFFFF|Sydney|'
  ],
  pe_liga1: [
    'Alianza Lima|Alianza|4|66|#003DA5|#FFFFFF|Lima|',
    'Universitario|Universitario|4|67|#A52A2A|#FFFFFF|Lima|',
    'Sporting Cristal|Cristal|4|65|#82C91E|#003DA5|Lima|',
    'Melgar|Melgar|3|58|#E30613|#000000|Arequipa|',
    'Cienciano|Cienciano|3|56|#E30613|#FFFFFF|Cusco|'
  ],
  pe_liga2: [
    'AD Tarma|Tarma|2|44|#003DA5|#FFFFFF|Tarma|',
    'Comerciantes Unidos|Comerciantes|2|43|#E30613|#FFFFFF|Cutervo|',
    'Juan Aurich|Juan Aurich|2|45|#FFD100|#000000|Chiclayo|',
    'Deportivo Coopsol|Coopsol|1|40|#003DA5|#FFFFFF|Lima|'
  ],
  ec_serie_a: [
    'Barcelona SC|Barcelona SC|4|68|#FFD100|#000000|Guayaquil|',
    'Emelec|Emelec|4|66|#003DA5|#FFFFFF|Guayaquil|',
    'LDU Quito|LDU|4|67|#FFFFFF|#000000|Quito|',
    'Independiente del Valle|IDV|4|70|#000000|#003DA5|Sangolquí|youth_factory',
    'Aucas|Aucas|3|58|#FFD100|#E30613|Quito|'
  ],
  ec_serie_b: [
    'Mushuc Runa|Mushuc|2|46|#003DA5|#FFFFFF|Ambato|',
    'Guayaquil City|Gye City|2|45|#003DA5|#FFFFFF|Guayaquil|',
    'Imbabura|Imbabura|2|44|#007A33|#FFFFFF|Ibarra|',
    'Chacaritas|Chacaritas|1|40|#E30613|#FFFFFF|Pelileo|'
  ],
  py_primera: [
    'Olimpia|Olimpia|5|72|#FFFFFF|#000000|Asunción|giant',
    'Cerro Porteño|Cerro|5|71|#E30613|#003DA5|Asunción|giant',
    'Libertad|Libertad|4|68|#FFFFFF|#000000|Asunción|',
    'Guaraní|Guaraní|3|60|#000000|#FFD100|Asunción|',
    'Nacional Asunción|Nacional PY|3|58|#003DA5|#FFFFFF|Asunción|'
  ],
  py_intermedia: [
    'Resistencia|Resistencia|2|44|#E30613|#FFFFFF|Asunción|',
    'Fernando de la Mora|FDLM|2|43|#003DA5|#FFFFFF|Asunción|',
    '3 de Febrero|3 de Febrero|2|42|#E30613|#FFFFFF|Ciudad del Este|',
    'Independiente CG|Independiente CG|2|45|#E30613|#FFFFFF|Asunción|'
  ],
  ve_primera: [
    'Caracas FC|Caracas|3|58|#E30613|#000000|Caracas|',
    'Deportivo Táchira|Táchira|3|60|#FFD100|#000000|San Cristóbal|',
    'Zamora FC|Zamora|2|52|#FFFFFF|#003DA5|Barinas|',
    'Metropolitanos|Metropolitanos|2|50|#7B2D8E|#FFFFFF|Caracas|',
    'Estudiantes Mérida|Estudiantes MER|2|51|#E30613|#FFFFFF|Mérida|'
  ],
  ve_segunda: [
    'Atlético Venezuela|Atlético VE|1|40|#E30613|#FFFFFF|Caracas|',
    'Ureña|Ureña|1|38|#003DA5|#FFFFFF|Ureña|',
    'Titanes|Titanes|1|39|#000000|#FFD100|Valencia|',
    'Academia Puerto Cabello B|APC B|1|36|#003DA5|#FFFFFF|Puerto Cabello|'
  ],
  bo_primera: [
    'The Strongest|Strongest|4|62|#FFD100|#000000|La Paz|',
    'Bolívar|Bolívar|4|64|#82C91E|#FFFFFF|La Paz|',
    'Always Ready|Always Ready|3|58|#E30613|#FFFFFF|El Alto|',
    'Jorge Wilstermann|Wilstermann|3|56|#E30613|#003DA5|Cochabamba|',
    'Oriente Petrolero|Oriente|3|55|#007A33|#FFFFFF|Santa Cruz|'
  ],
  bo_copa_sb: [
    'Real Tomayapo|Tomayapo|2|42|#E30613|#FFFFFF|Tarija|',
    'GV San José|GV San José|2|44|#003DA5|#FFFFFF|Oruro|',
    'Universitario de Vinto|U. Vinto|2|43|#E30613|#FFFFFF|Vinto|',
    'Nacional Potosí B|Nacional POT B|1|35|#E30613|#FFFFFF|Potosí|'
  ],
  eg_premier: [
    'Al Ahly|Al Ahly|6|82|#E30613|#FFFFFF|Cairo|giant',
    'Zamalek|Zamalek|5|76|#FFFFFF|#E30613|Cairo|giant',
    'Pyramids|Pyramids|4|68|#003DA5|#FFFFFF|Cairo|',
    'Al Masry|Masry|3|58|#007A33|#FFFFFF|Port Said|'
  ],
  eg_second: [
    'ENPPI|ENPPI|2|48|#003DA5|#FFFFFF|Cairo|',
    'El Gouna|El Gouna|2|46|#003DA5|#FFFFFF|El Gouna|',
    'Tala\'ea El Gaish|El Gaish|2|47|#E30613|#FFFFFF|Cairo|',
    'Ismaily|Ismaily|3|54|#FFD100|#003DA5|Ismailia|historic'
  ],
  ma_botola: [
    'Wydad Casablanca|Wydad|5|74|#E30613|#FFFFFF|Casablanca|giant',
    'Raja Casablanca|Raja|5|73|#007A33|#FFFFFF|Casablanca|giant',
    'AS FAR|FAR|4|66|#000000|#007A33|Rabat|',
    'RS Berkane|Berkane|3|60|#FF6600|#000000|Berkane|'
  ],
  ma_botola2: [
    'Olympic Safi|Safi|2|48|#FFFFFF|#003DA5|Safi|',
    'Chabab Mohammédia|Mohammédia|2|46|#E30613|#FFFFFF|Mohammédia|',
    'Youssoufia Berrechid|Berrechid|2|44|#007A33|#FFFFFF|Berrechid|',
    'Rapide Oued Zem|Oued Zem|1|40|#E30613|#FFFFFF|Oued Zem|'
  ],
  za_psl: [
    'Mamelodi Sundowns|Sundowns|5|72|#FFD100|#003DA5|Pretoria|giant',
    'Kaizer Chiefs|Chiefs|4|68|#FFD100|#000000|Johannesburg|',
    'Orlando Pirates|Pirates|4|67|#000000|#FFFFFF|Johannesburg|',
    'SuperSport United|SuperSport|3|58|#003DA5|#FFFFFF|Pretoria|',
    'Stellenbosch|Stellenbosch|3|55|#007A33|#FFFFFF|Stellenbosch|',
    'Cape Town City|Cape Town|3|56|#003DA5|#FFFFFF|Cape Town|'
  ],
  za_motsepe: [
    'Cape Town Spurs|Spurs ZA|2|46|#003DA5|#FFFFFF|Cape Town|',
    'Marumo Gallants|Gallants|2|45|#007A33|#FFFFFF|Polokwane|',
    'Baroka|Baroka|2|44|#FFD100|#007A33|Polokwane|',
    'JDR Stars|JDR|1|40|#E30613|#FFFFFF|Pretoria|'
  ],
  ng_npfl: [
    'Enyimba|Enyimba|3|58|#003DA5|#FFFFFF|Aba|',
    'Kano Pillars|Pillars|3|55|#007A33|#FFFFFF|Kano|',
    'Rivers United|Rivers|3|56|#003DA5|#FFFFFF|Port Harcourt|',
    'Remo Stars|Remo Stars|2|50|#003DA5|#FFFFFF|Ikenne|'
  ],
  ng_nnl: [
    'Shooting Stars|3SC|2|46|#007A33|#FFFFFF|Ibadan|historic',
    'Bendel Insurance|Bendel|2|45|#E30613|#FFFFFF|Benin City|',
    'Heartland|Heartland|2|44|#E30613|#FFFFFF|Owerri|',
    'Mighty Jets|Mighty Jets|1|38|#003DA5|#FFFFFF|Jos|'
  ]
};
