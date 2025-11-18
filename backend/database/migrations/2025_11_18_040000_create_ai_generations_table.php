<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('prompt', 1000); // Texte du prompt
            $table->string('negative_prompt', 500)->nullable(); // Ce qu'on ne veut PAS
            $table->string('image_url'); // URL de l'image générée
            $table->string('thumbnail_url')->nullable(); // Miniature
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->enum('model', ['stable-diffusion', 'dalle-3', 'midjourney', 'test'])->default('test');
            $table->json('parameters')->nullable(); // Style, ratio, seed, etc.
            $table->integer('width')->default(1024);
            $table->integer('height')->default(1024);
            $table->string('style')->default('realistic'); // realistic, anime, cartoon, artistic
            $table->integer('credits_used')->default(1); // Coût en crédits
            $table->string('generation_time')->nullable(); // Temps de génération
            $table->boolean('is_public')->default(true); // Visible dans galerie publique
            $table->boolean('is_favorite')->default(false);
            $table->foreignId('post_id')->nullable()->constrained()->onDelete('set null'); // Si utilisé dans un post
            $table->integer('likes_count')->default(0);
            $table->integer('downloads_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            // Index pour performance
            $table->index('user_id');
            $table->index('status');
            $table->index('is_public');
            $table->index('created_at');
        });

        // Table pour les prompts suggérés/populaires
        Schema::create('ai_prompt_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title', 100);
            $table->string('prompt', 1000);
            $table->string('negative_prompt', 500)->nullable();
            $table->string('category'); // portrait, landscape, abstract, etc.
            $table->string('style')->default('realistic');
            $table->string('thumbnail_url')->nullable();
            $table->integer('usage_count')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generations');
        Schema::dropIfExists('ai_prompt_templates');
    }
};
