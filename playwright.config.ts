import { defineConfig, devices } from '@playwright/test';
const externalBase=process.env.PW_BASE_URL;
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 30000,
  use: { baseURL: externalBase||'http://localhost:5173', ...devices['Desktop Chrome'], channel: process.env.PW_TEST_CHANNEL || undefined, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: externalBase?undefined:{ command: 'npm.cmd run dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
