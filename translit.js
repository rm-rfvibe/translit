'use strict';

const MAP = Object.freeze({
  'а': 'a',   'б': 'b',   'в': 'v',   'г': 'g',   'д': 'd',
  'е': 'e',   'ё': 'yo',  'ж': 'zh',  'з': 'z',   'и': 'i',
  'й': 'y',   'к': 'k',   'л': 'l',   'м': 'm',   'н': 'n',
  'о': 'o',   'п': 'p',   'р': 'r',   'с': 's',   'т': 't',
  'у': 'u',   'ф': 'f',   'х': 'kh',  'ц': 'ts',  'ч': 'ch',
  'ш': 'sh',  'щ': 'shch','ъ': '',    'ы': 'y',   'ь': '',
  'э': 'e',   'ю': 'yu',  'я': 'ya',
});

function transliterate(text) {
  let result = '';
  for (const char of text) {
    const lower = char.toLowerCase();
    if (lower in MAP) {
      const mapped = MAP[lower];
      result += char === lower ? mapped : capitalize(mapped);
    } else {
      result += char;
    }
  }
  return result;
}

function capitalize(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

module.exports = { transliterate };
