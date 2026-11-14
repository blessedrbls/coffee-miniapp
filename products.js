/*
 * Демо-меню кав'ярні.
 * Ціни в доларах США, записані в ЦЕНТАХ (380 = $3.80) — цілі числа без похибок округлення.
 * Бот має ту саму таблицю цін і рахує суму сам —
 * ціни звідси використовуються лише для показу в інтерфейсі.
 * Фото: Unsplash (https://unsplash.com/license), джерела — у README.md.
 */

const UNSPLASH = (id, w = 600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

window.CATEGORIES = [
  {
    id: 'coffee',
    emoji: '☕',
    name: { uk: 'Кава', en: 'Coffee' },
    tagline: { uk: 'Свіжообсмажене зерно', en: 'Freshly roasted beans' },
    image: UNSPLASH('1495474472287-4d71bcdd2085', 800),
  },
  {
    id: 'tea',
    emoji: '🍵',
    name: { uk: 'Чай', en: 'Tea' },
    tagline: { uk: 'Листовий та матча', en: 'Loose leaf & matcha' },
    image: UNSPLASH('1594631252845-29fc4cc8cde9', 800),
  },
  {
    id: 'desserts',
    emoji: '🍰',
    name: { uk: 'Десерти', en: 'Desserts' },
    tagline: { uk: 'Випічка щоранку', en: 'Baked every morning' },
    image: UNSPLASH('1606313564200-e75d5e30476c', 800),
  },
];

window.PRODUCTS = [
  // ── Кава ──────────────────────────────────────────────
  {
    id: 'espresso',
    category: 'coffee',
    price: 250,
    size: { uk: '30 мл', en: '30 ml' },
    name: { uk: 'Еспресо', en: 'Espresso' },
    description: {
      uk: 'Насичений шот з нотами шоколаду й горіха',
      en: 'Rich shot with notes of chocolate and nuts',
    },
    image: UNSPLASH('1510591509098-f4fdc6d0ff04'),
  },
  {
    id: 'americano',
    category: 'coffee',
    price: 300,
    size: { uk: '250 мл', en: '250 ml' },
    name: { uk: 'Американо', en: 'Americano' },
    description: {
      uk: 'Еспресо з гарячою водою — класика на кожен день',
      en: 'Espresso with hot water — an everyday classic',
    },
    image: UNSPLASH('1551030173-122aabc4489c'),
  },
  {
    id: 'cappuccino',
    category: 'coffee',
    price: 380,
    size: { uk: '250 мл', en: '250 ml' },
    name: { uk: 'Капучино', en: 'Cappuccino' },
    description: {
      uk: 'Еспресо, молоко та ніжна оксамитова пінка',
      en: 'Espresso, milk and silky velvet foam',
    },
    image: UNSPLASH('1572442388796-11668a67e53d'),
  },
  {
    id: 'latte',
    category: 'coffee',
    price: 420,
    size: { uk: '350 мл', en: '350 ml' },
    name: { uk: 'Лате', en: 'Latte' },
    description: {
      uk: 'Більше молока, м’який смак і латте-арт',
      en: 'More milk, a mellow taste and latte art',
    },
    image: UNSPLASH('1561882468-9110e03e0f78'),
  },
  {
    id: 'flat_white',
    category: 'coffee',
    price: 450,
    size: { uk: '200 мл', en: '200 ml' },
    name: { uk: 'Флет вайт', en: 'Flat White' },
    description: {
      uk: 'Подвійний ристрето з тонким шаром молока',
      en: 'Double ristretto with a thin layer of milk',
    },
    image: UNSPLASH('1577968897966-3d4325b36b61'),
  },

  // ── Чай ───────────────────────────────────────────────
  {
    id: 'black_tea',
    category: 'tea',
    price: 280,
    size: { uk: '400 мл', en: '400 ml' },
    name: { uk: 'Чорний чай', en: 'Black Tea' },
    description: {
      uk: 'Цейлонський листовий чай, подаємо з лимоном',
      en: 'Ceylon loose leaf tea, served with lemon',
    },
    image: UNSPLASH('1576092768241-dec231879fc3'),
  },
  {
    id: 'green_tea',
    category: 'tea',
    price: 300,
    size: { uk: '400 мл', en: '400 ml' },
    name: { uk: 'Зелений чай з м’ятою', en: 'Green Tea with Mint' },
    description: {
      uk: 'Сенча зі свіжою м’ятою — легко й освіжаюче',
      en: 'Sencha with fresh mint — light and refreshing',
    },
    image: UNSPLASH('1627435601361-ec25f5b1d0e5'),
  },
  {
    id: 'matcha_latte',
    category: 'tea',
    price: 490,
    size: { uk: '300 мл', en: '300 ml' },
    name: { uk: 'Матча лате', en: 'Matcha Latte' },
    description: {
      uk: 'Японська матча з молоком на ваш вибір',
      en: 'Japanese matcha with milk of your choice',
    },
    image: UNSPLASH('1515823064-d6e0c04616a7'),
  },

  // ── Десерти ───────────────────────────────────────────
  {
    id: 'croissant',
    category: 'desserts',
    price: 320,
    size: { uk: '90 г', en: '90 g' },
    name: { uk: 'Круасан', en: 'Croissant' },
    description: {
      uk: 'Хрусткий масляний круасан, щойно з печі',
      en: 'Flaky butter croissant, fresh from the oven',
    },
    image: UNSPLASH('1555507036-ab1f4038808a'),
  },
  {
    id: 'cheesecake',
    category: 'desserts',
    price: 550,
    size: { uk: '130 г', en: '130 g' },
    name: { uk: 'Чизкейк з чорницею', en: 'Blueberry Cheesecake' },
    description: {
      uk: 'Ніжний сирний крем на пісочній основі',
      en: 'Creamy cheese filling on a shortbread base',
    },
    image: UNSPLASH('1533134242443-d4fd215305ad'),
  },
  {
    id: 'chocolate_cake',
    category: 'desserts',
    price: 520,
    size: { uk: '120 г', en: '120 g' },
    name: { uk: 'Шоколадний торт', en: 'Chocolate Cake' },
    description: {
      uk: 'Бісквіт на бельгійському шоколаді з ганашем',
      en: 'Belgian chocolate sponge with ganache',
    },
    image: UNSPLASH('1578985545062-69928b1d9587'),
  },
  {
    id: 'macarons',
    category: 'desserts',
    price: 600,
    size: { uk: '3 шт.', en: '3 pcs' },
    name: { uk: 'Макарони', en: 'Macarons' },
    description: {
      uk: 'Мигдальне печиво: ваніль, малина, фісташка',
      en: 'Almond cookies: vanilla, raspberry, pistachio',
    },
    image: UNSPLASH('1569864358642-9d1684040f43'),
  },
];
