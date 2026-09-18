import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const newsDir = path.join(__dirname, '..', 'src', 'content', 'news');

// Маппинг serviceSlug → image
const imageMap = {
  'diagnostika-dvigatelya': '/images/services/diagnostika-dvigatelya-main.jpg',
  'diagnostika-i-remont-forsunok': '/images/services/diagnostika-i-remont-forsunok-main.jpg',
  'diagnostika-i-remont-mkpp': '/images/services/diagnostika-i-remont-mkpp-main.jpg',
  'diagnostika-podveski': '/images/services/diagnostika-podveski-main.jpg',
  'avtoelektrika': '/images/services/avtoelektrika-1.jpg',
  'elektrosamokaty-i-elektroskutery': '/images/services/elektrosamokaty-i-elektroskutery-main.jpg',
  'elektrovelosipedy': '/images/services/elektrovelosipedy-main.jpg',
  'evakuator-minsk-ceny': '/images/services/evakuator-minsk-ceny-main.jpg',
  'evakuator-minskaya-oblast': '/images/services/evakuator-minskaya-oblast-1.jpg',
  'evakuator-po-belarusi': '/images/services/evakuator-po-belarusi-1.jpg',
  'evakuator-v-minske': '/images/services/evakuator-v-minske-7.jpg',
  'originalnye-masla-po-samym-nizkim-cenam': '/images/services/originalnye-masla-po-samym-nizkim-cenam-main.jpg',
  'podmennyj-avtomobil': '/images/services/podmennyj-avtomobil-main.jpg',
  'promyvka-toplivnogo-baka': '/images/services/promyvka-toplivnogo-baka-main.jpg',
  'remont-avtomobilej-gazel-35-rublej-s-nds': '/images/services/remont-avtomobilej-gazel-35-rublej-s-nds-main.jpg',
  'remont-i-zamena-rulevoj-rejki': '/images/services/remont-i-zamena-rulevoj-rejki-main.jpg',
  'remont-kardannyh-valov': '/images/services/remont-kardannyh-valov-main.jpg',
  'remont-turbin': '/images/services/remont-turbin-main.jpg',
  'remont-vyhlopnoj-sistemy': '/images/services/remont-vyhlopnoj-sistemy-main.jpg',
  'shinomontazh': '/images/services/shinomontazh-main.jpg',
  'slesarnye-raboty': '/images/services/slesarnye-raboty-1.jpg',
  'velosipedy': '/images/services/velosipedy-main.jpg',
  'zamena-amortizatorov': '/images/services/zamena-amortizatorov-main.jpg',
  'zamena-i-remont-generatora': '/images/services/zamena-i-remont-generatora-main.jpg',
  'zamena-i-remont-rulevogo-upravleniya': '/images/services/zamena-i-remont-rulevogo-upravleniya-main.jpg',
  'zamena-i-remont-startera': '/images/services/zamena-i-remont-startera-main.jpg',
  'zamena-masla': '/images/services/zamena-masla-main.jpg',
  'zamena-masla-dlya-taksi': '/images/services/zamena-masla-dlya-taksi-main.jpg',
  'zamena-privodnyh-remnej': '/images/services/zamena-privodnyh-remnej-main.jpg',
  'zamena-remnya-grm': '/images/services/zamena-remnya-grm-main.jpg',
  'zamena-sajlentblokov': '/images/services/zamena-sajlentblokov-main.jpg',
  'zamena-scepleniya': '/images/services/zamena-scepleniya-main.jpg',
  'zamena-stupichnogo-podshipnika': '/images/services/zamena-stupichnogo-podshipnika-main.jpg',
  'zamena-svechej': '/images/services/zamena-svechej-main.jpg',
  'kompyuternaya-diagnostika-i-remont-elektriki-avtomobilya': '/images/services/kompyuternaya-diagnostika-i-remont-elektriki-avtomobilya-main.jpg',
  'proverka-avto-pered-pokupkoj': '/images/services/proverka-avto-pered-pokupkoj-main.jpg',
  'evakuaciya-legkovyh-avtomobilej': '/images/services/evakuaciya-legkovyh-avtomobilej-main.png',
  'evakuaciya-minivenov-i-mikroavtobusov': '/images/services/evakuaciya-minivenov-i-mikroavtobusov-main.jpg',
  'evakuaciya-gruzovyh-avtomobilej': '/images/services/evakuaciya-gruzovyh-avtomobilej-main.jpg',
  'evakuaciya-avtomobilej-vesom-do-25-tonn': '/images/services/evakuaciya-avtomobilej-vesom-do-25-tonn-main.jpg',
  'evakuaciya-avtomobilej-bolee-25-tonn': '/images/services/evakuaciya-avtomobilej-bolee-25-tonn-main.jpg',
  'diagnostika-i-remont-tormoznoj-sistemy-protochka-tormoznyh-diskov': '/images/services/diagnostika-i-remont-tormoznoj-sistemy-protochka-tormoznyh-diskov-main.jpg',
  'suharevo': '/images/services/suharevo-1.jpg',
  'malinovka': '/images/services/malinovka-1.jpg',
  'rzhavec': '/images/services/rzhavec-1.jpg',
  // Запасные для статей без специфического изображения
  'zapravka-kondicionera': '/images/services/slesarnye-raboty-2.jpg',
  'zapchasti-dlya-kitajskih-avtomobilej': '/images/services/car-engine-diagnostic.jpg',
  'obsluzhivanie-kitajskih-avtomobilej': '/images/services/car-engine-diagnostic.jpg',
  'trezvyj-voditel': '/images/services/evakuator-v-minske-7.jpg',
  'vibrostend': '/images/services/diagnostika-podveski-main.jpg',
  'proverka-podveski-v-dvizhenii': '/images/services/car-suspension-brakes.jpg',
  'kompleksnaya-diagnostika-avtomobilya': '/images/services/car-engine-diagnostic.jpg',
  'promyvka-forsunok': '/images/services/car-engine-diagnostic.jpg',
};

const files = fs.readdirSync(newsDir).filter((f) => f.endsWith('.md'));
let updated = 0;

for (const file of files) {
  const filePath = path.join(newsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Извлекаем serviceSlug из frontmatter
  const serviceSlugMatch = content.match(/serviceSlug:\s*"([^"]+)"/);
  if (!serviceSlugMatch) continue;

  const serviceSlug = serviceSlugMatch[1];
  const imagePath = imageMap[serviceSlug];

  if (!imagePath) {
    console.log(`SKIP (no image): ${file} — ${serviceSlug}`);
    continue;
  }

  // Проверяем, есть ли уже image в frontmatter
  if (content.includes('image:')) {
    console.log(`SKIP (has image): ${file}`);
    continue;
  }

  // Добавляем image после pubDate
  const updatedContent = content.replace(
    /(pubDate:\s*"[^"]+"\n)/,
    `$1  image: "${imagePath}"\n`
  );

  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`OK: ${file} — ${imagePath}`);
    updated++;
  }
}

console.log(`\nDone. Updated ${updated} files.`);
