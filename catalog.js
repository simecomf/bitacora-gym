/* Exercise catalog by muscle group. Each exercise: [name, group2, sets, repMin, repMax, variants, note, ref]
   variants: [[equip, imageId], ...] — the first one is the base exercise; the others become "<id>~<equip>" variants.
   imageId = folder in free-exercise-db (public domain). ref = key in CATALOG_REFS. */
window.CATALOG_REFS = {
  schoenfeld2017: ['Schoenfeld, Ogborn y Krieger (2017), J Sports Sci: más series semanales, más hipertrofia (10+ series por músculo).', 'https://researchgate.net/profile/Brad-Schoenfeld/publication/305455324_Dose-response_relationship_between_weekly_resistance_training_volume_and_increases_in_muscle_mass_A_systematic_review_and_meta-analysis/links/59dc0269458515e9ab4527d6/Dose-response-relationship-between-weekly-resistance-training-volume-and-increases-in-muscle-mass-A-systematic-review-and-meta-analysis.pdf'],
  maeo2021: ['Maeo y cols. (2021), Med Sci Sports Exerc: el curl femoral sentado dio más hipertrofia de femorales que el tumbado (≈14 % vs 9 %).', 'https://pubmed.ncbi.nlm.nih.gov/33009197/'],
  maeo2023: ['Maeo y cols. (2023), Eur J Sport Sci: la extensión de tríceps por encima de la cabeza dio ≈1,4 veces más crecimiento que con el brazo al costado.', 'https://pubmed.ncbi.nlm.nih.gov/35819335/'],
  kubo2019: ['Kubo, Ikebukuro y Yata (2019), Eur J Appl Physiol: la sentadilla profunda hizo crecer más glúteos y aductores que la media sentadilla; cuádriceps similar.', 'https://doi.org/10.1007/s00421-019-04181-y'],
  plotkin2023: ['Plotkin y cols. (2023), Front Physiol: hip thrust y sentadilla dieron hipertrofia de glúteos similar; la sentadilla además creció más cuádriceps y aductores.', 'https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1279170/full'],
  kinoshita2023: ['Kinoshita y cols. (2023), Front Physiol: la pantorrilla de pie (rodilla extendida) dio más hipertrofia que sentado.', 'https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1272106/full'],
  kassiano2023: ['Kassiano y cols. (2023), J Strength Cond Res: trabajar la pantorrilla en la parte más estirada dio más crecimiento del gastrocnemio.', 'https://pubmed.ncbi.nlm.nih.gov/37015016/'],
  calatayud2015: ['Calatayud y cols. (2015), J Strength Cond Res: flexiones con banda y press de banca con activación equiparada dieron ganancias de fuerza similares.', 'https://pubmed.ncbi.nlm.nih.gov/24983847/'],
  petersen2011: ['Petersen y cols. (2011), Am J Sports Med: un programa de curl nórdico redujo las lesiones agudas de femoral en futbolistas (≈71 % menos).', 'https://pubmed.ncbi.nlm.nih.gov/21825112/'],
  saeterbakken2013: ['Saeterbakken y Fimland (2013), J Strength Cond Res: de pie con barra se levanta más; con mancuernas se activa más el deltoides anterior.', 'https://www.bisp-surf.de/Record/PU201311007613'],
  lusk2010: ['Lusk, Hale y Russell (2010), J Strength Cond Res: el agarre prono activa más el dorsal ancho, sin importar el ancho del agarre.', 'https://pure.psu.edu/en/publications/grip-width-and-forearm-orientation-effects-on-muscle-activity-dur/'],
  fenwick2009: ['Fenwick, Brown y McGill (2009), J Strength Cond Res: el remo inclinado de pie genera la mayor carga lumbar entre los remos comparados.', 'https://pubmed.ncbi.nlm.nih.gov/19197209/'],
  pedrosa2022: ['Pedrosa y cols. (2022), Eur J Sport Sci: en la extensión de cuádriceps, trabajar en la parte de mayor estiramiento dio mejores adaptaciones.', 'https://doi.org/10.1080/17461391.2021.1927199'],
  pedrosa2023: ['Pedrosa y cols. (2023), Sports: en el curl, el rango inicial (brazo estirado) dio más adaptaciones que el final.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9960616'],
  escamilla2010: ['Escamilla y cols. (2010), JOSPT: el roll-out fue de los ejercicios con mayor activación abdominal y baja activación lumbar.', 'https://pubmed.ncbi.nlm.nih.gov/20436242/'],
  helms2018: ['Helms y cols. (2018), Front Physiol: ajustar el peso por RPE fue tan efectivo o algo mejor que usar porcentajes fijos del 1RM.', 'https://pubmed.ncbi.nlm.nih.gov/29628895/'],
  bell2023: ['Bell y cols. (2023), Sports Med Open: consenso de entrenadores sobre semanas de descarga para reducir fatiga y seguir progresando.', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10511399/']
};
window.CATALOG = {
  'Pecho': [
    ['Press de banca', 'Tríceps', 3, 6, 10, [['barra', 'Barbell_Bench_Press_-_Medium_Grip'], ['mancuerna', 'Dumbbell_Bench_Press'], ['maquina', 'Machine_Bench_Press'], ['smith', 'Smith_Machine_Bench_Press']], 'Ejercicio base de empuje horizontal; permite cargar mucho peso y progresar de forma medible.', 'schoenfeld2017'],
    ['Press inclinado', 'Hombros', 3, 8, 12, [['mancuerna', 'Incline_Dumbbell_Press'], ['barra', 'Barbell_Incline_Bench_Press_-_Medium_Grip'], ['smith', 'Smith_Machine_Incline_Bench_Press'], ['maquina', 'Leverage_Incline_Chest_Press']], 'Con el banco a 30–45° se trabaja más la parte superior del pecho y el deltoides anterior.', ''],
    ['Press de pecho en máquina', 'Tríceps', 3, 8, 12, [['maquina', 'Leverage_Chest_Press'], ['polea', 'Cable_Chest_Press']], 'Recorrido guiado: fácil de llevar cerca del fallo con seguridad, útil para sumar volumen.', ''],
    ['Aperturas', '', 3, 10, 15, [['maquina', 'Butterfly'], ['mancuerna', 'Dumbbell_Flyes'], ['polea', 'Flat_Bench_Cable_Flyes']], 'Aísla el pecho sin depender de los tríceps; busca un buen estiramiento abajo.', ''],
    ['Fondos en paralelas', 'Tríceps', 3, 6, 12, [['corporal', 'Dips_-_Chest_Version'], ['maquina', 'Dip_Machine']], 'Inclinando el torso hacia adelante se carga más el pecho; usa la máquina o asistencia si aún no haces 6 repeticiones.', ''],
    ['Flexiones de pecho', 'Tríceps', 3, 8, 20, [['corporal', 'Pushups'], ['banda', 'Push-Ups_With_Feet_Elevated']], 'Con carga suficiente (banda o pies elevados) logran ganancias de fuerza similares al press de banca.', 'calatayud2015'],
    ['Cruce de poleas', '', 3, 12, 15, [['polea', 'Cable_Crossover']], 'Tensión constante durante todo el recorrido; complemento de aislamiento al final de la sesión.', '']
  ],
  'Espalda': [
    ['Jalón al pecho', 'Bíceps', 3, 8, 12, [['polea', 'Wide-Grip_Lat_Pulldown'], ['maquina', 'V-Bar_Pulldown']], 'Usa agarre prono (palmas al frente): activa más el dorsal ancho.', 'lusk2010'],
    ['Remo en polea baja', 'Bíceps', 3, 8, 12, [['polea', 'Seated_Cable_Rows'], ['maquina', 'Leverage_Iso_Row']], 'Remo con el torso estable: trabaja espalda media y dorsales con poca carga lumbar.', ''],
    ['Remo con barra', 'Bíceps', 3, 6, 10, [['barra', 'Bent_Over_Barbell_Row'], ['smith', 'Smith_Machine_Bent_Over_Row']], 'Activa mucho la espalda, pero es el remo con mayor carga lumbar: mantén la espalda neutra.', 'fenwick2009'],
    ['Dominadas', 'Bíceps', 3, 5, 10, [['corporal', 'Pullups'], ['banda', 'Band_Assisted_Pull-Up']], 'Tirón vertical con el peso corporal; usa banda o máquina asistida hasta lograr 5 repeticiones.', ''],
    ['Remo con mancuerna a una mano', 'Bíceps', 3, 8, 12, [['mancuerna', 'One-Arm_Dumbbell_Row'], ['polea', 'Seated_One-arm_Cable_Pulley_Rows']], 'Unilateral con apoyo en el banco: más recorrido y menos carga en la espalda baja.', ''],
    ['Remo con pecho apoyado', 'Bíceps', 3, 8, 12, [['barra', 'Lying_T-Bar_Row'], ['maquina', 'Leverage_High_Row']], 'El pecho apoyado evita la carga lumbar del remo inclinado de pie y deja todo el esfuerzo a la espalda.', 'fenwick2009'],
    ['Pullover en polea', '', 3, 10, 15, [['polea', 'Straight-Arm_Pulldown'], ['mancuerna', 'Straight-Arm_Dumbbell_Pullover']], 'Con brazos rectos aísla el dorsal sin que los bíceps limiten la serie.', '']
  ],
  'Hombros': [
    ['Press militar', 'Tríceps', 3, 6, 10, [['barra', 'Standing_Military_Press'], ['mancuerna', 'Dumbbell_Shoulder_Press'], ['maquina', 'Machine_Shoulder_Military_Press'], ['smith', 'Smith_Machine_Overhead_Shoulder_Press']], 'De pie con barra mueves más peso; con mancuernas activas más el deltoides anterior.', 'saeterbakken2013'],
    ['Elevaciones laterales', '', 3, 12, 20, [['mancuerna', 'Side_Lateral_Raise'], ['polea', 'Cable_Seated_Lateral_Raise']], 'El ejercicio más directo para el deltoides lateral (ancho de hombros). En polea la tensión es más constante.', ''],
    ['Face pull', 'Espalda', 3, 12, 15, [['polea', 'Face_Pull']], 'Deltoides posterior y rotadores externos; equilibra todo el trabajo de empuje.', ''],
    ['Vuelos posteriores', 'Espalda', 3, 12, 20, [['mancuerna', 'Seated_Bent-Over_Rear_Delt_Raise'], ['maquina', 'Reverse_Machine_Flyes'], ['polea', 'Cable_Rear_Delt_Fly']], 'Aislamiento del deltoides posterior, que los presses casi no trabajan.', ''],
    ['Remo al mentón con agarre ancho', 'Espalda', 3, 10, 15, [['barra', 'Upright_Barbell_Row'], ['smith', 'Smith_Machine_Upright_Row']], 'Deltoides lateral y trapecio. Agarre ancho y sube solo hasta la altura de los hombros para cuidar la articulación.', ''],
    ['Encogimientos', 'Espalda', 3, 10, 15, [['barra', 'Barbell_Shrug'], ['mancuerna', 'Dumbbell_Shrug']], 'Trabajo directo del trapecio superior; pausa de 1 s arriba.', '']
  ],
  'Bíceps': [
    ['Curl de bíceps', '', 3, 8, 12, [['mancuerna', 'Dumbbell_Bicep_Curl'], ['barra', 'Barbell_Curl'], ['polea', 'Standing_Biceps_Cable_Curl']], 'Curl básico; con barra se carga más, con mancuernas puedes supinar la muñeca.', ''],
    ['Curl inclinado', '', 3, 10, 12, [['mancuerna', 'Incline_Dumbbell_Curl']], 'Con el brazo detrás del cuerpo el bíceps trabaja estirado, la parte del recorrido que más adaptaciones dio.', 'pedrosa2023'],
    ['Curl predicador', '', 3, 8, 12, [['barra', 'Preacher_Curl'], ['mancuerna', 'One_Arm_Dumbbell_Preacher_Curl'], ['maquina', 'Machine_Preacher_Curls'], ['polea', 'Cable_Preacher_Curl']], 'Máxima tensión con el brazo casi estirado; no cortes el recorrido abajo.', 'pedrosa2023'],
    ['Curl martillo', 'Otros', 3, 10, 12, [['mancuerna', 'Hammer_Curls'], ['polea', 'Cable_Hammer_Curls_-_Rope_Attachment']], 'Agarre neutro: suma braquial y braquiorradial (antebrazo) al trabajo del bíceps.', ''],
    ['Curl concentrado', '', 3, 10, 15, [['mancuerna', 'Concentration_Curls']], 'El codo apoyado evita el impulso; buen cierre de sesión.', ''],
    ['Curl araña', '', 3, 10, 15, [['barra', 'Spider_Curl']], 'Pecho apoyado en el banco inclinado: aísla el bíceps sin balanceo.', '']
  ],
  'Tríceps': [
    ['Extensión de tríceps en polea', '', 3, 10, 15, [['polea', 'Triceps_Pushdown']], 'Básico y fácil de progresar. Combínalo con una extensión por encima de la cabeza.', ''],
    ['Extensión de tríceps sobre la cabeza', '', 3, 10, 15, [['polea', 'Cable_Rope_Overhead_Triceps_Extension'], ['mancuerna', 'Standing_Dumbbell_Triceps_Extension']], 'Con el brazo arriba la cabeza larga del tríceps trabaja estirada y crece más.', 'maeo2023'],
    ['Press francés', '', 3, 8, 12, [['barra', 'EZ-Bar_Skullcrusher'], ['polea', 'Cable_Lying_Triceps_Extension']], 'El hombro flexionado también estira la cabeza larga. Usa barra Z para cuidar las muñecas.', 'maeo2023'],
    ['Press de banca agarre cerrado', 'Pecho', 3, 6, 10, [['barra', 'Close-Grip_Barbell_Bench_Press'], ['smith', 'Smith_Machine_Close-Grip_Bench_Press']], 'Multiarticular que permite cargar mucho peso con énfasis en tríceps.', ''],
    ['Fondos para tríceps', 'Pecho', 3, 8, 12, [['corporal', 'Dips_-_Triceps_Version'], ['maquina', 'Dip_Machine']], 'Torso vertical y codos atrás para cargar el tríceps más que el pecho.', '']
  ],
  'Cuádriceps': [
    ['Sentadilla', 'Glúteos', 3, 6, 10, [['barra', 'Barbell_Squat'], ['smith', 'Smith_Machine_Squat'], ['mancuerna', 'Dumbbell_Squat']], 'Baja profundo si tu movilidad lo permite: la sentadilla profunda hizo crecer más glúteos y aductores.', 'kubo2019'],
    ['Prensa', 'Glúteos', 3, 10, 12, [['maquina', 'Leg_Press']], 'Mucho volumen de cuádriceps con poca fatiga de espalda.', ''],
    ['Extensión de cuádriceps', '', 3, 10, 15, [['maquina', 'Leg_Extensions']], 'Único ejercicio que aísla el recto femoral; pon énfasis en la parte baja (rodilla flexionada).', 'pedrosa2022'],
    ['Zancadas', 'Glúteos', 3, 10, 12, [['mancuerna', 'Dumbbell_Lunges'], ['barra', 'Barbell_Lunge']], 'Trabajo unilateral: corrige diferencias entre piernas y suma glúteo.', ''],
    ['Sentadilla búlgara', 'Glúteos', 3, 8, 12, [['mancuerna', 'Split_Squat_with_Dumbbells'], ['smith', 'Smith_Single-Leg_Split_Squat']], 'Unilateral con el pie trasero elevado; mucho estímulo con poco peso y poca carga en la espalda.', ''],
    ['Sentadilla hack', 'Glúteos', 3, 8, 12, [['maquina', 'Hack_Squat'], ['barra', 'Barbell_Hack_Squat']], 'Máquina guiada que permite bajar profundo con la espalda apoyada.', 'kubo2019'],
    ['Sentadilla frontal', 'Core', 3, 5, 8, [['barra', 'Front_Squat_Clean_Grip']], 'La barra adelante mantiene el torso vertical y desplaza el trabajo hacia el cuádriceps.', '']
  ],
  'Femorales': [
    ['Curl femoral sentado', '', 3, 10, 15, [['maquina', 'Seated_Leg_Curl']], 'Sentado, la cadera flexionada estira los femorales y dio más hipertrofia que el curl tumbado.', 'maeo2021'],
    ['Peso muerto rumano', 'Glúteos', 3, 6, 10, [['barra', 'Romanian_Deadlift'], ['mancuerna', 'Stiff-Legged_Dumbbell_Deadlift']], 'Bisagra de cadera con rodillas casi rectas: femorales y glúteos en estiramiento.', ''],
    ['Curl femoral tumbado', '', 3, 10, 15, [['maquina', 'Lying_Leg_Curls']], 'Alternativa si no hay máquina sentada; el sentado tuvo mejores resultados de hipertrofia.', 'maeo2021'],
    ['Curl nórdico', '', 3, 4, 8, [['corporal', 'Natural_Glute_Ham_Raise']], 'Excéntrico intenso; la mejor evidencia para prevenir lesiones de femoral. Baja lo más lento que puedas.', 'petersen2011'],
    ['Buenos días', 'Glúteos', 3, 8, 12, [['barra', 'Good_Morning']], 'Bisagra de cadera con barra en la espalda; empieza liviano y con la espalda neutra.', '']
  ],
  'Glúteos': [
    ['Hip thrust', 'Femorales', 3, 8, 12, [['barra', 'Barbell_Hip_Thrust']], 'Máxima activación de glúteo arriba; da hipertrofia de glúteos similar a la sentadilla.', 'plotkin2023'],
    ['Abducción de cadera', '', 3, 12, 20, [['maquina', 'Thigh_Abductor']], 'Glúteo medio y menor; inclina el torso hacia adelante para más recorrido.', ''],
    ['Zancadas hacia atrás', 'Cuádriceps', 3, 10, 12, [['mancuerna', 'Dumbbell_Rear_Lunge'], ['barra', 'Barbell_Lunge']], 'Dar el paso atrás carga más el glúteo y es más amable con la rodilla.', ''],
    ['Puente de glúteo', 'Femorales', 3, 10, 15, [['barra', 'Barbell_Glute_Bridge'], ['corporal', 'Single_Leg_Glute_Bridge']], 'Versión desde el suelo del hip thrust; fácil de montar y de progresar.', ''],
    ['Subida al cajón', 'Cuádriceps', 3, 8, 12, [['mancuerna', 'Dumbbell_Step_Ups'], ['barra', 'Barbell_Step_Ups']], 'Unilateral: cuanto más alto el cajón, más trabajo de glúteo.', ''],
    ['Patada de glúteo en polea', '', 3, 12, 15, [['polea', 'One-Legged_Cable_Kickback'], ['maquina', 'Glute_Kickback']], 'Aislamiento del glúteo mayor; buen complemento al final de la sesión.', '']
  ],
  'Pantorrillas': [
    ['Elevación de pantorrillas', '', 3, 10, 15, [['maquina', 'Standing_Calf_Raises'], ['smith', 'Smith_Machine_Calf_Raise'], ['barra', 'Standing_Barbell_Calf_Raise'], ['mancuerna', 'Standing_Dumbbell_Calf_Raise']], 'De pie (rodilla extendida) creció más que sentado. Baja hasta el máximo estiramiento y haz pausa abajo.', 'kinoshita2023'],
    ['Pantorrilla sentado', '', 3, 12, 20, [['maquina', 'Seated_Calf_Raise'], ['barra', 'Barbell_Seated_Calf_Raise']], 'Con la rodilla flexionada trabaja sobre todo el sóleo; úsalo además de la versión de pie, no en su lugar.', 'kinoshita2023'],
    ['Pantorrilla en prensa', '', 3, 10, 15, [['maquina', 'Calf_Press_On_The_Leg_Press_Machine']], 'Rodillas extendidas como la versión de pie; énfasis en la parte estirada del recorrido.', 'kassiano2023'],
    ['Pantorrilla tipo burro', '', 3, 10, 15, [['maquina', 'Donkey_Calf_Raises']], 'Cadera flexionada y rodilla recta: el gastrocnemio trabaja muy estirado.', 'kassiano2023']
  ],
  'Core': [
    ['Crunch abdominal', '', 3, 12, 20, [['corporal', 'Crunches'], ['maquina', 'Ab_Crunch_Machine']], 'Flexión del tronco para el recto abdominal; sube despacio sin tirar del cuello.', ''],
    ['Rueda abdominal', '', 3, 6, 12, [['corporal', 'Ab_Roller'], ['barra', 'Barbell_Ab_Rollout_-_On_Knees']], 'De los ejercicios con mayor activación abdominal y baja carga lumbar. Empieza de rodillas.', 'escamilla2010'],
    ['Elevación de piernas colgado', '', 3, 8, 15, [['corporal', 'Hanging_Leg_Raise']], 'Recto abdominal inferior y flexores de cadera; evita balancearte.', ''],
    ['Crunch en polea', '', 3, 10, 15, [['polea', 'Cable_Crunch']], 'Permite añadir peso y progresar como cualquier otro músculo.', '']
  ]
};
