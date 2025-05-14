import json
import re

def correct_text_globally(text):
    """Corrects accents and other orthographic issues in a given text string."""
    
    # Order of corrections can be important. More specific or longer phrases first.
    corrections = {
        # Common phrases / Typos / Formatting improvements
        "CONTIENE A: Apellido del ex defensor argentino, capitan del Inter campeon de la Champions 2010?": "CONTIENE A: ¿Cuál es el apellido del ex defensor argentino, capitán del Inter campeón de la Champions 2010?",
        "CONTIENE A: Apellido del futbolista brasileno, Balon de Oro 2007?": "CONTIENE A: ¿Cuál es el apellido del futbolista brasileño, Balón de Oro 2007?",
        "CONTIENE A: Apellido del futbolista brasileno, leyenda del AC Milan?": "CONTIENE A: ¿Cuál es el apellido del futbolista brasileño, leyenda del AC Milan?",
        "CONTIENE A: Como se llama el estadio de Boca Juniors?": "CONTIENE A: ¿Cómo se llama el estadio de Boca Juniors?",
        "CONTIENE A: Apellido del futbolista noruego del Manchester City, Bota de Oro 2023?": "CONTIENE A: ¿Cuál es el apellido del futbolista noruego del Manchester City, Bota de Oro 2023?",
        "CONTIENE A: Apellido del exfutbolista espanol, leyenda del Barcelona y la seleccion, autor del gol en la final del Mundial 2010?": "CONTIENE A: ¿Cuál es el apellido del exfutbolista español, leyenda del Barcelona y la selección, autor del gol en la final del Mundial 2010?",
        "CONTIENE A: Apellido del legendario defensor italiano, icono del AC Milan?": "CONTIENE A: ¿Cuál es el apellido del legendario defensor italiano, ícono del AC Milan?",
        "CONTIENE A: Apellido del legendario defensor espanol, campeon del mundo 2010, que jugo en Real Madrid y Sevilla?": "CONTIENE A: ¿Cuál es el apellido del legendario defensor español, campeón del mundo 2010, que jugó en el Real Madrid y Sevilla?",
        "CONTIENE B: Nombre completo del mediocampista espanol, tecnico del Bayer Leverkusen campeon invicto 2023/24?": "CONTIENE B: ¿Cuál es el nombre completo del mediocampista español, técnico del Bayer Leverkusen campeón invicto 2023/24?",
        "CONTIENE B: Apellido del ex delantero sueco que jugo en Ajax, Juventus, Inter, Barcelona, Milan, PSG y Man Utd.": "CONTIENE B: ¿Cuál es el apellido del ex delantero sueco que jugó en Ajax, Juventus, Inter, Barcelona, Milan, PSG y Manchester United?",
        "CONTIENE B: Nombre completo del arquero brasileno del Liverpool.": "CONTIENE B: ¿Cuál es el nombre completo del arquero brasileño del Liverpool?",
        "CONTIENE B: Apellido del delantero gabones ex Arsenal?": "CONTIENE B: ¿Cuál es el apellido del delantero gabonés ex Arsenal?",
        "CONTIENE B: Apellido del mediocampista espanol, tecnico del Bayer Leverkusen campeon invicto 2023/24?": "CONTIENE B: ¿Cuál es el apellido del mediocampista español, técnico del Bayer Leverkusen campeón invicto 2023/24?", # Duplicates previous?
        "CONTIENE C: Apellido del mediocampista croata del Real Madrid, Balon de Oro 2018.": "CONTIENE C: ¿Cuál es el apellido del mediocampista croata del Real Madrid, Balón de Oro 2018?",
        "CONTIENE C: Apellido del tecnico italiano del Real Madrid.": "CONTIENE C: ¿Cuál es el apellido del técnico italiano del Real Madrid?",
        "CONTIENE C: Apellido del tecnico argentino campeon del mundo 2022.": "CONTIENE C: ¿Cuál es el apellido del técnico argentino campeón del mundo 2022?",
        "CONTIENE D: Apellido del futbolista neerlandes, capitan del Liverpool.": "CONTIENE D: ¿Cuál es el apellido del futbolista neerlandés, capitán del Liverpool?",
        "CONTIENE D: Apellido del mediocampista espanol del Barcelona, Golden Boy 2021.": "CONTIENE D: ¿Cuál es el apellido del mediocampista español del Barcelona, Golden Boy 2021?",
        "CONTIENE D: Apellido del mediocampista aleman del Manchester City, ex FC Barcelona.": "CONTIENE D: ¿Cuál es el apellido del mediocampista alemán del Manchester City, ex FC Barcelona?",
        "CONTIENE D: Apellido del mediocampista croata Balon de Oro 2018.": "CONTIENE D: ¿Cuál es el apellido del mediocampista croata Balón de Oro 2018?",
        "CONTIENE D: Apellido del tecnico espanol del Manchester City.": "CONTIENE D: ¿Cuál es el apellido del técnico español del Manchester City?",
        "CONTIENE D: Apellido del entrenador de River Plate campeon de America en 2018.": "CONTIENE D: ¿Cuál es el apellido del entrenador de River Plate campeón de América en 2018?",
        "CONTIENE D: Nombre del estadio de Independiente de Avellaneda.": "CONTIENE D: ¿Cuál es el nombre del estadio de Independiente de Avellaneda?",
        "CONTIENE D: Estadio del Manchester United.": "CONTIENE D: ¿Cuál es el nombre del estadio del Manchester United?",
        "CONTIENE E: Apellido del ex defensor argentino del Man United (Gabriel...).": "CONTIENE E: ¿Cuál es el apellido del ex defensor argentino del Manchester United (Gabriel...)?",
        "CONTIENE E: Apellido del ex delantero argentino, presidente de Boca Juniors.": "CONTIENE E: ¿Cuál es el apellido del ex delantero argentino, presidente de Boca Juniors?",
        "CONTIENE E: Apellido del ex delantero argentino, campeon del mundo 1978 (Mario...).": "CONTIENE E: ¿Cuál es el apellido del ex delantero argentino, campeón del mundo 1978 (Mario...)?",
        "CONTIENE E: Apellido del ex futbolista y tecnico frances, leyenda del Real Madrid.": "CONTIENE E: ¿Cuál es el apellido del ex futbolista y técnico francés, leyenda del Real Madrid?",
        "CONTIENE E: Apellido del tecnico portugues, campeon de Champions con Porto e Inter.": "CONTIENE E: ¿Cuál es el apellido del técnico portugués, campeón de Champions con Porto e Inter?",
        "CONTIENE E: Apellido del defensor argentino campeon del mundo 1986.": "CONTIENE E: ¿Cuál es el apellido del defensor argentino campeón del mundo 1986?",
        "CONTIENE E: Apellido del ex mediocampista espanol, leyenda del Barcelona.": "CONTIENE E: ¿Cuál es el apellido del ex mediocampista español, leyenda del Barcelona?",
        "CONTIENE E: Apellido del delantero frances Balon de Oro 2022, actualmente en Al-Ittihad.": "CONTIENE E: ¿Cuál es el apellido del delantero francés Balón de Oro 2022, actualmente en Al-Ittihad?",
        "CONTIENE E: Apellido del arquero aleman del Barcelona.": "CONTIENE E: ¿Cuál es el apellido del arquero alemán del Barcelona?",
        "CONTIENE E: Apellido del legendario arquero danes, padre del actual arquero del Leicester.": "CONTIENE E: ¿Cuál es el apellido del legendario arquero danés, padre del actual arquero del Leicester?",
        "CONTIENE E: Apellido del historico 10 uruguayo, idolo de River Plate.": "CONTIENE E: ¿Cuál es el apellido del histórico 10 uruguayo, ídolo de River Plate?",
        "CONTIENE E: Forma de definir un partido igualado tras la prorroga.": "CONTIENE E: ¿Cuál es la forma de definir un partido igualado tras la prórroga?",
        "CONTIENE E: Leyenda del Real Madrid, 'la saeta rubia'": "CONTIENE E: ¿Cuál es la leyenda del Real Madrid, 'la saeta rubia'?",
        "Man Utd": "Manchester United",
        "Man. Utd": "Manchester United",
        "Man. City": "Manchester City",
        "Man City": "Manchester City",
        "maximo goleador historico": "máximo goleador histórico",
        "maximo": "máximo",
        "historico": "histórico",
        "campeon": "campeón",
        "Campeon": "Campeón", # Case-sensitive
        "subcampeon": "subcampeón",
        "seleccion": "selección",
        "ingles": "inglés",
        "frances": "francés",
        "portugues": "portugués",
        "aleman": "alemán",
        "futbol": "fútbol",
        "numero": "número",
        "idolo": "ídolo",
        "competicion": "competición",
        "paises": "países",
        "posicion": "posición",
        "clasico": "clásico",
        "unico": "único",
        "tecnico": "técnico",
        "arbitro": "árbitro",
        "titulo": "título",
        "capitan": "capitán",
        "Medioampista": "Mediocampista", # Typo
        "ExArquero": "Exarquero", # Formatting
        "Balon de Oro": "Balón de Oro",
        "Balon": "Balón", # Risky, but often refers to "Balón de Oro" in this context
        "America": "América", # Common geographical name
        "Rio de Janeiro": "Río de Janeiro",
        "Milan": "Milán", # City and Club
        "Inter de Milan": "Inter de Milán",
        "AC Milan": "AC Milán",
        "Bayern Munich": "Bayern Múnich",
        "Borussia Monchengladbach": "Borussia Mönchengladbach",
        "Colon": "Colón", # Club
        "Deportivo La Coruna": "Deportivo La Coruña",
        "La Coruna": "La Coruña",
        "Eintracht Frankfurt": "Eintracht Fráncfort",
        "Paris Saint Germain": "París Saint-Germain",
        "Velez Sarsfield": "Vélez Sarsfield",
        "Lanus": "Lanús",
        "Huracan": "Huracán",
        "Cordoba": "Córdoba", # City/Province for Talleres
        "Union de Santa Fe": "Unión de Santa Fe",
        "Santiago Bernabeu": "Santiago Bernabéu",
        "Vicente Calderon": "Vicente Calderón",
        "Atletico": "Atlético", # Very common prefix
        "Newells Old Boys": "Newell\\'s Old Boys", # Apostrophe
        "D Alessandro": "D\\'Alessandro", # Apostrophe

        # Specific player names - handle with care
        "Andres Iniesta": "Andrés Iniesta",
        "Aguero": "Agüero",
        "Alvarez": "Álvarez", # For Julián Álvarez mainly
        "Arsene Wenger": "Arsène Wenger",
        "Eric Cantona": "Éric Cantona",
        "Erik Lamela": "Érik Lamela",
        "Gonzalo Higuain": "Gonzalo Higuaín",
        "Higuain": "Higuaín",
        "Angel Di Maria": "Ángel Di María",
        "Di Maria": "Di María", # When it's the specific player
        "Jose Mourinho": "José Mourinho",
        "Jose Cardozo": "José Cardozo",
        "Heung min Son": "Heung-min Son",
        "NGolo Kante": "N'Golo Kanté",
        "Neymar Junior": "Neymar Júnior",
        "Carlos Tevez": "Carlos Tévez",
        "Tevez": "Tévez", # Player specific
        "Raul Gonzalez": "Raúl González",
        "Raul": "Raúl", # Player specific
        "Xavi Hernandez": "Xavi Hernández",
        "Zinedine Zidane": "Zinédine Zidane",
        "Zlatan Ibrahimovic": "Zlatan Ibrahimović",
        "Cesar Luis Menotti": "César Luis Menotti",
        "Modric": "Modrić",
        "Gotze": "Götze",
        "Gundogan": "Gündoğan",
        "Etoo": "Eto\\'o", # Samuel Eto'o
        "Valdes": "Valdés", # Victor Valdés
        "Martinez": "Martínez", # Common surname, needs context but often accented
        "Fernandez": "Fernández", # Common surname
        "Rodriguez": "Rodríguez", # Common surname
        "Gomez": "Gómez", # Common surname
        "Gonzalez": "González", # Common surname
        "Sanchez": "Sánchez", # Common surname
        "Perez": "Pérez", # Common surname
        "Diez": "Díez", # Surname, if not number ten

        # Phrase improvements for clarity or grammar
        "Delantero holandes leyenda del Arsenal": "Delantero neerlandés leyenda del Arsenal",
        "ExArquero brasileno historico del AC Milan": "Exarquero brasileño histórico del AC Milán",
        "Delantero brasileno de Chelsea y Atletico. Jugo para la seleccion española": "Delantero brasileño del Chelsea y Atlético, que jugó para la selección española",
        "Defensa brasileno clave en Bayern Munich en la Champions 2012/13": "Defensor brasileño clave en el Bayern Múnich en la Champions 2012/13",
        "Jugador belga del City conocido por velocidad": "Jugador belga del Manchester City conocido por su velocidad",
        "Partido entre equipos de la misma ciudad o region que son rivales historicos": "Partido entre equipos de la misma ciudad o región que son rivales históricos",
        "Nombre completo del delantero marfileno clave Champions 2012": "Nombre completo del delantero marfileño clave en la Champions 2012",
        "Lateral brasileno con 43 trofeos": "Lateral brasileño con 43 trofeos",
        "Club argentino campeon Sudamericana 2020": "Club argentino campeón de la Sudamericana 2020",
        "DT del Atletico 'El Cholo'": "DT del Atlético 'El Cholo'",
        "Mediocampista del Liverpool dorsal 20": "Mediocampista del Liverpool, dorsal 20", # Added comma
        "Defensa brasileno de rulos, campeon de la Champions 2012": "Defensor brasileño de rulos, campeón de la Champions 2012",
        "Leyenda del Real Madrid, 'la saeta rubia'": "Leyenda del Real Madrid, \\'La Saeta Rubia\\'", # Capitalized nickname
        "Nombre completo de la leyenda argentina campeon del mundo en 1986": "Nombre completo de la leyenda argentina campeona del mundo en 1986",
        "Apellido del ex delantero marfileno leyenda del Chelsea.": "Apellido del ex delantero marfileño leyenda del Chelsea.",
        "Pais europeo que sorprendio ganando la Eurocopa 1992.": "País europeo que sorprendió ganando la Eurocopa 1992.",
        "Apellido del ex mediocampista portugues que jugo en Barcelona y Chelsea.": "Apellido del ex mediocampista portugués que jugó en Barcelona y Chelsea.",
        "Apellido del futbolista argentino campeon del mundo 2022, juega en Atletico Madrid (Rodrigo...).": "Apellido del futbolista argentino campeón del mundo 2022, que juega en el Atlético Madrid (Rodrigo...).",
        "Apellido del ex tecnico espanol campeon del Mundo 2010 y Euro 2012.": "Apellido del ex técnico español campeón del Mundo 2010 y Euro 2012.",
        "Apellido del delantero argentino del Udinese y seleccion (Rodrigo...).": "Apellido del delantero argentino del Udinese y selección (Rodrigo...).",
        "Apellido del mediocampista neerlandes del Barcelona (Frenkie...).": "Apellido del mediocampista neerlandés del Barcelona (Frenkie...).",
        "Apellido del ex delantero italiano, campeon del mundo 2006 (Alessandro...).": "Apellido del ex delantero italiano, campeón del mundo 2006 (Alessandro...).",
        "Nombre completo del idolo maximo del futbol argentino.": "Nombre completo del ídolo máximo del fútbol argentino.",
        "Tecnico argentino del Atletico de Madrid, apodado 'Cholo'.": "Técnico argentino del Atlético de Madrid, apodado 'Cholo'.",
        "Apellido del exmediocampista de Boca y Velez, campeon del mundo Sub-20 en 2001.": "Apellido del exmediocampista de Boca y Vélez, campeón del mundo Sub-20 en 2001.",
        "Apellido del tecnico aleman campeon del sextete con Bayern Munich.": "Apellido del técnico alemán campeón del sextete con el Bayern Múnich.",
        "Club de Florencio Varela campeon de la Sudamericana 2020 y Recopa 2021.": "Club de Florencio Varela campeón de la Sudamericana 2020 y Recopa 2021.",
        "Apellido del maximo goleador historico del Manchester United.": "Apellido del máximo goleador histórico del Manchester United.",
        "Club argentino de La Plata, tetracampeon de la Copa Libertadores.": "Club argentino de La Plata, tetracampeón de la Copa Libertadores.",
        "maximo goleador del Chelsea": "máximo goleador del Chelsea", # from letter F
        "entrenador italiano ex Milan, Roma y Real Madrid que dirigio la seleccion inglesa?": "entrenador italiano ex Milán, Roma y Real Madrid que dirigió la selección inglesa?",
        "club italiano de camiseta violeta?": "club italiano de camiseta violeta?", #This question is a bit vague. Better: "¿Cuál es el club italiano de Florencia cuya camiseta es violeta?"
        "goleador colombiano historico?": "goleador colombiano histórico?",
        "ingles formado en el Manchester City que usa el dorsal 47?": "inglés formado en el Manchester City que usa el dorsal 47?",
        "club londinense del Craven Cottage?": "club londinense de Craven Cottage?",
        "lateral izquierdo portugues del Real Madrid campeon en 2014?": "lateral izquierdo portugués del Real Madrid campeón en 2014?",
        "delantero frances que marco 13 goles en un solo Mundial?": "delantero francés que marcó 13 goles en un solo Mundial?",
        "delantero brasileno ex Liverpool, hoy en la liga arabe?": "delantero brasileño ex Liverpool, hoy en la liga árabe?",
        "organismo rector del futbol mundial, encargado de organizar la Copa del Mundo?": "organismo rector del fútbol mundial, encargado de organizar la Copa del Mundo?",
        "tecnico escoces del Manchester United.": "técnico escocés del Manchester United.",
        "Pais europeo campeon del mundo en 1998 y 2018.": "País europeo campeón del mundo en 1998 y 2018.",
        "Nombre completo del ex mediocampista ingles leyenda del Chelsea, maximo goleador del club.": "Nombre completo del ex mediocampista inglés leyenda del Chelsea, máximo goleador del club.",
        "Apellido del exfutbolista portugues Balon de Oro 2000, jugo en Barcelona y Real Madrid.": "Apellido del exfutbolista portugués Balón de Oro 2000, que jugó en Barcelona y Real Madrid.",
        "Apellido del ex delantero uruguayo Bota de Oro en 2005 y 2009, jugo en Villarreal y Atletico Madrid.": "Apellido del ex delantero uruguayo Bota de Oro en 2005 y 2009, que jugó en Villarreal y Atlético Madrid.",
        "Club brasileno de Rio de Janeiro, campeon de Libertadores en 2023.": "Club brasileño de Río de Janeiro, campeón de la Libertadores en 2023.",
        "Apellido del futbolista ingles del Manchester City, elegido mejor jugador joven de la Premier 2021 y 2022.": "Apellido del futbolista inglés del Manchester City, elegido mejor jugador joven de la Premier League en 2021 y 2022.",
        "¿Cual es el club formador de Diego Maradona y cuna de grandes jugadores en Buenos Aires?": "¿Cuál es el club formador de Diego Maradona y cuna de grandes jugadores en Buenos Aires?", #Cual -> Cuál
        "¿Cual es el club italiano fundado en 1907, con sede en Bergamo, conocido como 'La Dea'?": "¿Cuál es el club italiano fundado en 1907, con sede en Bérgamo, conocido como 'La Dea'?", #Bergamo -> Bérgamo
        "¿Cual es el club de Amsterdam, uno de los mas importantes de Paises Bajos, famoso por su cantera?": "¿Cuál es el club de Ámsterdam, uno de los más importantes de Países Bajos, famoso por su cantera?", #Amsterdam, mas, Paises
        "¿Cual es el pais campeon del Mundial 2014?": "¿Cuál es el país campeón del Mundial 2014?",
        "Club ingles donde juega Emiliano Martinez?": "¿Cuál es el club inglés donde juega Emiliano Martínez?", # Format as question
        "¿Cual es el apellido del futbolista argentino, delantero del Atletico de Madrid, apodado 'La Arana'?": "¿Cuál es el apellido del futbolista argentino, delantero del Atlético de Madrid, apodado 'La Araña'?",
        "¿Cual es la posicion del jugador que usa guantes y evita goles en su propio arco?": "¿Cuál es la posición del jugador que usa guantes y evita goles en su propio arco?",
        "¿Cual es el apellido del lateral izquierdo espanol, leyenda del FC Barcelona, actualmente en Inter Miami?": "¿Cuál es el apellido del lateral izquierdo español, leyenda del FC Barcelona, actualmente en Inter Miami?",
        "¿Cual es el apellido del ex delantero argentino, maximo goleador del Manchester City?": "¿Cuál es el apellido del ex delantero argentino, máximo goleador del Manchester City?",
        "¿Cual es el club ingles de Birmingham, campeon de Europa en 1982?": "¿Cuál es el club inglés de Birmingham, campeón de Europa en 1982?",
        "¿Cual es el pais cuya seleccion nacional es apodada 'Socceroos'?": "¿Cuál es el país cuya selección nacional es apodada 'Socceroos'?",
        "¿Como se llama el tiempo que se anade al final de cada tiempo en un partido?": "¿Cómo se llama el tiempo que se añade al final de cada tiempo en un partido?",
        "¿Cual es el apellido del delantero argentino campeon del mundo 2022 (Julian...)?": "¿Cuál es el apellido del delantero argentino campeón del mundo 2022 (Julián...)?",
        "¿Cual es el apellido del ex mediocampista espanol, tecnico del Bayer Leverkusen campeon invicto 23/24?": "¿Cuál es el apellido del ex mediocampista español, técnico del Bayer Leverkusen campeón invicto 2023/24?",
        "¿Cual es el pais que gano el Mundial 2014?": "¿Cuál es el país que ganó el Mundial 2014?",
        "¿Cual es el club neerlandes famoso por su cantera, donde jugaron Cruyff, Van Basten y Bergkamp?": "¿Cuál es el club neerlandés famoso por su cantera, donde jugaron Cruyff, Van Basten y Bergkamp?",
        # Ensure question marks for "CONTIENE X:" lines if they are questions
        "CONTIENE A: Apellido del ex defensor argentino, capitan del Inter campeon de la Champions 2010": "CONTIENE A: ¿Cuál es el apellido del ex defensor argentino, capitán del Inter campeón de la Champions 2010?",
        "CONTIENE A: Apellido del futbolista brasileno, Balon de Oro 2007": "CONTIENE A: ¿Cuál es el apellido del futbolista brasileño, Balón de Oro 2007?",
        "CONTIENE A: Apellido del futbolista brasileno, leyenda del AC Milan": "CONTIENE A: ¿Cuál es el apellido del futbolista brasileño, leyenda del AC Milán?",
        "CONTIENE A: Como se llama el estadio de Boca Juniors": "CONTIENE A: ¿Cómo se llama el estadio de Boca Juniors?",
        "CONTIENE A: Apellido del futbolista noruego del Manchester City, Bota de Oro 2023": "CONTIENE A: ¿Cuál es el apellido del futbolista noruego del Manchester City, Bota de Oro 2023?",
        "CONTIENE A: Apellido del exfutbolista espanol, leyenda del Barcelona y la seleccion, autor del gol en la final del Mundial 2010": "CONTIENE A: ¿Cuál es el apellido del exfutbolista español, leyenda del Barcelona y la selección, autor del gol en la final del Mundial 2010?",
        "CONTIENE A: Apellido del legendario defensor italiano, icono del AC Milan": "CONTIENE A: ¿Cuál es el apellido del legendario defensor italiano, ícono del AC Milán?",
        "CONTIENE A: Apellido del legendario defensor espanol, campeon del mundo 2010, que jugo en Real Madrid y Sevilla": "CONTIENE A: ¿Cuál es el apellido del legendario defensor español, campeón del mundo 2010, que jugó en el Real Madrid y Sevilla?",

        # Added corrections from detailed review
        "Hernan Crespo": "Hernán Crespo",
        "Ivan Córdoba": "Iván Córdoba", # Handles if "Cordoba" was already corrected to "Córdoba"
        "Ivan Cordoba": "Iván Córdoba", # Handles if "Cordoba" was not yet corrected
        "Inaki Williams": "Iñaki Williams",
        "Japon": "Japón",
        "Julian Alvarez": "Julián Álvarez", # Combined with existing Alvarez -> Álvarez
        "Joao Felix": "João Félix",
        "Juez de linea": "Juez de línea",
        "Kaka": "Kaká",
        "Kylian Mbappe": "Kylian Mbappé",
        "Koln": "Köln",
        # "Kante" standalone, N'Golo Kanté is already specific. If "Kante" appears alone:
        " Kante": " Kanté", # Space to avoid "mankante" etc.
        "Kante ": "Kanté ",
        "Kovacic": "Kovačić", # Add to surnames_to_accent as well?
        "Kounde": "Koundé",  # Add to surnames_to_accent as well?
        "Luis Diaz": "Luis Díaz",
        "Lothar Matthaus": "Lothar Matthäus",
        "Lucio": "Lúcio",
        "Low": "Löw",
        "Marquez": "Márquez", # Add to surnames_to_accent as well?
        "Makelele": "Makélélé",
        "Martin Palermo": "Martín Palermo",
        "Nicolas Tagliafico": "Nicolás Tagliafico",
        "Nuñez": "Núñez",
        "Oscar": "Óscar", # As a standalone name or start of name
        "Omar Sivori": "Omar Sívori",
        "Oscar Cordoba": "Óscar Córdoba", # Combined with existing Cordoba -> Córdoba
        "Ozil": "Özil", # Add to surnames_to_accent as well?
        "Odegaard": "Ødegaard",
        "Quique Setien": "Quique Setién",
        "Ramon Diaz": "Ramón Díaz",
        "Rosicky": "Rosický",
        "Thomas Muller": "Thomas Müller", # Combined with Muller -> Müller
        "Tchouameni": "Tchouaméni",
        "Toure Yaya": "Yaya Touré", # Changed order and added accent
        "Yaya Toure": "Yaya Touré", # Original form
        "Union": "Unión", # For club names like "Unión de Santa Fe" or standalone
        "Universidad de Concepcion": "Universidad de Concepción",
        "Universidad Catolica del Ecuador": "Universidad Católica del Ecuador",
        "Mexico": "México",
        "Zielinski": "Zieliński",
        "Howedes": "Höwedes",
        "Newells": "Newell's", # For standalone "Newells"
        # Ensure some that might be surnames are also in surnames_to_accent if broadly applicable
        # For example, if "Ozil" is common enough to be a general surname rule.
        # The existing surname logic is re.sub(r'\\b' + re.escape(name) + r'\\b', accented_name, text, flags=re.IGNORECASE)
    }

    # Apply general case-insensitive word corrections first
    text = re.sub(r"\\bAtletico\\b", "Atlético", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bAmerica\\b", "América", text, flags=re.IGNORECASE) # Careful with "South America" vs "Club América"
    text = re.sub(r"\\bBalon de Oro\\b", "Balón de Oro", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bBalon\\b", "Balón", text, flags=re.IGNORECASE) # if it's standalone
    text = re.sub(r"\\bcampeon\\b", "campeón", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bsubcampeon\\b", "subcampeón", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bseleccion\\b", "selección", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bmaximo\\b", "máximo", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bhistorico\\b", "histórico", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bingles\\b", "inglés", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bfrances\\b", "francés", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bportugues\\b", "portugués", text, flags=re.IGNORECASE)
    text = re.sub(r"\\baleman\\b", "alemán", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bfutbol\\b", "fútbol", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bnumero\\b", "número", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bidolo\\b", "ídolo", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bcompeticion\\b", "competición", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bpaises\\b", "países", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bposicion\\b", "posición", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bclasico\\b", "clásico", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bunico\\b", "único", text, flags=re.IGNORECASE)
    text = re.sub(r"\\btecnico\\b", "técnico", text, flags=re.IGNORECASE)
    text = re.sub(r"\\barbitro\\b", "árbitro", text, flags=re.IGNORECASE)
    text = re.sub(r"\\btitulo\\b", "título", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bcapitan\\b", "capitán", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bMilan\\b", "Milán", text) # Specific for city/club context
    text = re.sub(r"\\bMunich\\b", "Múnich", text) # Specific for city/club context
    text = re.sub(r"\\bInter de Milan\\b", "Inter de Milán", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bAC Milan\\b", "AC Milán", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bColon\\b", "Colón", text) # Club
    text = re.sub(r"\\bVelez\\b", "Vélez", text, flags=re.IGNORECASE) # Club
    text = re.sub(r"\\bLanus\\b", "Lanús", text, flags=re.IGNORECASE) # Club
    text = re.sub(r"\\bHuracan\\b", "Huracán", text, flags=re.IGNORECASE) # Club
    text = re.sub(r"\\bCordoba\\b", "Córdoba", text, flags=re.IGNORECASE) # City
    text = re.sub(r"\\bUnion\\b", "Unión", text, flags=re.IGNORECASE) # Club prefix
    text = re.sub(r"\\bBernabeu\\b", "Bernabéu", text, flags=re.IGNORECASE) # Stadium
    text = re.sub(r"\\bCalderon\\b", "Calderón", text, flags=re.IGNORECASE) # Stadium
    text = re.sub(r"\\bParis Saint Germain\\b", "París Saint-Germain", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bNewells Old Boys\\b", "Newell\\'s Old Boys", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bD Alessandro\\b", "D\\'Alessandro", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bEtoo\\b", "Eto\\'o", text, flags=re.IGNORECASE)
    text = re.sub(r"\\bCual\\b", "Cuál", text) # Beginning of question
    text = re.sub(r"\\bComo\\b", "Cómo", text) # Beginning of question
    text = re.sub(r"\\bQue\\b", "Qué", text) # Beginning of question
    text = re.sub(r"\\Quien\\b", "Quién", text) # Beginning of question


    # Apply the more specific dictionary-based corrections (can overwrite previous ones if needed)
    for old, new in corrections.items():
        text = text.replace(old, new)

    # Corrections for common surnames that often require accents
    # These are applied carefully to avoid altering already correct names or other words.
    # Using regex to match whole words for surnames could be safer.
    surnames_to_accent = {
        "Martinez": "Martínez", "Fernandez": "Fernández", "Rodriguez": "Rodríguez",
        "Gomez": "Gómez", "Gonzalez": "González", "Sanchez": "Sánchez", "Perez": "Pérez",
        "Gutierrez": "Gutiérrez", "Jimenez": "Jiménez", "Ramirez": "Ramírez", "Benitez": "Benítez",
        "Suarez": "Suárez", "Alvarez": "Álvarez", "Dominguez": "Domínguez", "Hernandez": "Hernández",
        "Vazquez": "Vázquez", "Diez": "Díez", # Could be number 'ten'
        # Player specific if not covered by general patterns
        "Aguero": "Agüero", "Tevez": "Tévez", "Higuain": "Higuaín",
        "Valdes": "Valdés", "Raul": "Raúl", "Iniesta":"Andrés Iniesta", # Ensure full name for Iniesta
        "Modric": "Modrić", "Gotze": "Götze", "Gundogan": "Gündoğan",
        # Additions from review if they are common standalone surnames
        "Kovacic": "Kovačić", # From review
        "Kounde": "Koundé",   # From review
        "Marquez": "Márquez", # From review
        "Ozil": "Özil",       # From review
        "Forlan": "Forlán",   # From review (ensure consistency)
        "Muller": "Müller"    # From review (ensure consistency)
    }
    for name, accented_name in surnames_to_accent.items():
        # Regex to match whole word, case insensitive for the unaccented version
        text = re.sub(r'\\b' + re.escape(name) + r'\\b', accented_name, text, flags=re.IGNORECASE)


    # Specific player name corrections (more targeted)
    text = text.replace("Andres Iniesta", "Andrés Iniesta")
    text = text.replace("Eric Cantona", "Éric Cantona")
    text = text.replace("Erik Lamela", "Érik Lamela")
    text = text.replace("Arsene Wenger", "Arsène Wenger")
    text = text.replace("Jose Mourinho", "José Mourinho")
    text = text.replace("Jose Cardozo", "José Cardozo")
    text = text.replace("Heung min Son", "Heung-min Son")
    text = text.replace("NGolo Kante", "N'Golo Kanté")
    text = text.replace("Neymar Junior", "Neymar Júnior")
    text = text.replace("Zinedine Zidane", "Zinédine Zidane")
    text = text.replace("Zlatan Ibrahimovic", "Zlatan Ibrahimović")
    text = text.replace("Cesar Luis Menotti", "César Luis Menotti")
    text = text.replace("Di Maria", "Di María") # If "Angel Di Maria" was not caught

    # Remove extra spaces that might have been introduced or were already there
    text = re.sub(r'\\s+', ' ', text).strip()
    # Ensure questions starting with "CONTIENE X:" are interrogative if they weren't made so by dict
    if text.startswith("CONTIENE ") and not text.endswith("?"):
        parts = text.split(":", 1)
        if len(parts) == 2 and not parts[1].strip().startswith("¿"):
             text = parts[0] + ": ¿" + parts[1].strip() + "?"


    # Fix common question starts if not already interrogative
    question_starters = ["¿Qué", "¿Cuál", "¿Quién", "¿Cómo", "¿Dónde", "¿Cuándo", "¿Por qué"]
    is_proper_question = any(text.startswith(starter) for starter in question_starters) or text.startswith("CONTIENE ")

    if not is_proper_question and not text.endswith("?") and text[0].islower(): # Likely a statement if starts lower and no QM
         pass # Keep as is, might be a descriptive part of a question not a question itself
    elif not is_proper_question and not text.endswith("?"):
        # If it doesn't look like a question starter but ends without ?, make it one if it starts with an upper char
        # This is heuristic. Many "questions" are phrased as statements.
        # For example, "Campeon de la Copa Libertadores 1997"
        # We'll assume these should implicitly be questions if they don't end with punctuation.
        # Let's try to ensure it starts with Cuál es, Qué, Quién etc. if it's a fact.
        # This part is complex to automate reliably for all phrasings.
        # A simpler approach: if it doesn't end with '?' and doesn't start with '¿', add them if it's not a CONTIENE.
        if not text.startswith("CONTIENE ") and not text.startswith("¿") and not text.endswith("?"):
            # Many are like "Campeon del Mundo..." - these are fine as non-questions if they are part of a list.
            # The user's original data has many of these. We should probably preserve this style for those.
            # So, only add question marks if it seems like an explicit question missing them.
            # This is too hard to reliably automate here. The dictionary covers many.
            pass


    # One final pass for very specific patterns that might have been missed or need ordering
    text = text.replace("ExArquero", "Exarquero") # Ensure case for merged words
    text = text.replace("Man. Utd", "Manchester United").replace("Man Utd", "Manchester United")
    text = text.replace("Man. City", "Manchester City").replace("Man City", "Manchester City")
    text = text.replace(" \\'"," \'").replace("\\' ","\' ") # clean up space around apostrophes if any bad replace happened
    
    # The Libertadores 2024 and Eurocopa 2024 questions should be removed or changed
    # if "Libertadores 2024" in text or "Eurocopa 2024" in text:
    #     return None # Mark for removal by returning None

    return text

def main():
    try:
        with open('data/questions_fixed.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: 'data/questions_fixed.json' not found.")
        return
    except json.JSONDecodeError:
        print("Error: Could not decode JSON from 'data/questions_fixed.json'.")
        return

    cleaned_data = []
    total_questions_before = 0
    total_questions_after = 0

    question_removal_candidates_speculative = [
        "¿Cuál es el campeón de la Libertadores 2024?",
        "Campeón de la Eurocopa 2024" # This is actually a statement in the data
    ]


    for letter_obj in data:
        total_questions_before += len(letter_obj.get('preguntas', []))
        
        cleaned_letter_obj = {'letra': letter_obj['letra'], 'preguntas': []}
        seen_question_texts_for_letter = set()
        
        original_questions = letter_obj.get('preguntas', [])
        
        for question_item in original_questions:
            pregunta_text = question_item.get('pregunta', '')
            respuesta_text = question_item.get('respuesta', '')

            # Skip speculative questions
            if pregunta_text in question_removal_candidates_speculative or \
               (pregunta_text.startswith("Campeón de la Eurocopa 2024") and respuesta_text == "España"): # More specific for the statement
                print(f"Skipping speculative question: {pregunta_text}")
                continue

            corrected_pregunta = correct_text_globally(pregunta_text)
            corrected_respuesta = correct_text_globally(respuesta_text)

            if corrected_pregunta is None: # Marked for removal by correction function
                print(f"Removing question due to correction rule: {pregunta_text}")
                continue

            # Normalize whitespace for de-duplication check (after correction)
            normalized_pregunta_text = ' '.join(corrected_pregunta.split())

            if normalized_pregunta_text not in seen_question_texts_for_letter and normalized_pregunta_text: # Ensure not empty
                seen_question_texts_for_letter.add(normalized_pregunta_text)
                cleaned_letter_obj['preguntas'].append({
                    'pregunta': corrected_pregunta,
                    'respuesta': corrected_respuesta
                })
            elif not normalized_pregunta_text:
                 print(f"Warning: Empty question text after correction for original: {pregunta_text}")
            # Else: it's a duplicate within this letter, so we skip it.

        cleaned_data.append(cleaned_letter_obj)
        total_questions_after += len(cleaned_letter_obj['preguntas'])

    # Save the cleaned data
    try:
        with open('data/questions_fixed.json', 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
        print(f"Processing complete. Output saved to 'data/questions_fixed.json'")
        print(f"Total questions before: {total_questions_before}")
        print(f"Total questions after (de-duplicated and cleaned): {total_questions_after}")
        print(f"Number of questions removed: {total_questions_before - total_questions_after}")
    except IOError:
        print("Error: Could not write to 'data/questions_fixed.json'.")

if __name__ == '__main__':
    main() 