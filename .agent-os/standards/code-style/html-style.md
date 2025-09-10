# HTML Style Guide

## Structure Rules
- Use tabs for indentation
- Place nested elements on new lines with proper indentation
- Content between tags should be on its own line when multi-line

## Attribute Formatting
- Place each HTML attribute on its own line
- Align attributes vertically
- Keep the closing `>` on the same line as the last attribute
- Use double quotes for attribute values
- Always include alt text for images
- Use semantic HTML elements (header, nav, main, section, article, aside, footer)

## Example HTML Structure

```html
<div class="container">
	<header class="flex flex-col space-y-2
	               md:flex-row md:space-y-0 md:space-x-4">
		<h1 class="text-primary dark:text-primary-300">
			Page Title
		</h1>
		<nav class="flex flex-col space-y-2
		            md:flex-row md:space-y-0 md:space-x-4">
			<a href="/"
			   class="btn-ghost">
				Home
			</a>
			<a href="/about"
			  class="btn-ghost">
				About
			</a>
		</nav>
	</header>
</div>
```

## React/JSX Specific Rules

### Component Structure
- Use PascalCase for component names
- Self-close tags that don't have children: `<img />`, `<input />`, `<br />`
- Use className instead of class
- Use camelCase for event handlers: onClick, onChange, onSubmit

### Accessibility
- Always include alt text for images
- Use proper heading hierarchy (h1, h2, h3...)
- Include ARIA labels when needed
- Use semantic elements for better screen reader support

### Example JSX Structure

```jsx
<main className="container">
	<header className="flex flex-col space-y-2
	                   md:flex-row md:space-y-0 md:space-x-4">
		<h1 className="text-primary dark:text-primary-300">
			Page Title
		</h1>
		<nav className="flex flex-col space-y-2
		                md:flex-row md:space-y-0 md:space-x-4">
			<a href="/"
			   className="btn-ghost">
				Home
			</a>
			<a href="/about"
			   className="btn-ghost">
				About
			</a>
		</nav>
	</header>
</main>
```
