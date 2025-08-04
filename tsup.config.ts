import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/utils.ts', 'src/sessions/session.ts', 'src/auth/auth.ts', 'src/users/user.ts', 'src/errors/errors.ts'],
	format: ['cjs', 'esm'], // Build for commonJS and ESmodules
	dts: true, // Generate declaration file (.d.ts)
	splitting: false,
	sourcemap: true,
	clean: true,
});
