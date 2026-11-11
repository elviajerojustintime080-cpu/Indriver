export interface LocationItem {
  id: string;
  name: string;
  locality: string;
  lat: number;
  lng: number;
}

export const EXACT_DESTINATIONS: LocationItem[] = [
  { id: '1', name: 'Centro / Parque Lerdo / Catedral', locality: 'San Andrés Tuxtla', lat: 18.44849, lng: -95.21204 },
  { id: '2', name: 'Mercado Municipal 5 de Febrero', locality: 'San Andrés Tuxtla', lat: 18.45010, lng: -95.21450 },
  { id: '3', name: 'Terminal ADO San Andrés Tuxtla', locality: 'San Andrés Tuxtla', lat: 18.44485, lng: -95.21110 },
  { id: '4', name: 'Hospital General Bernardo Peña', locality: 'San Andrés Tuxtla', lat: 18.44110, lng: -95.21890 },
  { id: '5', name: 'Laguna Encantada', locality: 'San Andrés Tuxtla', lat: 18.46320, lng: -95.18730 },
  { id: '6', name: 'Salto de Eyipantla', locality: 'San Andrés Tuxtla', lat: 18.38839, lng: -95.20118 },
  { id: '7', name: 'Catemaco Centro / Malecón', locality: 'Catemaco', lat: 18.42080, lng: -95.11120 },
  { id: '8', name: 'Reserva Ecológica Nanciyaga (Km 7)', locality: 'Catemaco', lat: 18.447309, lng: -95.068467 },
  { id: '9', name: 'Santiago Tuxtla Centro / Cabeza Olmeca', locality: 'Santiago Tuxtla', lat: 18.46510, lng: -95.30050 },
  { id: '10', name: 'Playa Montepío', locality: 'Costa de San Andrés', lat: 18.64455, lng: -95.09742 },
  { id: '11', name: 'Roca Partida', locality: 'San Andrés Tuxtla', lat: 18.69830, lng: -95.19520 },
  { id: '12', name: 'La Nueva Victoria', locality: 'San Andrés Tuxtla', lat: 18.65542, lng: -95.25754 },
  { id: '13', name: 'Jesús Carranza Centro', locality: 'Jesús Carranza', lat: 17.43285, lng: -95.02403 },
  { id: '14', name: 'Cascajal Uno', locality: 'Jesús Carranza', lat: 17.51335, lng: -94.72400 }
];

export const TOURIST_ZONES = [
  {
    id: 'eyipantla',
    name: 'Salto de Eyipantla',
    title: 'Imponente cascada de 50 metros',
    coords: { lat: 18.38839, lng: -95.20118 },
    bestTime: '9:00 AM - 1:00 PM (para ver arcoíris)',
    todo: 'Bajar los 244 escalones al mirador inferior, comprar artesanías de palma y probar quesadillas de masa cocida.',
    recommendation: 'Llevar calzado antiderrapante e impermeable ligero.'
  },
  {
    id: 'nanciyaga',
    name: 'Reserva Ecológica Nanciyaga',
    title: 'Selva tropical y tradición prehispánica',
    coords: { lat: 18.447309, lng: -95.068467 },
    bestTime: '10:00 AM - 4:00 PM',
    todo: 'Temazcal tradicional, paseo en lancha por el lago, fango mineral y sendero botánico.',
    recommendation: 'Usar repelente ecológico libre de químicos.'
  },
  {
    id: 'montepio',
    name: 'Playa Montepío',
    title: 'Desembocadura de ríos y mar en la Costa',
    coords: { lat: 18.64455, lng: -95.09742 },
    bestTime: 'Todo el día',
    todo: 'Rentar lancha para recorrer las cascadas gemelas, paseo en kayak en el río y mariscos frente al mar.',
    recommendation: 'Preguntar por el estado del mar antes de nadar.'
  },
  {
    id: 'rocapartida',
    name: 'Roca Partida',
    title: 'Acantilados volcánicos y vista panorámica',
    coords: { lat: 18.6983, lng: -95.1952 },
    bestTime: '7:00 AM o al atardecer',
    todo: 'Senderismo al faro, rappel en roca volcánica y visita a la cueva del pirata Lorencillo.',
    recommendation: 'Llevar suficiente agua y protector solar biodegradable.'
  },
  {
    id: 'laguna_catemaco',
    name: 'Laguna de Catemaco',
    title: 'Misticismo y naturaleza acuática',
    coords: { lat: 18.4208, lng: -95.1112 },
    bestTime: 'Mañanas templadas',
    todo: 'Paseo en lancha a la Isla de los Monos y probar los tradicionales tegogolos preparados.',
    recommendation: 'Pactar la tarifa de lancha antes de abordar.'
  },
  {
    id: 'laguna_encantada',
    name: 'Laguna Encantada',
    title: 'Cráter volcánico rodeado de selva viva',
    coords: { lat: 18.4632, lng: -95.1873 },
    bestTime: 'Mediodía',
    todo: 'Caminata por la orilla virgen y avistamiento de aves locales.',
    recommendation: 'Cuidar la flora y no tirar basura.'
  },
  {
    id: 'santiago_tuxtla',
    name: 'Santiago Tuxtla Colonial',
    title: 'Cuna Olmeca y arquitectura colonial',
    coords: { lat: 18.4651, lng: -95.3005 },
    bestTime: 'Tardes frescas',
    todo: 'Visitar la monumental Cabeza Olmeca de Cobata en el parque central y el Museo Tuxteco.',
    recommendation: 'Visitar los portales para disfrutar nieves artesanales.'
  },
  {
    id: 'parque_lerdo',
    name: 'Parque Lerdo y Catedral',
    title: 'Corazón de San Andrés Tuxtla',
    coords: { lat: 18.44849, lng: -95.21204 },
    bestTime: '6:00 PM en adelante',
    todo: 'Visita a la Catedral de San José y compra de café de altura y puros artesanales reconocidos internacionalmente.',
    recommendation: 'Ideal para iniciar y cerrar los recorridos.'
  }
];

export const SAVED_LOCALITIES = [
  'San Andrés Tuxtla', 'Catemaco', 'Santiago Tuxtla', 'Sihuapan', 'Comoapan',
  'Alvarado', 'Ángel R. Cabada', 'La Nueva Victoria', 'Balzapote', 'Toro Prieto',
  'Arroyo de Lisa', 'Dos Amates', 'Tres Zapotes', 'Tilapan', 'Chuniapan de Arriba',
  'Jesús Carranza', 'San Juan Evangelista', 'Jáltipan', 'Chinameca', 'Soconusco',
  'Oluta', 'Cascajal Uno', 'Lerdo de Tejada', 'Acayucan', 'Coatzacoalcos', 'Minatitlán'
];