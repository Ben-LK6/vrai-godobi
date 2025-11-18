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
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nom du groupe
            $table->text('description')->nullable(); // Description
            $table->string('photo')->nullable(); // Photo de groupe
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade'); // Créateur
            $table->integer('members_count')->default(0); // Nombre de membres
            $table->boolean('is_private')->default(false); // Privé ou public
            $table->timestamps();
            
            // Index
            $table->index('created_by');
            $table->index('is_private');
        });

        Schema::create('group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['admin', 'member'])->default('member'); // Rôle dans le groupe
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
            
            // Un utilisateur ne peut rejoindre un groupe qu'une seule fois
            $table->unique(['group_id', 'user_id']);
            
            // Index
            $table->index('group_id');
            $table->index('user_id');
            $table->index(['group_id', 'role']);
        });

        Schema::create('group_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content'); // Contenu du message
            $table->string('media_url')->nullable(); // URL du média (image, vidéo)
            $table->string('media_type')->nullable(); // Type de média (image, video, file)
            $table->timestamps();
            
            // Index
            $table->index('group_id');
            $table->index('user_id');
            $table->index(['group_id', 'created_at']);
        });

        // Table pour les messages lus par chaque membre
        Schema::create('group_message_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_message_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('read_at')->useCurrent();
            $table->timestamps();
            
            // Un utilisateur ne peut marquer un message comme lu qu'une seule fois
            $table->unique(['group_message_id', 'user_id']);
            
            // Index
            $table->index('group_message_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_message_reads');
        Schema::dropIfExists('group_messages');
        Schema::dropIfExists('group_members');
        Schema::dropIfExists('groups');
    }
};
