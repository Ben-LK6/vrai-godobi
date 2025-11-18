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
        Schema::create('calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('cascade');
            $table->enum('type', ['audio', 'video'])->default('audio');
            $table->enum('call_type', ['one_to_one', 'group'])->default('one_to_one');
            $table->enum('status', ['calling', 'ringing', 'connected', 'ended', 'missed', 'declined', 'busy', 'failed'])->default('calling');
            $table->string('channel_name')->unique();
            $table->text('agora_token')->nullable();
            $table->integer('duration')->default(0); // en secondes
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            
            $table->index(['caller_id', 'created_at']);
            $table->index(['receiver_id', 'created_at']);
            $table->index(['group_id', 'created_at']);
            $table->index('status');
        });

        Schema::create('call_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_id')->constrained('calls')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['invited', 'ringing', 'joined', 'left', 'declined', 'missed'])->default('invited');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->integer('duration')->default(0); // temps de participation en secondes
            $table->timestamps();
            
            $table->unique(['call_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_participants');
        Schema::dropIfExists('calls');
    }
};
