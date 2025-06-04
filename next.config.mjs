/* eslint-disable import/no-extraneous-dependencies, import/extensions */
import { fileURLToPath } from 'node:url';

import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import createJiti from 'jiti';
import withNextIntl from 'next-intl/plugin';

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./src/libs/Env');

const withNextIntlConfig = withNextIntl('./src/libs/i18n.ts');

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
export default withSentryConfig(
  bundleAnalyzer(
    withNextIntlConfig({
      eslint: {
        dirs: ['.'],
      },
      poweredByHeader: false,
      reactStrictMode: false, // i call a lot of APIs so its annoying to have strict mode on and call them twice each time
      experimental: {
        serverComponentsExternalPackages: ['@electric-sql/pglite'],
        appDir: true,
      },
      devIndicators: {
        autoPrerender: false, // Disable auto-prerendering
      },

      // Add compression
      compress: true,

      // Optimize bundle splitting
      webpack: (config, { isServer }) => {
        if (!isServer) {
          // eslint-disable-next-line
          config.optimization.splitChunks = {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 5,
                reuseExistingChunk: true,
              },
              ui: {
                test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
                name: 'ui',
                chunks: 'all',
                priority: 8,
              },
            },
          };
        }
        return config;
      },

      async headers() {
        return [
          {
            source: '/ws',
            headers: [
              {
                key: 'Upgrade',
                value: 'websocket',
              },
            ],
          },
          {
            source: '/assets/:path*',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
              },
            ],
          },
          {
            source: '/_next/static/:path*',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
              },
            ],
          },
          {
            source: '/api/((?!auth).*)',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=300, stale-while-revalidate=600',
              },
            ],
          },
        ];
      },
    }),
  ),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    // FIXME: Add your Sentry organization and project names
    org: 'nextjs-boilerplate-org',
    project: 'nextjs-boilerplate',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Disable tunnel route for Sentry to avoid WebSocket issues
    tunnelRoute: false,

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
    productionBrowserSourceMaps: false,

    // Disable Sentry telemetry
    telemetry: false,
    images: {
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      imageSizes: [16, 32, 48, 64, 96, 128, 256],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'imagedelivery.net',
        },
        {
          protocol: 'https',
          hostname: 'djeod2qvj3cms.cloudfront.net',
        },
        {
          protocol: 'https',
          hostname: '*.cloudfront.net',
        },
      ],
    },
  },
);
