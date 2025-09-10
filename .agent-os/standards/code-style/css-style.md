# CSS Style Guide

We always use the latest version of TailwindCSS for all CSS.

### Tailwind Configuration

All projects must include a custom Tailwind plugin to ensure buttons have proper cursor behavior:

```js
// tailwind.config.js
plugins: [
  // Custom plugin to add cursor pointer to buttons
  function({ addBase }) {
    addBase({
      'button:not([disabled])': {
        cursor: 'pointer',
      },
      '[role="button"]:not([disabled])': {
        cursor: 'pointer',
      },
    })
  },
],
```

### Tailwind CSS Usage

- Use Tailwind utility classes for styling
- Group related classes logically (layout, spacing, colors, etc.)
- Use responsive prefixes when needed (sm:, md:, lg:, xl:, 2xl:)
- Prefer Tailwind utilities over custom CSS when possible
- Do not use gradients (avoid bg-gradient-* classes)

### Custom CSS Rules

- Use CSS custom properties (CSS variables) for theme values
- Prefer Tailwind utilities over custom CSS
- When custom CSS is needed, use CSS modules or styled-components
- Always include responsive design considerations

### CSS Custom Properties Example

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --background-color: #ffffff;
  --text-color: #1f2937;
}

[data-theme="dark"] {
  --background-color: #1f2937;
  --text-color: #f9fafb;
}
```

### Performance Guidelines

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left` properties
- Use `will-change` sparingly and remove after animation
- Prefer CSS Grid and Flexbox over floats and positioning
