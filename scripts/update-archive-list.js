import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к папке с архивными PDF
const archiveDir = path.join(__dirname, '../public/pdfs/archive');
// Путь к JSON файлу со списком
const outputFile = path.join(__dirname, '../public/archive-list.json');

try {
  // Проверяем существование папки
  if (!fs.existsSync(archiveDir)) {
    console.log(`Папка ${archiveDir} не найдена. Создаю пустой список.`);
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
    process.exit(0);
  }

  // Читаем все файлы из папки
  const files = fs.readdirSync(archiveDir);
  
  // Фильтруем только PDF файлы и исключаем текущий выпуск (2022-2024)
  const pdfFiles = files
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .filter(file => !file.includes('2022-2024')) // Исключаем текущий выпуск
    .sort(); // Сортируем по алфавиту

  // Формируем список файлов с названиями
  const archiveList = pdfFiles.map(filename => {
    // Извлекаем годы из имени файла (формат: kines-YYYY-YYYY или подобный)
    const match = filename.match(/(\d{4})[\s-]+(\d{4})/);
    let displayName;
    
    if (match) {
      displayName = `КИнЭС ${match[1]}–${match[2]}`;
    } else {
      // Если годы не найдены, используем имя файла как есть
      displayName = filename
        .replace(/\.pdf$/i, '')
        .replace(/kines-?/i, 'КИнЭС ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return {
      filename,
      displayName,
    };
  });

  // Записываем в JSON файл
  fs.writeFileSync(outputFile, JSON.stringify(archiveList, null, 2), 'utf-8');
  
  console.log(`✓ Обновлен список архивных файлов: ${archiveList.length} файлов`);
  console.log(`  Файлы: ${pdfFiles.join(', ')}`);
} catch (error) {
  console.error('Ошибка при обновлении списка архивных файлов:', error);
  process.exit(1);
}
