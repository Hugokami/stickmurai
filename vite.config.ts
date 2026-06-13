import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    target: 'es2020',
    modulePreload: false
  },
  plugins: [
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        // Strip crossorigin from Vite-injected local asset script/link tags
        // Vite puts: <script type="module" crossorigin src="/assets/...">
        //            <link rel="stylesheet" crossorigin href="/assets/...">
        return html
          .replace(/<script ([^>]*)crossorigin ([^>]*src="\/assets\/[^"]*"[^>]*)>/g, '<script $1$2>')
          .replace(/<link ([^>]*)crossorigin ([^>]*href="\/assets\/[^"]*"[^>]*)>/g, '<link $1$2>');
      }
    }
  ]
});
