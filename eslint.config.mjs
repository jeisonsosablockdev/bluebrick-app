import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".blob-report/**",
      ".cache-synpress/**"
    ]
  },
  ...nextVitals
];

export default config;
