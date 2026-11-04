import { defineConfig, devices } from '@playwright/test';

const PORT = 8081;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Pixel 7'],
    baseURL: `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx expo start --port ${PORT}`,
    url: `http://localhost:${PORT}/status`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
