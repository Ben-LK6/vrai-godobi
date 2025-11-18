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
        // Ajouter la colonne call_id
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('call_id')->nullable()->after('event_id')->constrained('calls')->onDelete('cascade');
        });
        
        // Modifier le type ENUM pour ajouter les nouveaux types de notifications d'appel
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
            'event_invite',
            'call_incoming',
            'call_missed',
            'call_declined',
            'call_ended'
        ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['call_id']);
            $table->dropColumn('call_id');
        });
        
        // Revenir aux types précédents
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
};
