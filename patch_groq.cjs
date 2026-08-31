const fs = require('fs');
const path = require('path');
const file = 'apps/nucleo/src/api/lib/ai/groq.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('response_format')) {
  code = code.replace('max_tokens?: number;', 'max_tokens?: number;\n  response_format?: { type: "json_object" };');
  code = code.replace('max_tokens: input.max_tokens ?? 1024,', 'max_tokens: input.max_tokens ?? 1024,\n      ...(input.response_format ? { response_format: input.response_format } : {}),');
  fs.writeFileSync(file, code);
  console.log("Patched groq.ts");
} else {
  console.log("Already patched");
}
