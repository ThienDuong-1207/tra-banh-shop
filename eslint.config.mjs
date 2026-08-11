import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Code ported từ trabanh (back-office /admin) — dự án gốc chưa từng chạy
  // ESLint (không có eslint.config), viết theo phong cách thoải mái hơn:
  // catch (e: any) ở khắp nơi, một số state được set trực tiếp trong effect.
  // Không đáng để refactor hàng loạt ~5000 dòng code đang chạy tốt chỉ để
  // khớp rule mới của tra-banh-shop — hạ 2 rule này xuống "warn" (không tắt
  // hẳn, để vẫn thấy được khi rà lại) chỉ trong phạm vi các thư mục port.
  {
    files: [
      "app/(admin)/**/*.{ts,tsx}",
      "app/api/admin/**/*.{ts,tsx}",
      "lib/admin/**/*.{ts,tsx}",
      "components/admin/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
