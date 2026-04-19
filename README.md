# vue-owldate

> A lightweight and customizable DatePicker component for Vue 3.4+ + TypeScript, supporting both native Date and the Temporal API.

## Installation

```bash
npm install vue-owldate
```

## Usage

### Global Import (Plugin)

You can configure the picker globally during installation.

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import VueOwldate from "vue-owldate";
import "vue-owldate/style.css";

const app = createApp(App);

app.use(VueOwldate, {
  headerPosition: "left", // 'top', 'bottom', 'left', 'right'
  darkMode: false,
  theme: {
    primary: "#10b981",
    radius: "8px",
  },
});

app.mount("#app");
```

```vue
<!-- In any component -->
<template>
  <OwlDatePicker v-model="myRange" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { DateRange } from "vue-owldate";

const myRange = ref<DateRange>({
  start: new Date(),
  end: new Date(),
});
</script>
```

## Configuration Options

When installing the plugin, you can pass a configuration object:

| Option           | Type                                     | Default       | Description                                           |
| :--------------- | :--------------------------------------- | :------------ | :---------------------------------------------------- |
| `useTemporal`    | `boolean`                                | `false`       | Use `@js-temporal/polyfill` instead of native `Date`. |
| `temporalType`   | `'PlainDate' \| 'ZonedDateTime'`         | `'PlainDate'` | The type of Temporal object to use.                   |
| `darkMode`       | `boolean`                                | `false`       | Enable dark mode styles.                              |
| `headerPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`       | Position of the presets and labels header.            |
| `theme`          | `Object`                                 | See below     | Custom style overrides.                               |

### Theme Customization

The `theme` object supports the following properties:

| Property          | Description                                   |
| :---------------- | :-------------------------------------------- |
| `primary`         | Primary action color (handles, active range). |
| `background`      | Main background color.                        |
| `surface`         | Surface color for inputs/presets.             |
| `border`          | Border color for the container.               |
| `text`            | Primary text color.                           |
| `textMuted`       | Muted/placeholder text color.                 |
| `radius`          | Border radius for the component.              |
| `font`            | Font family.                                  |
| `rangeBackground` | Background color for the selected range.      |
| `rangeBorder`     | Border color for the selected range.          |

## Props

| Prop         | Type        | Default   | Description                    |
| :----------- | :---------- | :-------- | :----------------------------- |
| `modelValue` | `DateRange` | —         | The selected date range.       |
| `locale`     | `string`    | `'fr-FR'` | Display locale for formatting. |

## Types

```ts
interface DateRange {
  start: Date | Temporal.PlainDate | Temporal.ZonedDateTime | null;
  end: Date | Temporal.PlainDate | Temporal.ZonedDateTime | null;
}
```

## License

MIT
