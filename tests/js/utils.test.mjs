
import { Mask, Validator, Format, JSONUtils, Utils } from '../../frontend/static/js/modules/utils.js';

// Simple Test Runner
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        // console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        // console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        console.error(`   Expected: ${expected}`);
        console.error(`   Actual:   ${actual}`);
        failed++;
    }
}

console.log('--- Starting Utils Tests ---');

// --- Mask Tests ---
console.log('Testing Mask...');
assertEqual(Mask.cpf('12345678901'), '123.456.789-01', 'Mask.cpf basic');
assertEqual(Mask.cnpj('12345678000195'), '12.345.678/0001-95', 'Mask.cnpj basic');
assertEqual(Mask.cep('12345678'), '12345-678', 'Mask.cep basic');
assertEqual(Mask.phone('11987654321'), '(11) 98765-4321', 'Mask.phone basic');
assertEqual(Mask.currency('100'), '1.00', 'Mask.currency 100 -> 1.00');
// Note: Current Mask.currency implementation divides by 100. '100' -> '1.00'.

// --- Validator Tests ---
console.log('Testing Validator...');
assertEqual(Validator.cpf('12345678900'), false, 'Validator.cpf invalid');
assertEqual(Validator.cpf('11111111111'), false, 'Validator.cpf repeated');
// Valid CPF for testing (generated)
const validCPF = '52998224725';
assertEqual(Validator.cpf(validCPF), true, 'Validator.cpf valid');

assertEqual(Validator.cnpj('00000000000000'), false, 'Validator.cnpj invalid/repeated');
// Valid CNPJ for testing (generated)
const validCNPJ = '11444777000161';
assertEqual(Validator.cnpj(validCNPJ), true, 'Validator.cnpj valid');

assertEqual(Validator.email('test@example.com'), true, 'Validator.email valid');
assertEqual(Validator.email('invalid-email'), false, 'Validator.email invalid');

// --- Format Tests ---
console.log('Testing Format...');
// Format.date might depend on timezone, but let's try basic check
// Using a fixed date string "2023-01-01" -> "01/01/2023" (pt-BR)
// Note: Intl might not work perfectly in minimal node env without full ICU, but usually standard node has it.
const dateStr = '2023-01-01';
const formattedDate = Format.date(dateStr);
// We expect dd/mm/yyyy.
// If the environment is strictly UTC or something else, this might vary if the code uses new Date(str) which is UTC, then formats to local.
// The code appends T00:00:00 -> Local time.
// If I run this in a server with UTC time, 2023-01-01T00:00:00 is 00:00.
// formatting to pt-BR (which is UTC-3) might shift it? No, Intl formats based on the *timestamp* and the *locale*.
// Wait, new Date('2023-01-01T00:00:00') creates a date in *Local Time* of the server.
// If server is UTC, it is 00:00 UTC.
// If Format.date uses 'pt-BR' timezone? It uses default browser timezone but formats with pt-BR locale structure.
// Let's just check it contains '2023'.
assert(formattedDate.includes('2023'), 'Format.date contains year');

assertEqual(Format.currency(1000.50), 'R$ 1.000,50', 'Format.currency numeric'); // Note: non-breaking space might be present

// --- JSONUtils Tests ---
console.log('Testing JSONUtils...');
const json = '{"a":1}';
const obj = JSONUtils.parse(json, {});
assertEqual(obj.a, 1, 'JSONUtils.parse valid');
const fallback = JSONUtils.parse('invalid', {b:2});
assertEqual(fallback.b, 2, 'JSONUtils.parse invalid returns fallback');

// --- Utils Tests ---
console.log('Testing Utils...');
const original = { a: 1, b: { c: 2 }, d: new Date('2023-01-01') };
const cloned = Utils.deepClone(original);
assertEqual(cloned.a, original.a, 'DeepClone primitive');
assertEqual(cloned.b.c, original.b.c, 'DeepClone nested');
assert(cloned.b !== original.b, 'DeepClone nested reference different');
assertEqual(cloned.d.getTime(), original.d.getTime(), 'DeepClone date');
assert(cloned.d !== original.d, 'DeepClone date reference different');


console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
