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
        Schema::create('stories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('media_url'); // URL de l'image/vidéo
            $table->string('media_type')->default('image'); // image ou video
            $table->text('caption')->nullable(); // Texte optionnel
            $table->integer('views_count')->default(0);
            $table->timestamp('expires_at'); // Date d'expiration (24h après création)
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index('user_id');
            $table->index('expires_at');
            $table->index(['user_id', 'expires_at']);
        });

        Schema::create('story_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('story_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('viewed_at');
            $table->timestamps();
            
            // Un utilisateur ne peut voir une story qu'une seule fois
            $table->unique(['story_id', 'user_id']);
            
            // Index pour optimiser les requêtes
            $table->index('story_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('story_views');
        Schema::dropIfExists('stories');
    }
};
