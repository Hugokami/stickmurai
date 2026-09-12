import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    modulePreload: false
  },
  plugins: [
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        // Strip crossorigin from Vite-injected local asset script/link tags
        return html
          .replace(/<script ([^>]*)crossorigin ([^>]*src="[^"]*"[^>]*)>/g, '<script $1$2>')
          .replace(/<link ([^>]*)crossorigin ([^>]*href="[^"]*"[^>]*)>/g, '<link $1$2>');
      }
    }
  ]
});
