// Tipos y utilidades de producto (seguro para el cliente: sin acceso a DB).
// Los datos "semilla" pueblan la tabla `products` la primera vez (ver catalog.ts).

export interface Product {
  id?: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Precio en céntimos de euro */
  price: number;
  weight: string;
  ingredients: string[];
  tags: string[];
  emoji: string;
  color: string;
  imageUrl: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  stock: number; // -1 = ilimitado
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export const seedProducts: Product[] = [
  {
    slug: 'clasica-miel',
    name: 'Clásica de Miel',
    tagline: 'Avena tostada con miel de romero',
    description:
      'Nuestra receta original: copos de avena integral horneados lentamente con miel cruda de romero, almendras laminadas y un toque de canela de Ceilán. Crujiente, dorada y sin azúcares refinados.',
    price: 890,
    weight: '400 g',
    ingredients: ['Avena integral', 'Miel de romero', 'Almendra', 'Aceite de coco', 'Canela'],
    tags: ['Vegetariana', 'Sin azúcar refinado'],
    emoji: '🍯',
    color: '#C99A3F',
    imageUrl: '',
    featured: true,
    active: true,
    sortOrder: 1,
    stock: -1,
  },
  {
    slug: 'cacao-avellana',
    name: 'Cacao & Avellana',
    tagline: 'Chocolate puro y avellana tostada',
    description:
      'Para los golosos conscientes. Cacao puro sin azúcar, avellanas tostadas del Piamonte y semillas de cáñamo. Energía honesta con sabor a merienda de la infancia.',
    price: 990,
    weight: '400 g',
    ingredients: ['Avena integral', 'Cacao puro', 'Avellana', 'Semillas de cáñamo', 'Sirope de dátil'],
    tags: ['Vegana', 'Alta en fibra'],
    emoji: '🍫',
    color: '#B5642F',
    imageUrl: '',
    featured: true,
    active: true,
    sortOrder: 2,
    stock: -1,
  },
  {
    slug: 'frutos-rojos',
    name: 'Frutos Rojos',
    tagline: 'Arándanos y fresa liofilizados',
    description:
      'Ligera y afrutada. Arándanos y fresa liofilizados que conservan todo su color y acidez, con pipas de girasol y coco en láminas. Perfecta con yogur natural.',
    price: 950,
    weight: '400 g',
    ingredients: ['Avena integral', 'Arándano', 'Fresa', 'Coco', 'Pipas de girasol'],
    tags: ['Vegana', 'Sin gluten*'],
    emoji: '🫐',
    color: '#8E5572',
    imageUrl: '',
    featured: true,
    active: true,
    sortOrder: 3,
    stock: -1,
  },
  {
    slug: 'proteica-cacahuete',
    name: 'Proteica de Cacahuete',
    tagline: 'Extra proteína vegetal',
    description:
      'Diseñada para después del entreno. Crema de cacahuete, proteína de guisante y semillas de calabaza. 14 g de proteína por ración, sabor intenso y saciante.',
    price: 1090,
    weight: '450 g',
    ingredients: ['Avena integral', 'Crema de cacahuete', 'Proteína de guisante', 'Semillas de calabaza'],
    tags: ['Vegana', 'Rica en proteína'],
    emoji: '🥜',
    color: '#9C6B3F',
    imageUrl: '',
    featured: false,
    active: true,
    sortOrder: 4,
    stock: -1,
  },
  {
    slug: 'jengibre-manzana',
    name: 'Jengibre & Manzana',
    tagline: 'Especiada y reconfortante',
    description:
      'Inspirada en el otoño. Manzana deshidratada, jengibre fresco y nuez pecana con un toque de nuez moscada. Como un bizcocho de manzana, pero para desayunar cada día.',
    price: 950,
    weight: '400 g',
    ingredients: ['Avena integral', 'Manzana', 'Jengibre', 'Nuez pecana', 'Nuez moscada'],
    tags: ['Vegetariana', 'Sin azúcar refinado'],
    emoji: '🍎',
    color: '#A6702E',
    imageUrl: '',
    featured: false,
    active: true,
    sortOrder: 5,
    stock: -1,
  },
  {
    slug: 'caja-degustacion',
    name: 'Caja Degustación',
    tagline: 'Cinco bolsas de 120 g',
    description:
      'La mejor forma de empezar. Una selección de nuestras cinco recetas en formato de 120 g, presentada en caja de cartón reciclado. Ideal para regalar o para descubrir tu favorita.',
    price: 2490,
    weight: '5 × 120 g',
    ingredients: ['Selección de las 5 variedades'],
    tags: ['Regalo', 'Novedad'],
    emoji: '🎁',
    color: '#37503B',
    imageUrl: '',
    featured: true,
    active: true,
    sortOrder: 6,
    stock: -1,
  },
];
