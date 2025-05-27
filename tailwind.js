// tailwind.js
import { create } from 'tailwind-rn';
import styles from './styles.json'; // generado por `npx setup-tailwind-rn`

const { tailwind, getColor } = create(styles);
export { tailwind, getColor };
