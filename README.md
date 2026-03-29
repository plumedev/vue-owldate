# vue-owldate

> A lightweight and customizable DatePicker component for Vue 3 + TypeScript.

## Installation

```bash
npm install vue-owldate
```

## Usage

### Import global (plugin)

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { VueOwldate } from "vue-owldate";
import "vue-owldate/style.css";

const app = createApp(App);
app.use(VueOwldate);
app.mount("#app");
```

```vue
<!-- Dans n'importe quel composant -->
<OwlDatePicker v-model="myRange" />
```

### Import local (à la carte)

```vue
<template>
  <OwlDatePicker v-model="myRange" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { OwlDatePicker } from "vue-owldate";
import "vue-owldate/style.css";
import type { DateRange } from "vue-owldate";

const myRange = ref<DateRange>({
  start: new Date(),
  end: new Date(),
});
</script>
```

## Props

| Prop         | Type        | Default   | Description             |
| ------------ | ----------- | --------- | ----------------------- |
| `modelValue` | `DateRange` | —         | Valeur liée (`v-model`) |
| `locale`     | `string`    | `'fr-FR'` | Locale d'affichage      |

## Types

```ts
interface DateRange {
  start: Date;
  end: Date;
}
```

## Events

| Event               | Payload     | Description                        |
| ------------------- | ----------- | ---------------------------------- |
| `update:modelValue` | `DateRange` | Émis à chaque changement de valeur |

## License

MIT
