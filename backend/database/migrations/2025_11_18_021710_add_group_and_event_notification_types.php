<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ajouter les colonnes pour les groupes et événements
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('group_id')->nullable()->after('actor_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_id')->nullable()->after('group_id')->constrained()->onDelete('cascade');
        });
        
        // Modifier le type ENUM pour ajouter les nouveaux types
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM(
            'like',
            'comment',
            'follow',
            'message',
            'game_invite',
            'ai_image_ready',
            'group_invitation',
            'group_message',
            'group_mention',
            'event_invitation',
            'event_response',
            'event_created',
            'event_invite'
        ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer les colonnes
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropForeign(['event_id']);
            $table->dropColumn(['group_id', 'event_id']);
        });
        
        // Revenir à l'ancien ENUM
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM(
            'like',
            'comment',
            'follow',
            'message',
            'game_invite',
            'ai_image_ready'
        ) NOT NULL");
    }
};
