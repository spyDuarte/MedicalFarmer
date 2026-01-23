
import { Mask, Validator, Format, JSONUtils, Utils } from '../../static/js/modules/utils.js';

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
const dateStr = '2023-01-01';
const formattedDate = Format.date(dateStr);
assert(formattedDate.includes('2023'), 'Format.date contains year');

assertEqual(Format.currency(1000.50), 'R$ 1.000,50', 'Format.currency numeric');

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
