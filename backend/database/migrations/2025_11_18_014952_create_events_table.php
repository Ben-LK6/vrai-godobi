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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Créateur
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable(); // Lieu physique ou virtuel
            $table->string('cover_photo')->nullable();
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->boolean('is_online')->default(false); // En ligne ou physique
            $table->string('meeting_link')->nullable(); // Lien pour événements en ligne
            $table->integer('max_attendees')->nullable(); // Nombre maximum de participants
            $table->boolean('is_private')->default(false); // Public ou privé
            $table->timestamps();
            
            // Index
            $table->index('user_id');
            $table->index('start_time');
            $table->index(['is_private', 'start_time']);
        });

        Schema::create('event_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['going', 'maybe', 'not_going', 'invited'])->default('invited');
            $table->timestamps();
            
            // Un utilisateur ne peut avoir qu'un seul statut par événement
            $table->unique(['event_id', 'user_id']);
            
            // Index
            $table->index('event_id');
            $table->index('user_id');
            $table->index(['event_id', 'status']);
        });

        Schema::create('event_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
            
            // Index
            $table->index('event_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_comments');
        Schema::dropIfExists('event_attendees');
        Schema::dropIfExists('events');
    }
};
