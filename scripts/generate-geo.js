const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'src', 'content', 'services');
const geoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'geo-data.json'), 'utf8'));

// Classify locations: Minsk districts vs region cities
// Minsk districts (within or near MKAD)
const minskDistricts = new Set([
    'angarskaya', 'brilevichi', 'chizhovka', 'cnyanka', 'drazhnya', 'druzhba',
    'grushevka', 'harkovskaya', 'kamennaya-gorka', 'kaskad', 'kolyadichi-tamozhnya',
    'komarovka', 'krasnyj-bor', 'kuncevshchina', 'kurasovshchina', 'lebyazhij',
    'loshica', 'malinovka', 'masyukovshchina', 'medvezhino', 'mihalovo',
    'minsk-mir', 'novinki', 'petrovshchina', 'rzhavec', 'serebryanka', 'serova',
    'severnyj-posyolok', 'slepyanka', 'stepyanka', 'suharevo', 'tivali',
    'trostenec', 'uruche', 'vesnyanka', 'vostok', 'yugo-zapad', 'zapad',
    'zelyonyj-lug', 'shabany', 'cherven' // Cherven is actually a region city, remove later
]);

// Remove false positives - these are region cities
const regionCities = new Set([
    'berezino', 'borisov', 'cherven', 'dzerzhinsk', 'fanipol', 'hatezhino',
    'kleck', 'kopyl', 'krupki', 'logojsk', 'lyuban', 'marina-gorka',
    'molodechno', 'myadel', 'nesvizh', 'pleshchenicy', 'radoshkovichi',
    'rakov', 'rudensk', 'senica', 'sluck', 'smolevichi', 'soligorsk',
    'sosny', 'starye-dorogi', 'stolbcy', 'uzda', 'velikij-les', 'vilejka',
    'volozhin', 'zaslavl', 'zhodino', 'aeroport', 'vostochnyj', 'sokol',
    'ozerishche'
]);

// Approximate distances from MKAD for region cities (km)
const distances = {
    'aeroport': 10, 'berezino': 100, 'borisov': 70, 'cherven': 65,
    'dzerzhinsk': 25, 'fanipol': 20, 'hatezhino': 25, 'kleck': 105,
    'kopyl': 90, 'krupki': 120, 'logojsk': 40, 'lyuban': 130,
    'marina-gorka': 55, 'molodechno': 70, 'myadel': 140, 'nesvizh': 115,
    'pleshchenicy': 30, 'radoshkovichi': 30, 'rakov': 40, 'rudensk': 35,
    'senica': 15, 'sluck': 130, 'smolevichi': 30, 'soligorsk': 130,
    'sosny': 10, 'starye-dorogi': 145, 'stolbcy': 65, 'uzda': 50,
    'velikij-les': 8, 'vilejka': 90, 'volozhin': 75, 'zaslavl': 25,
    'zhodino': 55, 'vostochnyj': 10, 'sokol': 5, 'ozerishche': 12
};

// Clean location name from title - keep preposition (в, на, во, из)
function getLocationName(title) {
    let name = title
        .replace(/^Дешёвый эвакуатор (автомобилей |авто )?/i, '')
        .replace(/ от \d+ рублей$/i, '')
        .replace(/^в районе станции метро /i, 'в районе ')
        .replace(/^в микрорайоне /i, 'в ')
        .trim();
    return name;
}

// Nominative/accusative forms for region cities (for "в [acc]" direction)
const nominativeNames = {
    'aeroport': 'Аэропорт', 'berezino': 'Березино', 'borisov': 'Борисов',
    'cherven': 'Червень', 'dzerzhinsk': 'Дзержинск', 'fanipol': 'Фаниполь',
    'hatezhino': 'Хатежино', 'kleck': 'Клецк', 'kopyl': 'Копыль',
    'krupki': 'Крупки', 'logojsk': 'Логойск', 'lyuban': 'Любань',
    'marina-gorka': 'Марьину Горку', 'molodechno': 'Молодечно',
    'myadel': 'Мядель', 'nesvizh': 'Несвиж', 'pleshchenicy': 'Плещеницы',
    'radoshkovichi': 'Радошковичи', 'rakov': 'Раков', 'rudensk': 'Руденск',
    'senica': 'Сеницу', 'sluck': 'Слуцк', 'smolevichi': 'Смолевичи',
    'soligorsk': 'Солигорск', 'sosny': 'Сосны', 'starye-dorogi': 'Старые Дороги',
    'stolbcy': 'Столбцы', 'uzda': 'Узду', 'velikij-les': 'Великий Лес',
    'vilejka': 'Вилейку', 'volozhin': 'Воложин', 'zaslavl': 'Заславль',
    'zhodino': 'Жодино', 'vostochnyj': 'Восточный', 'sokol': 'Сокол',
    'ozerishche': 'Озерище'
};

// Genitive forms for "до" and "из"
const genitiveNames = {
    'aeroport': 'Аэропорта', 'berezino': 'Березино', 'borisov': 'Борисова',
    'cherven': 'Червеня', 'dzerzhinsk': 'Дзержинска', 'fanipol': 'Фаниполя',
    'hatezhino': 'Хатежино', 'kleck': 'Клецка', 'kopyl': 'Копыля',
    'krupki': 'Крупок', 'logojsk': 'Логойска', 'lyuban': 'Любани',
    'marina-gorka': 'Марьиной Горки', 'molodechno': 'Молодечно',
    'myadel': 'Мяделя', 'nesvizh': 'Несвижа', 'pleshchenicy': 'Плещениц',
    'radoshkovichi': 'Радошкович', 'rakov': 'Ракова', 'rudensk': 'Руденска',
    'senica': 'Сеницы', 'sluck': 'Слуцка', 'smolevichi': 'Смолевич',
    'soligorsk': 'Солигорска', 'sosny': 'Сосен', 'starye-dorogi': 'Старых Дорог',
    'stolbcy': 'Столбцов', 'uzda': 'Узды', 'velikij-les': 'Великого Леса',
    'vilejka': 'Вилейки', 'volozhin': 'Воложина', 'zaslavl': 'Заславля',
    'zhodino': 'Жодино', 'vostochnyj': 'Восточного', 'sokol': 'Сокола',
    'ozerishche': 'Озерища'
};

// Get bare name without preposition
function getBareName(name) {
    return name
        .replace(/^(в районе|в|на|во|из)\s+/i, '')
        .trim();
}

// Determine if this is a Minsk district or region city
function isMinskDistrict(slug) {
    if (regionCities.has(slug)) return false;
    if (minskDistricts.has(slug)) return true;
    // Default: if no distance info, treat as Minsk district
    return !distances[slug];
}

// Generate article for a Minsk district
function generateMinskDistrict(item) {
    const name = getLocationName(item.title);
    const bare = getBareName(name);
    const slug = item.slug;
    const intro = item.intro;

    return `---
title: "Эвакуатор ${name}"
metaTitle: "Эвакуатор ${name} (Минск) — от 50 BYN, 24/7 | Ржавый Гараж"
description: "Эвакуатор ${name} в Минске. Подача от 20 минут, круглосуточно. Легковые, джипы, микроавтобусы. От 50 BYN. Звоните +375 29 373-71-61."
slug: "${slug}"
category: "geo"
image: "/images/services/tow-truck.jpg"
priceFrom: "от 50 BYN"
executionTime: "подача от 20 минут"
featured: false
relatedServices:
  - evakuator-v-minske
  - evakuator-minsk-ceny
  - evakuator-minsk-i-minskij-rajon
  - evakuaciya-legkovyh-avtomobilej
---

${intro}

## Услуги эвакуатора ${name}

| Услуга | Цена, BYN |
|---|---|
| Эвакуация легкового авто по Минску | от 50 |
| Эвакуация джипа / минивэна (до 2,5 т) | от 55 |
| Эвакуация микроавтобуса (более 2,5 т) | от 60 |
| Погрузка с заблокированными колёсами | от +10 |
| Вытаскивание из кювета, снега, грязи | от 100 |
| Замена колеса (легковое) | от 17,50 |
| Запуск двигателя (прикуривание) | от 15 |

## Когда нужен эвакуатор ${name}

- **Двигатель заглох** — не заводится, нужно доставить в автосервис
- **ДТП** — после аварии, если авто не на ходу
- **Пробило колесо** — а запаски нет или не можете поменять
- **Заклинило КПП** — нельзя ехать своим ходом
- **Сел аккумулятор** — прикуривание не помогло
- **Попали в кювет** — нужно вытянуть и погрузить
- **Эвакуация после алкоголя** — машина осталась на стоянке

## Преимущества

- **Быстрая подача** — от 20 минут, водители знают район
- **Круглосуточно** — 24/7, без выходных
- **Любой транспорт** — легковые, джипы, микроавтобусы
- **Бережная погрузка** — покаты и мягкие стропы
- **Прозрачные цены** — стоимость до начала работ
- **Сохранность авто** — материальная ответственность

## Часто задаваемые вопросы

### Как быстро приедет эвакуатор ${name}?

Подача по Минску — от 20 минут. Водители базируются в разных районах города, поэтому мы приедем максимально быстро.

### Сколько стоит эвакуатор ${name}?

Эвакуация легкового авто — от 50 BYN. Джипа или минивэна — от 55 BYN. Доплата за заблокированные колёса — от 10 BYN. Точную цену назовём до начала работ.

### Работаете ли вы ночью ${name}?

Да, мы работаем круглосуточно — 24/7. Вы можете вызвать эвакуатор в любой день недели, днём и ночью.

---

**СТО «Ржавый Гараж»** — Беларусь, Минск, Передовая ул., д. 6, корп. 12. ПН–ВС 08:00–20:00. ☎ +375 29 373-71-61.
`;
}

// Generate article for a region city
function generateRegionCity(item) {
    const name = getLocationName(item.title);
    const bare = getBareName(name);
    const acc = nominativeNames[item.slug] || bare; // accusative/nominative for direction
    const gen = genitiveNames[item.slug] || bare; // genitive for "до", "из"
    const slug = item.slug;
    const intro = item.intro;
    const dist = distances[slug] || 30;
    const estimatedPrice = 50 + dist * 2;

    return `---
title: "Эвакуатор ${name}"
metaTitle: "Эвакуатор ${name} — от ${estimatedPrice} BYN, 24/7 | Ржавый Гараж"
description: "Эвакуатор ${name}. Подача из Минска от 30 минут. Легковые, джипы, микроавтобусы. От ${estimatedPrice} BYN. Круглосуточно. +375 29 373-71-61."
slug: "${slug}"
category: "geo"
image: "/images/services/tow-truck.jpg"
priceFrom: "от ${estimatedPrice} BYN"
executionTime: "подача от 30 минут"
featured: false
relatedServices:
  - evakuator-minskaya-oblast
  - evakuator-v-minske
  - evakuator-po-belarusi
  - evakuaciya-legkovyh-avtomobilej
---

${intro}

## Услуги эвакуатора ${name}

| Услуга | Цена, BYN |
|---|---|
| Эвакуация легкового авто (по Минску) | от 50 |
| Эвакуация за МКАД | 1 BYN/км (в обе стороны) |
| Эвакуация джипа / минивэна (до 2,5 т) | от 55 |
| Эвакуация микроавтобуса (более 2,5 т) | от 60 |
| Погрузка с заблокированными колёсами | от +10 |
| Вытаскивание из кювета, снега, грязи | от 100 |

## Как рассчитывается стоимость

Стоимость эвакуации ${name} = **базовая цена по Минску (50 BYN) + километраж за МКАД (1 BYN/км, в обе стороны)**.

Расстояние от МКАД до ${gen} — примерно ${dist} км.

Ориентировочная стоимость: **50 + ${dist} × 2 × 1 = ${estimatedPrice} BYN** (для легкового авто).

Точную стоимость назовём при заказе — зависит от типа авто и сложности погрузки.

## Когда нужен эвакуатор ${name}

- **Сломались на трассе** — двигатель заглох, перегрев, обрыв ремня
- **ДТП** — после аварии, авто не на ходу
- **Пробили колесо** — а запаски нет
- **Сел аккумулятор** — особенно зимой
- **Попали в кювет** — гололёд, занос
- **Эвакуация из ${gen} в Минск** — доставка в автосервис

## Преимущества

- **Круглосуточно** — 24/7, выезжаем в любое время
- **Подача от 30 минут** — из Минска в ${acc}
- **Любой транспорт** — от легковых до грузовиков
- **Бережная перевозка** — покаты, мягкие стропы
- **Прозрачные цены** — называем стоимость до выезда
- **Опытные водители** — работают в любых погодных условиях

## Часто задаваемые вопросы

### Как быстро приедет эвакуатор ${name}?

Из Минска — от 30 минут до ${gen}. Время зависит от расстояния и загруженности дорог.

### Сколько стоит эвакуатор ${name}?

Ориентировочно: 50 + ${dist} × 2 × 1 = ${estimatedPrice} BYN (для легкового авто). Точную стоимость назовём при заказе.

### Выезжаете ли вы на трассу?

Да, мы выезжаем на все трассы Минской области. Позвоните, сообщите километр и направление — приедем.

### Можно ли оплатить безналично?

Да, мы работаем с наличным и безналичным расчётом. Для организаций — с закрывающими документами.

---

**СТО «Ржавый Гараж»** — Беларусь, Минск, Передовая ул., д. 6, корп. 12. ПН–ВС 08:00–20:00. ☎ +375 29 373-71-61.
`;
}

// Generate all articles
let minskCount = 0;
let regionCount = 0;

for (const item of geoData) {
    const isDistrict = isMinskDistrict(item.slug);
    const content = isDistrict ? generateMinskDistrict(item) : generateRegionCity(item);
    const filePath = path.join(servicesDir, item.file);
    fs.writeFileSync(filePath, content, 'utf8');

    if (isDistrict) {
        minskCount++;
    } else {
        regionCount++;
    }
}

console.log(`Generated ${minskCount} Minsk district articles and ${regionCount} region city articles.`);
console.log(`Total: ${minskCount + regionCount} articles.`);
