const puppeteer = require('puppeteer');

// Función sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true, // necesario para servidores sin GUI
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://licencias.mtc.gob.pe/#/index', { waitUntil: 'networkidle2' });

  // 1️⃣ Esperar modal inicial y cerrar
  try {
    await page.waitForSelector('app-popupanuncio button', { timeout: 5000 });
    await page.click('app-popupanuncio button');
    console.log('Modal inicial cerrado');
  } catch {
    console.log('No apareció el modal inicial');
  }

  // 2️⃣ Ingresar DNI
  const dni = '02440511';
  await page.waitForSelector('#mat-input-0');
  await page.type('#mat-input-0', dni, { delay: 100 });

  // 3️⃣ Marcar primer checkbox "No soy un robot"
  await page.waitForSelector('#mat-checkbox-1-input');
  await page.click('#mat-checkbox-1-input');

  // 4️⃣ Resolver captcha (mapa de ejemplo)
  const captchaMap = {
    '1.png': 'anillo', '2.png': 'arbol', '3.png': 'auto',
    '4.png': 'avion', '5.png': 'bicicleta', '6.png': 'billetera',
    '7.png': 'botella', '8.png': 'camion', '9.png': 'cinturon',
    '10.png': 'desarmador', '11.png': 'edificio', '12.png': 'gafas',
    '13.png': 'gato', '14.png': 'laptop', '15.png': 'linterna',
    '16.png': 'llaves', '17.png': 'manzana', '18.png': 'media',
    '19.png': 'mesa', '20.png': 'mochila', '21.png': 'perro',
    '22.png': 'pez', '23.png': 'pinia', '24.png': 'platano',
    '25.png': 'puerta', '26.png': 'reloj', '27.png': 'scooter',
    '28.png': 'silla', '29.png': 'tasa', '30.png': 'tienda',
    '31.png': 'timon', '32.png': 'zapato'
  };

  await page.waitForSelector('app-captcha-imagenes-popup img');
  const consigna = await page.$eval('app-captcha-imagenes-popup .tituloConsigna p', el => el.innerText.toLowerCase());
  const imgs = await page.$$('app-captcha-imagenes-popup img');
  for (const img of imgs) {
    const src = await (await img.getProperty('src')).jsonValue();
    const file = src.split('/').pop();
    if (captchaMap[file] && captchaMap[file].toLowerCase() === consigna.replace('selecciona la imagen de ', '').trim()) {
      await img.click();
      console.log(`Captcha resuelto: ${captchaMap[file]}`);
      break;
    }
  }

  await sleep(2000);

  // 5️⃣ Segundo checkbox "Sí, acepto"
  await page.waitForSelector('#mat-checkbox-2-input');
  await page.click('#mat-checkbox-2-input');
  console.log('Segundo checkbox marcado');

  await sleep(1000);

  // 6️⃣ Botón Buscar
  await page.waitForSelector('button.mat-raised-button');
  await page.click('button.mat-raised-button');

  // 7️⃣ Esperar resultados
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.waitForSelector('app-search');

  // 8️⃣ Extraer datos del conductor
  const datosConductor = await page.evaluate(() => {
    const campos = Array.from(document.querySelectorAll('app-search input[readonly]'));
    const labels = Array.from(document.querySelectorAll('app-search mat-label'));
    const result = {};
    for (let i = 0; i < campos.length; i++) {
      const label = labels[i]?.innerText.trim();
      const value = campos[i]?.value?.trim();
      if (label) result[label] = value;
    }
    return result;
  });

  console.log('Datos del conductor:', datosConductor);

  await browser.close();
})();
