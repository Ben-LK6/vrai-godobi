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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->enum('type', ['text', 'image', 'video', 'ai_generated'])->default('text');
            $table->json('media_urls')->nullable(); // Array of image/video URLs
            $table->enum('visibility', ['public', 'friends', 'private'])->default('public');
            $table->json('hashtags')->nullable(); // Array of hashtags
            $table->json('mentions')->nullable(); // Array of mentioned user IDs
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->unsignedInteger('shares_count')->default(0);
            $table->boolean('is_ai_generated')->default(false);
            $table->string('ai_prompt')->nullable(); // Store AI generation prompt
            $table->timestamps();
            $table->softDeletes(); // Soft delete for posts
            
            // Indexes
            $table->index('user_id');
            $table->index('type');
            $table->index('visibility');
            $table->index('created_at');
            $table->index('is_ai_generated');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
