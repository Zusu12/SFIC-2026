import { describe, it, expect } from 'vitest';
import { translateCode, tokenizePython } from '../utils/translator.js';
import teluguDictionary from '../dictionary/telugu.json' with { type: 'json' };

describe('Python CodeToTelugu Translator', () => {
  it('1. translates basic if, else, and print keywords', () => {
    const input = `if x > 5:\n    print("big")\nelse:\n    print("small")`;
    const translated = translateCode(input);
    expect(translated).toContain('oka vela x > 5:');
    expect(translated).toContain('chupinchu("big")');
    expect(translated).toContain('lekapothe:');
    expect(translated).toContain('chupinchu("small")');
  });

  it('2. handles elif correctly without colliding with if', () => {
    const input = `if score > 90:\n    print("A")\nelif score > 80:\n    print("B")\nelse:\n    print("C")`;
    const translated = translateCode(input);
    expect(translated).toContain('oka vela score > 90:');
    expect(translated).toContain('lekapothe oka vela ayithe score > 80:');
    expect(translated).toContain('lekapothe:');
    // Ensure elif was NOT converted to 'lekapothe oka vela' + 'oka vela' or corrupted
    expect(translated).not.toContain('lekapothe oka vela oka vela');
  });

  it('3. translates True and False correctly', () => {
    const input = `is_active = True\nis_admin = False`;
    const translated = translateCode(input);
    expect(translated).toBe(`is_active = Nijam\nis_admin = Abaddham`);
  });

  it('4. translates and, or, and in correctly', () => {
    const input = `if x and y:\n    print(1)\nif a or b:\n    print(2)\nif item in items:\n    print(3)`;
    const translated = translateCode(input);
    expect(translated).toContain('oka vela x mariyu y:');
    expect(translated).toContain('oka vela a leda b:');
    expect(translated).toContain('oka vela item lo items:');
  });

  it('5. preserves variable names such as gift, inside, android, and printer', () => {
    const input = `gift = 10\ninside = True\nandroid = "phone"\nprinter = 42\nprint(gift, inside, android, printer)`;
    const translated = translateCode(input);
    expect(translated).toContain('gift = 10');
    expect(translated).toContain('inside = Nijam');
    expect(translated).toContain('android = "phone"');
    expect(translated).toContain('printer = 42');
    expect(translated).toContain('chupinchu(gift, inside, android, printer)');
  });

  it('6. preserves strings containing keywords like "if", "print", "else", "for"', () => {
    const input = `msg = "if you print this, else it fails"\nraw = r'print("\\n")'\nf_str = f"status: {is_ready} if done"\ntriple = """\nmultiline if and else print\n"""`;
    const translated = translateCode(input);
    expect(translated).toContain('msg = "if you print this, else it fails"');
    expect(translated).toContain('raw = r\'print("\\n")\'');
    expect(translated).toContain('triple = """\nmultiline if and else print\n"""');
  });

  it('7. preserves comments completely untouched', () => {
    const input = `# if score is high, print success\nif True:\n    # else do not print\n    print("ok")`;
    const translated = translateCode(input);
    expect(translated).toContain('# if score is high, print success');
    expect(translated).toContain('# else do not print');
    expect(translated).toContain('chupinchu("ok")');
  });

  it('8. preserves indentation, newlines, operators, and punctuation', () => {
    const input = `    if (a + b) * 2 >= 10:\n        c = [1, 2, 3]\n        d = {"key": 45}\n        print(c[0], d["key"])`;
    const translated = translateCode(input);
    expect(translated).toBe(
      `    oka vela (a + b) * 2 >= 10:\n        c = [1, 2, 3]\n        d = {"key": 45}\n        chupinchu(c[0], d["key"])`
    );
  });

  it('9. handles multiline loops, while loops, and function definitions with return', () => {
    const input = `def calculate_total(items):\n    total = 0\n    for item in items:\n        total += item\n    while total > 100:\n        total -= 10\n    return total`;
    const translated = translateCode(input);
    expect(translated).toContain('nirvachinchu calculate_total(items):');
    expect(translated).toContain('prathi daniki item lo items:');
    expect(translated).toContain('varaku total > 100:');
    expect(translated).toContain('tirigi ivvu total');
  });

  it('10. handles empty input and whitespace safely', () => {
    expect(translateCode('')).toBe('');
    expect(translateCode(null)).toBe('');
    expect(translateCode(undefined)).toBe('');
    expect(translateCode('   \n\n   ')).toBe('   \n\n   ');
  });

  it('11. preserves original source code variable / immutability', () => {
    const original = `name = input("Name: ")\nif name:\n    print(name)`;
    const originalCopy = original.slice();
    const translated = translateCode(original);
    expect(original).toBe(originalCopy);
    expect(translated).not.toBe(original);
    expect(translated).toContain('name = adugu("Name: ")');
  });

  it('12. avoids repeated translation corruption when called repeatedly', () => {
    const original = `if x:\n    print(x)`;
    const pass1 = translateCode(original);
    const pass2 = translateCode(pass1);
    expect(pass2).toBe(pass1);
  });

  it('13. does not translate function names or object methods', () => {
    const input = `def print_report():\n    obj.print()\n    logger.if = True`;
    const translated = translateCode(input);
    expect(translated).toContain('nirvachinchu print_report():');
    expect(translated).toContain('obj.print()');
    expect(translated).toContain('logger.if = Nijam');
  });

  it('14. correctly translates the user test example (num, int(input), if/else, print)', () => {
    const input = `num = int(input("Enter a number: "))\n\nif num > 0:\n    print("Positive")\nelse:\n    print("Zero or negative")`;
    const translated = translateCode(input);

    // Verify original code string remains untouched
    expect(input).toContain('input("Enter a number: ")');

    // Verify Telugu keyword mappings
    expect(translated).toContain('num = int(adugu("Enter a number: "))');
    expect(translated).toContain('oka vela num > 0:');
    expect(translated).toContain('    chupinchu("Positive")');
    expect(translated).toContain('lekapothe:');
    expect(translated).toContain('    chupinchu("Zero or negative")');

    // Verify identifiers and strings intact
    expect(translated).toContain('"Enter a number: "');
    expect(translated).toContain('"Positive"');
    expect(translated).toContain('"Zero or negative"');
  });
});
