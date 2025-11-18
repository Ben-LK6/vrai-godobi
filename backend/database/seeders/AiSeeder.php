<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\AiPromptTemplate;
use Illuminate\Database\Seeder;

class AiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Donner 100 crédits IA à tous les utilisateurs
        User::query()->update(['ai_credits' => 100]);

        echo "✅ Crédits IA ajoutés à tous les utilisateurs\n";

        // Créer des templates de prompts
        $templates = [
            [
                'title' => 'Portrait professionnel',
                'prompt' => 'professional portrait photo, studio lighting, high quality, detailed face',
                'negative_prompt' => 'blurry, low quality, distorted',
                'category' => 'portrait',
                'style' => 'photorealistic',
                'thumbnail_url' => 'https://picsum.photos/seed/portrait1/400/400',
                'is_featured' => true,
            ],
            [
                'title' => 'Paysage fantastique',
                'prompt' => 'fantasy landscape, magical forest, ethereal lighting, vibrant colors',
                'negative_prompt' => 'ugly, boring, plain',
                'category' => 'landscape',
                'style' => 'digital-art',
                'thumbnail_url' => 'https://picsum.photos/seed/landscape1/400/400',
                'is_featured' => true,
            ],
            [
                'title' => 'Style anime',
                'prompt' => 'anime character, detailed eyes, colorful hair, manga style',
                'negative_prompt' => 'realistic, photo, 3d',
                'category' => 'character',
                'style' => 'anime',
                'thumbnail_url' => 'https://picsum.photos/seed/anime1/400/400',
                'is_featured' => true,
            ],
            [
                'title' => 'Architecture moderne',
                'prompt' => 'modern architecture, minimalist design, glass and steel, urban',
                'negative_prompt' => 'old, rustic, traditional',
                'category' => 'architecture',
                'style' => '3d-render',
                'thumbnail_url' => 'https://picsum.photos/seed/arch1/400/400',
                'is_featured' => false,
            ],
            [
                'title' => 'Art abstrait',
                'prompt' => 'abstract art, vibrant colors, geometric shapes, modern art',
                'negative_prompt' => 'realistic, photo, boring',
                'category' => 'abstract',
                'style' => 'digital-art',
                'thumbnail_url' => 'https://picsum.photos/seed/abstract1/400/400',
                'is_featured' => false,
            ],
            [
                'title' => 'Cyberpunk',
                'prompt' => 'cyberpunk city, neon lights, futuristic, night scene, rain',
                'negative_prompt' => 'bright, daytime, nature',
                'category' => 'sci-fi',
                'style' => 'cinematic',
                'thumbnail_url' => 'https://picsum.photos/seed/cyber1/400/400',
                'is_featured' => true,
            ],
        ];

        foreach ($templates as $template) {
            AiPromptTemplate::create($template);
        }

        echo "✅ " . count($templates) . " templates de prompts créés\n";
    }
}
