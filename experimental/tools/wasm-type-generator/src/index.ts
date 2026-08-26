import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { parseWasmContractSpec } from './wasm-parser';
import { generateTypeScriptDefinitions } from './ts-emitter';

const program = new Command();

program
  .name('wasm-type-generator')
  .description('Extract Soroban contract spec from WASM bytecode into TypeScript interface definitions')
  .requiredOption('-w, --wasm <path>', 'Path to the compiled Soroban contract .wasm file')
  .requiredOption('-o, --out <path>', 'Path to output the generated TypeScript file (.ts or .d.ts)')
  .action((options) => {
    try {
      const wasmPath = path.resolve(options.wasm);
      if (!fs.existsSync(wasmPath)) {
        console.error(`Error: WASM file not found at path: ${wasmPath}`);
        process.exit(1);
      }

      const wasmBuffer = fs.readFileSync(wasmPath);
      const specResult = parseWasmContractSpec(wasmBuffer);
      const tsContent = generateTypeScriptDefinitions(specResult);

      const outPath = path.resolve(options.out);
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      fs.writeFileSync(outPath, tsContent, 'utf8');
      console.log(`Successfully generated TypeScript types -> ${outPath}`);
    } catch (err: any) {
      console.error(`Error generating TypeScript types: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
