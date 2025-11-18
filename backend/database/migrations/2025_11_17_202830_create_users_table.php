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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('email')->nullable()->unique();
            $table->string('phone')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->string('password');
            $table->string('first_name');
            $table->string('last_name');
            $table->date('birth_date');
            $table->unsignedTinyInteger('age');
            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say']);
            $table->string('profile_photo')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('ultra_light_mode')->default(false);
            $table->unsignedInteger('ai_credits')->default(3);
            $table->unsignedInteger('xp_points')->default(0);
            $table->enum('level', ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'])->default('bronze');
            $table->timestamp('last_active_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            
            // Indexes
            $table->index('username');
            $table->index('email');
            $table->index('phone');
            $table->index('level');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
