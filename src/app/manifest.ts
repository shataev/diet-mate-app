import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Diet Mate',
    short_name: 'Diet Mate',
    description: 'Nutrition tracking and weight control',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#34c759',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
