import { db, ensureSchema } from './db';

// Textos editables de la web (clave-valor). Solo servidor.

export const defaultSettings: Record<string, string> = {
  home_hero_subtitle:
    'Avena ecológica, miel cruda y frutos secos tostados en el punto justo. Sin azúcares refinados, sin prisa. Del horno directa a tu desayuno.',
  home_story_text:
    'Raíz nació el día que dejamos de encontrar una granola que no llevara media bolsa de azúcar. Así que la hicimos nosotros. Seguimos horneando cada tanda a mano, con la misma receta y la misma manía por el detalle.',
  nosotros_intro:
    'Raíz nació de una frustración pequeña y cotidiana: no encontrar una granola que supiera de verdad a cereal y fruta, sin media bolsa de azúcar escondida. Así que encendimos el horno de casa y empezamos a probar. Tres años después seguimos horneando en lotes pequeños, con las mismas manos y la misma manía.',
};

export const settingLabels: Record<string, string> = {
  home_hero_subtitle: 'Home · Subtítulo del hero',
  home_story_text: 'Home · Texto "Empezó en una cocina pequeña"',
  nosotros_intro: 'Nosotros · Párrafo de introducción',
};

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
