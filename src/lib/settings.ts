import { db, ensureSchema } from './db';

// Textos editables de la web (clave-valor). Solo servidor.
// Para exponer un texto nuevo en /admin/textos basta con añadirlo aquí
// (defaultSettings + settingLabels) y usarlo en la página correspondiente.

export const defaultSettings: Record<string, string> = {
  // Marca
  brand_name: 'Raíz Granola',
  brand_emoji: '🌾',
  brand_favicon: '',

  // Home · Hero
  home_hero_badge: '🌾 Obrador artesanal · Lotes pequeños',
  home_hero_title_1: 'Granola horneada',
  home_hero_title_2: 'a fuego lento',
  home_hero_subtitle:
    'Avena ecológica, miel cruda y frutos secos tostados en el punto justo. Sin azúcares refinados, sin prisa. Del horno directa a tu desayuno.',
  home_hero_cta1: 'Ver la tienda',
  home_hero_cta2: 'Probar la caja degustación',
  home_hero_badge2: '⭐ 4,9/5 · +2.400 desayunos',
  home_hero_badge3: '🚚 Envío 24-48 h',

  // Home · Valores (4 tarjetas)
  home_valor1_title: 'Ingredientes ecológicos',
  home_valor1_text: 'Avena de cultivo ecológico y frutos secos de proximidad, sin aditivos ni conservantes.',
  home_valor2_title: 'Horneada a fuego lento',
  home_valor2_text: 'En pequeños lotes en nuestro obrador, para conseguir ese punto crujiente y dorado.',
  home_valor3_title: 'Sin azúcares refinados',
  home_valor3_text: 'Endulzada solo con miel cruda, sirope de dátil o la fruta. Dulzor honesto.',
  home_valor4_title: 'Embalaje compostable',
  home_valor4_text: 'Bolsas y cajas 100% compostables. Rico para ti, amable con la tierra.',

  // Home · Favoritas
  home_fav_title: 'Nuestras favoritas',
  home_fav_subtitle: 'Las recetas que más repiten en casa.',

  // Home · Historia
  home_story_title: 'Empezó en una cocina pequeña',
  home_story_text:
    'Raíz nació el día que dejamos de encontrar una granola que no llevara media bolsa de azúcar. Así que la hicimos nosotros. Seguimos horneando cada tanda a mano, con la misma receta y la misma manía por el detalle.',
  home_story_cta: 'Conoce nuestra historia',

  // Tienda
  tienda_title: 'Elige tu granola',
  tienda_subtitle:
    'Recetas horneadas a mano. Todas sin azúcares refinados y en bolsa compostable. ¿No te decides? Prueba la caja degustación.',

  // Nosotros
  nosotros_title: 'Volver a lo esencial',
  nosotros_intro:
    'Raíz nació de una frustración pequeña y cotidiana: no encontrar una granola que supiera de verdad a cereal y fruta, sin media bolsa de azúcar escondida. Así que encendimos el horno de casa y empezamos a probar. Tres años después seguimos horneando en lotes pequeños, con las mismas manos y la misma manía.',
  nosotros_paso1_title: 'Elegimos el grano',
  nosotros_paso1_text: 'Avena ecológica de productores de proximidad, integral y sin refinar.',
  nosotros_paso2_title: 'Mezclamos a mano',
  nosotros_paso2_text: 'Miel cruda, aceite de coco y frutos secos. Nada de siropes industriales.',
  nosotros_paso3_title: 'Horneamos lento',
  nosotros_paso3_text: 'A baja temperatura y removiendo, para un dorado uniforme y crujiente.',
  nosotros_paso4_title: 'Envasamos al momento',
  nosotros_paso4_text: 'En bolsa compostable, para que llegue a tu casa recién hecha.',
  nosotros_compromiso_title: 'Nuestro compromiso',
  nosotros_compromiso_text:
    'Ingredientes ecológicos y de temporada, cero azúcares refinados y embalaje 100% compostable. Trabajamos con productores locales y donamos el 1% de cada venta a proyectos de agricultura regenerativa.',

  // Imágenes (URL). Si están vacías se muestra el emoji decorativo.
  home_hero_image: '',
  home_story_image: '',
  nosotros_compromiso_image: '',

  // Pie de página
  footer_tagline: 'Horneamos granola en pequeños lotes, con avena ecológica y sin azúcares refinados.',
};

export const settingLabels: Record<string, string> = {
  brand_name: 'Nombre de la marca',
  brand_emoji: 'Emoji/icono de la marca',
  brand_favicon: 'Favicon propio (URL .png/.svg/.ico, opcional)',
  home_hero_badge: 'Etiqueta superior del hero',
  home_hero_title_1: 'Titular (línea 1)',
  home_hero_title_2: 'Titular (línea 2, en color)',
  home_hero_subtitle: 'Subtítulo del hero',
  home_hero_cta1: 'Botón principal',
  home_hero_cta2: 'Botón secundario',
  home_hero_badge2: 'Distintivo 1 (valoración)',
  home_hero_badge3: 'Distintivo 2 (envío)',
  home_valor1_title: 'Valor 1 · título',
  home_valor1_text: 'Valor 1 · texto',
  home_valor2_title: 'Valor 2 · título',
  home_valor2_text: 'Valor 2 · texto',
  home_valor3_title: 'Valor 3 · título',
  home_valor3_text: 'Valor 3 · texto',
  home_valor4_title: 'Valor 4 · título',
  home_valor4_text: 'Valor 4 · texto',
  home_fav_title: 'Favoritas · título',
  home_fav_subtitle: 'Favoritas · subtítulo',
  home_story_title: 'Historia · título',
  home_story_text: 'Historia · texto',
  home_story_cta: 'Historia · botón',
  tienda_title: 'Tienda · título',
  tienda_subtitle: 'Tienda · subtítulo',
  nosotros_title: 'Nosotros · título',
  nosotros_intro: 'Nosotros · introducción',
  nosotros_paso1_title: 'Paso 1 · título',
  nosotros_paso1_text: 'Paso 1 · texto',
  nosotros_paso2_title: 'Paso 2 · título',
  nosotros_paso2_text: 'Paso 2 · texto',
  nosotros_paso3_title: 'Paso 3 · título',
  nosotros_paso3_text: 'Paso 3 · texto',
  nosotros_paso4_title: 'Paso 4 · título',
  nosotros_paso4_text: 'Paso 4 · texto',
  nosotros_compromiso_title: 'Compromiso · título',
  nosotros_compromiso_text: 'Compromiso · texto',
  home_hero_image: 'Home · foto del hero (URL, opcional)',
  home_story_image: 'Home · foto de la historia (URL, opcional)',
  nosotros_compromiso_image: 'Nosotros · foto del compromiso (URL, opcional)',
  footer_tagline: 'Pie · descripción de la marca',
};

// Agrupación para el panel /admin/textos (mejor UX).
export const settingGroups: Array<{ title: string; keys: string[] }> = [
  { title: 'Marca', keys: ['brand_name', 'brand_emoji', 'brand_favicon'] },
  {
    title: 'Home · Portada',
    keys: [
      'home_hero_badge', 'home_hero_title_1', 'home_hero_title_2', 'home_hero_subtitle',
      'home_hero_cta1', 'home_hero_cta2', 'home_hero_badge2', 'home_hero_badge3',
    ],
  },
  {
    title: 'Home · Valores',
    keys: [
      'home_valor1_title', 'home_valor1_text', 'home_valor2_title', 'home_valor2_text',
      'home_valor3_title', 'home_valor3_text', 'home_valor4_title', 'home_valor4_text',
    ],
  },
  {
    title: 'Home · Favoritas e historia',
    keys: ['home_fav_title', 'home_fav_subtitle', 'home_story_title', 'home_story_text', 'home_story_cta'],
  },
  { title: 'Tienda', keys: ['tienda_title', 'tienda_subtitle'] },
  {
    title: 'Nuestra historia',
    keys: [
      'nosotros_title', 'nosotros_intro',
      'nosotros_paso1_title', 'nosotros_paso1_text', 'nosotros_paso2_title', 'nosotros_paso2_text',
      'nosotros_paso3_title', 'nosotros_paso3_text', 'nosotros_paso4_title', 'nosotros_paso4_text',
      'nosotros_compromiso_title', 'nosotros_compromiso_text',
    ],
  },
  {
    title: 'Imágenes',
    keys: ['home_hero_image', 'home_story_image', 'nosotros_compromiso_image'],
  },
  { title: 'Pie de página', keys: ['footer_tagline'] },
];

export async function getSetting(key: string): Promise<string> {
  await ensureSchema();
  const res = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
  if (res.rows[0]) return String(res.rows[0].value);
  return defaultSettings[key] ?? '';
}

export async function getAllSettings(): Promise<Record<string, string>> {
  await ensureSchema();
  const res = await db.execute('SELECT key, value FROM settings');
  const out: Record<string, string> = { ...defaultSettings };
  for (const row of res.rows) {
    out[String(row.key)] = String(row.value);
  }
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  await db.execute({
    sql: `INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [key, value],
  });
}
