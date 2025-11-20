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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['quiz', 'puzzle', 'challenge']); // Types selon cahier des charges
            $table->enum('status', ['pending', 'active', 'finished', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('creator_id');
            $table->unsignedBigInteger('opponent_id')->nullable();
            $table->unsignedBigInteger('winner_id')->nullable();
            $table->json('game_data')->nullable(); // Stocke questions, réponses, scores, etc.
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['creator_id']);
            $table->index(['opponent_id']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
