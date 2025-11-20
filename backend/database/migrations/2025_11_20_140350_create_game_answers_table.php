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
        Schema::create('game_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('question_number'); // 1 à 10
            $table->string('question_text');
            $table->string('selected_answer'); // A, B, C, D
            $table->string('correct_answer'); // A, B, C, D
            $table->boolean('is_correct');
            $table->integer('points_earned')->default(0);
            $table->integer('time_taken')->nullable(); // Secondes prises pour répondre
            $table->timestamp('answered_at');
            $table->timestamps();

            // Index pour optimiser les requêtes
            $table->index(['game_id', 'user_id']);
            $table->index(['game_id', 'question_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_answers');
    }
};
