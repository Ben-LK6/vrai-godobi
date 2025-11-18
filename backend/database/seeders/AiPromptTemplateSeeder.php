<?php

namespace Database\Seeders;

use App\Models\AiPromptTemplate;
use Illuminate\Database\Seeder;

class AiPromptTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // Portraits
            [
                'title' => 'Portrait Réaliste Professionnel',
                'prompt' => 'professional headshot portrait, studio lighting, sharp focus, high resolution, professional photographer',
                'negative_prompt' => 'blurry, low quality, amateur, bad lighting, distorted',
                'category' => 'portrait',
                'style' => 'photographic',
                'is_featured' => true,
            ],
            [
                'title' => 'Portrait Style Anime',
                'prompt' => 'anime character portrait, detailed eyes, colorful hair, studio ghibli style, vibrant colors',
                'negative_prompt' => 'realistic, photo, western cartoon',
                'category' => 'portrait',
                'style' => 'anime',
                'is_featured' => true,
            ],
            
            // Paysages
            [
                'title' => 'Paysage Fantastique',
                'prompt' => 'epic fantasy landscape, mountains, magical atmosphere, dramatic sky, mystical forest, detailed',
                'negative_prompt' => 'modern, urban, cars, buildings',
                'category' => 'landscape',
                'style' => 'artistic',
                'is_featured' => true,
            ],
            [
                'title' => 'Coucher de Soleil sur Plage',
                'prompt' => 'beautiful beach at sunset, golden hour, waves, palm trees, peaceful atmosphere, photorealistic',
                'negative_prompt' => 'people, crowded, pollution, ugly',
                'category' => 'landscape',
                'style' => 'photographic',
                'is_featured' => false,
            ],
            
            // Art Abstrait
            [
                'title' => 'Art Abstrait Coloré',
                'prompt' => 'abstract colorful art, vibrant colors, fluid shapes, modern art style, high contrast',
                'negative_prompt' => 'realistic, photo, portrait, landscape',
                'category' => 'abstract',
                'style' => 'artistic',
                'is_featured' => true,
            ],
            [
                'title' => 'Géométrie Sacrée',
                'prompt' => 'sacred geometry, mandala, intricate patterns, symmetrical, spiritual art, detailed linework',
                'negative_prompt' => 'random, chaotic, simple',
                'category' => 'abstract',
                'style' => 'artistic',
                'is_featured' => false,
            ],
            
            // Sci-Fi & Fantasy
            [
                'title' => 'Ville Futuriste',
                'prompt' => 'futuristic cyberpunk city, neon lights, flying cars, advanced technology, night scene, detailed architecture',
                'negative_prompt' => 'old, rustic, nature, fantasy',
                'category' => 'scifi',
                'style' => '3d-render',
                'is_featured' => true,
            ],
            [
                'title' => 'Créature Fantastique',
                'prompt' => 'mythical creature, dragon, detailed scales, fantasy art, magical atmosphere, epic scene',
                'negative_prompt' => 'realistic animal, modern, technology',
                'category' => 'fantasy',
                'style' => 'artistic',
                'is_featured' => false,
            ],
            
            // Nature
            [
                'title' => 'Forêt Enchantée',
                'prompt' => 'enchanted forest, magical trees, glowing mushrooms, fairy lights, mystical atmosphere, detailed foliage',
                'negative_prompt' => 'dead, winter, urban',
                'category' => 'nature',
                'style' => 'artistic',
                'is_featured' => false,
            ],
            [
                'title' => 'Jardin de Fleurs',
                'prompt' => 'beautiful flower garden, colorful blooms, butterflies, sunny day, vibrant colors, peaceful',
                'negative_prompt' => 'dead flowers, winter, dark',
                'category' => 'nature',
                'style' => 'photographic',
                'is_featured' => false,
            ],
            
            // Architecture
            [
                'title' => 'Architecture Moderne',
                'prompt' => 'modern architecture, glass building, minimalist design, clean lines, contemporary style',
                'negative_prompt' => 'old, rustic, messy, cluttered',
                'category' => 'architecture',
                'style' => 'photographic',
                'is_featured' => false,
            ],
            [
                'title' => 'Château Médiéval',
                'prompt' => 'medieval castle, stone walls, towers, dramatic sky, historical architecture, detailed',
                'negative_prompt' => 'modern, futuristic, damaged',
                'category' => 'architecture',
                'style' => 'photographic',
                'is_featured' => false,
            ],
            
            // Animaux
            [
                'title' => 'Animal Majestueux',
                'prompt' => 'majestic wolf in forest, detailed fur, dramatic lighting, wildlife photography style, sharp focus',
                'negative_prompt' => 'cartoon, unrealistic, blurry',
                'category' => 'animal',
                'style' => 'photographic',
                'is_featured' => false,
            ],
            
            // Food
            [
                'title' => 'Gastronomie Artistique',
                'prompt' => 'gourmet food photography, artistic plating, professional lighting, restaurant quality, detailed',
                'negative_prompt' => 'messy, unappetizing, amateur',
                'category' => 'food',
                'style' => 'photographic',
                'is_featured' => false,
            ],
            
            // Characters
            [
                'title' => 'Héros de Jeu Vidéo',
                'prompt' => 'video game character, action pose, detailed armor, epic background, digital art style',
                'negative_prompt' => 'realistic photo, simple, boring',
                'category' => 'character',
                'style' => '3d-render',
                'is_featured' => true,
            ],
        ];

        foreach ($templates as $template) {
            AiPromptTemplate::create($template);
        }
    }
}
