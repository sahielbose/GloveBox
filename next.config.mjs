/** @type {import('next').NextConfig} */
const nextConfig = {
  // These read files / use native bindings at runtime — keep them out of the bundle.
  serverExternalPackages: ["postgres", "pdfkit", "@anthropic-ai/sdk", "openai"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
