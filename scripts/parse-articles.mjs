// Парсер статей с rgarage.by → markdown-файлы для Astro Content Collections
// Запуск: node scripts/parse-articles.mjs
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'services');
const IMAGES_DIR = join(ROOT, 'public', 'images', 'services');

const BASE = 'https://rgarage.by';

// Все slug'и из sitemap (только /autoservice/)
const slugs = [
  // Основные услуги
  'zamena-i-remont-generatora',
  'zamena-i-remont-startera',
  'kompyuternaya-diagnostika-i-remont-elektriki-avtomobilya',
  'ustanovka-i-podklyuchenie-farkopa',
  'zamena-masla-dlya-taksi',
  'originalnye-masla-po-samym-nizkim-cenam',
  'remont-avtomobilej-gazel-35-rublej-s-nds',
  'zamena-masla',
  'antikorrozijnaya-obrabotka-avtomobilya',
  'polirovka-pokraska-avto',
  'podbor-avtoemalej',
  'promyvka-forsunok',
  'remont-kardannyh-valov',
  'remont-turbin',
  'diagnostika-dvigatelya',
  'diagnostika-i-remont-mkpp',
  'diagnostika-i-remont-forsunok',
  'diagnostika-i-remont-tormoznoj-sistemy-protochka-tormoznyh-diskov',
  'diagnostika-podveski',
  'zamena-amortizatorov',
  'zamena-i-remont-rulevogo-upravleniya',
  'zamena-privodnyh-remnej',
  'zamena-remnya-grm',
  'zamena-sajlentblokov',
  'zamena-svechej',
  'zamena-stupichnogo-podshipnika',
  'zamena-scepleniya',
  'kompleksnaya-diagnostika-avtomobilya',
  'proverka-avto-pered-pokupkoj',
  'promyvka-toplivnogo-baka',
  'razval-shozhdenie',
  'remont-vyhlopnoj-sistemy',
  'remont-i-zamena-rulevoj-rejki',
  'shinomontazh',
  'podmennyj-avtomobil',
  'slesarnye-raboty',
  'avtoelektrika',
  'electro',
  // Эвакуатор
  'evakuator-minsk-ceny',
  'evakuaciya-avtomobilej-bolee-25-tonn',
  'evakuaciya-avtomobilej-vesom-do-25-tonn',
  'evakuaciya-gruzovyh-avtomobilej',
  'evakuaciya-legkovyh-avtomobilej',
  'evakuaciya-minivenov-i-mikroavtobusov',
  'evakuator-v-minske',
  'evakuator-minsk-i-minskij-rajon',
  'evakuator-minskaya-oblast',
  'evakuator-po-belarusi',
  // Гео — районы Минска
  'angarskaya','brilevichi','velikij-les','vesnyanka','vostok','vostochnyj',
  'grushevka','drazhnya','druzhba','zapad','zelyonyj-lug','kamennaya-gorka',
  'kaskad','kolyadichi-tamozhnya','komarovka','krasnyj-bor','kuncevshchina',
  'kurasovshchina','lebyazhij','loshica','malinovka','masyukovshchina',
  'medvezhino','minsk-mir','mihalovo','novinki','ozerishche','petrovshchina',
  'rzhavec','severnyj-posyolok','serebryanka','serova','slepyanka','sokol',
  'sosny','stepyanka','suharevo','tivali','trostenec','uruche','harkovskaya',
  'cnyanka','chizhovka','shabany','yugo-zapad','aeroport',
  // Гео — города Беларуси
  'berezino','borisov','vilejka','volozhin','dzerzhinsk','zhodino','zaslavl',
  'kleck','kopyl','krupki','logojsk','lyuban','marina-gorka','molodechno',
  'myadel','nesvizh','pleshchenicy','radoshkovichi','rakov','rudensk','senica',
  'sluck','smolevichi','soligorsk','starye-dorogi','stolbcy','uzda','fanipol',
  'hatezhino','cherven',
  // Прочее
  'trezvyj-voditel',
  'velosipedy',
  'elektrovelosipedy',
  'elektrosamokaty-i-elektroskutery',
];

// Категории для frontmatter
function guessCategory(slug) {
  const geoSlugs = new Set([
    'angarskaya','brilevichi','velikij-les','vesnyanka','vostok','vostochnyj',
    'grushevka','drazhnya','druzhba','zapad','zelyonyj-lug','kamennaya-gorka',
    'kaskad','kolyadichi-tamozhnya','komarovka','krasnyj-bor','kuncevshchina',
    'kurasovshchina','lebyazhij','loshica','malinovka','masyukovshchina',
    'medvezhino','minsk-mir','mihalovo','novinki','ozerishche','petrovshchina',
    'rzhavec','severnyj-posyolok','serebryanka','serova','slepyanka','sokol',
    'sosny','stepyanka','suharevo','tivali','trostenec','uruche','harkovskaya',
    'cnyanka','chizhovka','shabany','yugo-zapad','aeroport',
    'berezino','borisov','vilejka','volozhin','dzerzhinsk','zhodino','zaslavl',
    'kleck','kopyl','krupki','logojsk','lyuban','marina-gorka','molodechno',
    'myadel','nesvizh','pleshchenicy','radoshkovichi','rakov','rudensk','senica',
    'sluck','smolevichi','soligorsk','starye-dorogi','stolbcy','uzda','fanipol',
    'hatezhino','cherven',
  ]);
  if (geoSlugs.has(slug)) return 'geo';
  if (slug.startsWith('evakuaciya') || slug.startsWith('evakuator')) return 'evakuator';
  if (slug.includes('diagnostika')) return 'diagnostics';
  if (slug === 'remont-turbin') return 'turbin';
  if (slug === 'shinomontazh') return 'shinomontazh';
  if (slug.includes('elektr') || slug === 'electro') return 'avtoelektrika';
  if (slug.includes('zamena') || slug.includes('remont') || slug.includes('slesarnye')) return 'slesarnye';
  if (slug.includes('masla')) return 'services';
  if (slug.includes('pokraska') || slug.includes('antikorrozijnaya') || slug.includes('podbor-avtoemalej')) return 'kuzov';
  if (slug === 'podmennyj-avtomobil') return 'services';
  if (slug === 'trezvyj-voditel' || slug.includes('velosipedy') || slug.includes('elektrosamokaty') || slug.includes('elektroskutery')) return 'other';
  return 'services';
}

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buffer);
    return basename(destPath);
  } catch (e) {
    console.warn(`  ⚠ Не удалось скачать картинку: ${url}`);
    return null;
  }
}

async function parsePage(slug) {
  const url = `${BASE}/autoservice/${slug}`;
  console.log(`Парсинг: ${slug}`);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  if (!res.ok) {
    console.warn(`  ⚠ HTTP ${res.status} для ${slug}`);
    return null;
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Извлекаем метаданные
  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const h1 = $('h1').first().text().trim() || title;

  // Контент статьи — в .jbzoo-item (Joomla ZOO + JBZoo) или .yoo-zoo (категории)
  let itemEl = $('.jbzoo-item').first();
  if (itemEl.length === 0) {
    // Fallback для страниц-категорий (например, podmennyj-avtomobil)
    itemEl = $('.yoo-zoo').first();
  }
  if (itemEl.length === 0) {
    console.warn(`  ⚠ Не найден контейнер контента для ${slug}`);
    return null;
  }

  // Извлекаем только нужные элементы контента:
  // .element-textarea — основной текст статьи
  // .element-jbimage — картинка статьи
  // .element-jbhtml — HTML-блоки (таблицы цен и т.д.)
  // .element-textarea .sppb-addon-content — контент в SP Page Builder
  const contentPieces = [];

  // 1. Картинка статьи (.element-jbimage или img в .description-full)
  const jbimage = itemEl.find('.element-jbimage').first();
  let mainImgSrc = null;
  if (jbimage.length > 0) {
    const img = jbimage.find('img').first();
    if (img.length > 0) mainImgSrc = img.attr('src') || '';
  }
  // Fallback: первая картинка в .description-full
  if (!mainImgSrc) {
    const descImg = itemEl.find('.description-full img').first();
    if (descImg.length > 0) mainImgSrc = descImg.attr('src') || '';
  }
  if (mainImgSrc) {
    let src = mainImgSrc;
    if (src.startsWith('/')) src = `${BASE}${src}`;
    if (src.startsWith('http')) {
      const ext = extname(src.split('?')[0]) || '.jpg';
      const imgName = `${slug}-main${ext}`;
      const downloaded = await downloadImage(src, join(IMAGES_DIR, imgName));
      if (downloaded) {
        contentPieces.push(`<img src="/images/services/${downloaded}" alt="${h1.replace(/"/g, '&quot;')}" />`);
      }
    }
  }

  // 2. Текстовый блок (.element-textarea или .description-full) — основной контент
  // Берём только первый (остальные часто дублируют)
  let textarea = itemEl.find('.element-textarea').first();
  if (textarea.length === 0 || textarea.text().trim().length < 10) {
    // Fallback для страниц-категорий
    textarea = itemEl.find('.description-full').first();
  }
  if (textarea.length > 0 && textarea.text().trim().length > 10) {
    // Очищаем от кнопок и форм перед конвертацией
    textarea.find('.uk-button, .uk-grid, .uk-panel, .widgetkit, script, style, form').remove();
    textarea.find('a[href^="tel:"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text.match(/^\+?375/) || text.includes('ЗВОНИТЕ')) $(el).remove();
    });
    contentPieces.push(textarea.html());
  }

  // 3. HTML-блоки (.element-jbhtml) — таблицы цен и т.д.
  itemEl.find('.element-jbhtml').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text.length < 10) return;
    contentPieces.push($el.html());
  });

  // 4. Если .element-textarea не найдены — берём .sppb-addon-content (SP Page Builder)
  if (contentPieces.length <= 1) {
    itemEl.find('.sppb-addon-content').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text.length < 10) return;
      contentPieces.push($el.html());
    });
  }

  // 5. Если всё ещё пусто — берём все <p>, <h2>, <h3>, <ul>, <ol>, <table> из .well
  if (contentPieces.length <= 1) {
    const well = itemEl.find('.well').first();
    if (well.length > 0) {
      // Удаляем мусор из well
      well.find('.element-joomlamodule, .uk-grid, .uk-panel, .uk-button, script, style, .callback, form, .widgetkit').remove();
      well.find('a[href^="tel:"]').each((i, el) => {
        const text = $(el).text().trim();
        if (text.match(/^\+?375/) || text.includes('ЗВОНИТЕ')) $(el).remove();
      });
      const text = well.text().trim();
      if (text.length > 20) {
        contentPieces.push(well.html());
      }
    }
  }

  // 6. Fallback — ищем все <p> с осмысленным текстом на странице
  if (contentPieces.length === 0) {
    const contentArea = $('#sp-component, .component, main, #main, .t3-content, .body-innerwrapper').first();
    if (contentArea.length > 0) {
      contentArea.find('script, style, nav, footer, .header, .footer, form, .modal, .menu, .navbar, .social, .copyright, .phone, .logo, .breadcrumb, .sidebar, .widget, .banner, .callback, .widgetkit, .uk-button').remove();
      contentArea.find('h1').first().remove();
      contentArea.find('a[href^="tel:"]').each((i, el) => {
        const text = $(el).text().trim();
        if (text.match(/^\+?375/) || text.includes('ЗВОНИТЕ')) $(el).remove();
      });
      const text = contentArea.text().trim();
      if (text.length > 20) {
        contentPieces.push(contentArea.html());
      }
    }
  }

  if (contentPieces.length === 0) {
    console.warn(`  ⚠ Пустой контент для ${slug}`);
    return null;
  }

  // Объединяем все куски контента
  const contentHtml = contentPieces.join('\n\n');

  // Скачиваем дополнительные картинки из контента (не главную)
  const images = [];
  const tempDiv = cheerio.load(`<div>${contentHtml}</div>`)('div');
  tempDiv.find('img').each((i, img) => {
    const $img = tempDiv.find(img);
    let src = $img.attr('src') || '';
    if (!src || src.startsWith('/images/services/')) return; // уже скачана (главная)
    if (src.startsWith('/')) src = `${BASE}${src}`;
    if (!src.startsWith('http')) return;
    if (src.includes('logo') || src.includes('icon') || src.includes('sprite') ||
        src.includes('widgetkit') || src.includes('social') || src.includes('.svg')) return;

    const ext = extname(src.split('?')[0]) || '.jpg';
    const imgName = `${slug}-${i + 1}${ext}`;
    downloadImage(src, join(IMAGES_DIR, imgName)).then(downloaded => {
      if (downloaded) images.push(`/images/services/${downloaded}`);
    });
  });

  // Конвертируем HTML → markdown
  let markdown = td.turndown(contentHtml);

  // Очищаем лишние пустые строки и мусор
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*[-–]\s*$/gm, '')
    .replace(/\[.*?\]\(tel:.*?\)/g, '') // ссылки на телефон
    .replace(/ЗВОНИТЕ!.*?\d.*?\n?/gi, '')
    .replace(/^\s*\*\s*$/gm, '') // пустые пункты списка
    .trim();

  // Главная картинка
  let mainImage = '/images/services/placeholder.webp';
  const firstImgMatch = markdown.match(/!\[.*?\]\((\/images\/services\/[^)]+)\)/);
  if (firstImgMatch) mainImage = firstImgMatch[1];

  const category = guessCategory(slug);

  // Формируем frontmatter
  const frontmatter = `---
title: "${h1.replace(/"/g, '\\"')}"
metaTitle: "${title.replace(/"/g, '\\"')}"
description: "${metaDescription.replace(/"/g, '\\"')}"
slug: "${slug}"
category: "${category}"
image: "${mainImage}"
originalUrl: "${url}"
parsedAt: "2026-08-20"
---`;

  const fullContent = `${frontmatter}\n\n# ${h1}\n\n${markdown}\n`;

  const destPath = join(CONTENT_DIR, `${slug}.md`);
  await writeFile(destPath, fullContent, 'utf-8');

  console.log(`  ✓ ${slug}.md (${markdown.length} символов)`);
  return { slug, title: h1, length: markdown.length };
}

async function main() {
  await mkdir(CONTENT_DIR, { recursive: true });
  await mkdir(IMAGES_DIR, { recursive: true });

  console.log(`Всего статей для парсинга: ${slugs.length}\n`);

  const results = [];
  const errors = [];

  for (const slug of slugs) {
    try {
      const result = await parsePage(slug);
      if (result) results.push(result);
      else errors.push(slug);
    } catch (e) {
      console.error(`  ✗ Ошибка для ${slug}: ${e.message}`);
      errors.push(slug);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Итог ===`);
  console.log(`Успешно: ${results.length}`);
  console.log(`Ошибок: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`Ошибки: ${errors.join(', ')}`);
  }

  // Статистика по длине
  const empty = results.filter(r => r.length < 50);
  const short = results.filter(r => r.length >= 50 && r.length < 500);
  const good = results.filter(r => r.length >= 500);
  console.log(`\nКачество контента:`);
  console.log(`  Пустые (<50 симв): ${empty.length}`);
  console.log(`  Короткие (50-500 симв): ${short.length}`);
  console.log(`  Хорошие (>500 симв): ${good.length}`);
  if (empty.length > 0) console.log(`  Пустые: ${empty.map(r => r.slug).join(', ')}`);
}

main().catch(console.error);
