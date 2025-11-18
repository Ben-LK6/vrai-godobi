-- GODOBI Database Schema
-- Réseau social créatif avec IA intégrée
-- Créé le 17 novembre 2025

-- Users table - Table principale des utilisateurs
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NULL,
    phone VARCHAR(255) UNIQUE NULL,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    age TINYINT UNSIGNED NOT NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
    profile_photo VARCHAR(255) NULL,
    bio TEXT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    ultra_light_mode BOOLEAN DEFAULT FALSE,
    ai_credits INT UNSIGNED DEFAULT 3,
    xp_points INT UNSIGNED DEFAULT 0,
    level ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend') DEFAULT 'bronze',
    last_active_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_level (level),
    INDEX idx_is_active (is_active)
);

-- Posts table - Publications des utilisateurs
CREATE TABLE posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NULL,
    type ENUM('text', 'photo', 'video', 'ai_generated') NOT NULL,
    media_urls JSON NULL,
    visibility ENUM('public', 'friends', 'private') DEFAULT 'public',
    location VARCHAR(255) NULL,
    hashtags JSON NULL,
    mentions JSON NULL,
    comments_disabled BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    template_id INT UNSIGNED NULL,
    likes_count INT UNSIGNED DEFAULT 0,
    comments_count INT UNSIGNED DEFAULT 0,
    shares_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_visibility (visibility),
    INDEX idx_created_at (created_at)
);

-- Comments table - Commentaires sur les posts
CREATE TABLE comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    content TEXT NOT NULL,
    likes_count INT UNSIGNED DEFAULT 0,
    replies_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id)
);

-- Likes table - Likes sur posts et commentaires
CREATE TABLE likes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    likeable_id BIGINT UNSIGNED NOT NULL,
    likeable_type ENUM('post', 'comment') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, likeable_id, likeable_type),
    INDEX idx_likeable (likeable_id, likeable_type)
);

-- Reactions table - Réactions émotionnelles (😍❤️😂😢😮😡)
CREATE TABLE reactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    reactable_id BIGINT UNSIGNED NOT NULL,
    reactable_type ENUM('post', 'comment') NOT NULL,
    type ENUM('love', 'heart', 'laugh', 'sad', 'wow', 'angry') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (user_id, reactable_id, reactable_type),
    INDEX idx_reactable (reactable_id, reactable_type)
);

-- Friendships table - Relations entre utilisateurs
CREATE TABLE friendships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    follower_id BIGINT UNSIGNED NOT NULL,
    followed_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'accepted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (follower_id, followed_id),
    INDEX idx_follower (follower_id),
    INDEX idx_followed (followed_id)
);

-- Stories table - Stories 24h
CREATE TABLE stories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('photo', 'video', 'text', 'music', 'poll', 'challenge', 'repost') NOT NULL,
    content TEXT NULL,
    media_url VARCHAR(255) NULL,
    background_color VARCHAR(7) NULL,
    music_url VARCHAR(255) NULL,
    poll_data JSON NULL,
    views_count INT UNSIGNED DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    is_highlight BOOLEAN DEFAULT FALSE,
    highlight_category VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_highlight (is_highlight)
);

-- Conversations table - Conversations de messagerie
CREATE TABLE conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('direct', 'group') DEFAULT 'direct',
    name VARCHAR(255) NULL,
    description TEXT NULL,
    avatar VARCHAR(255) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_last_message_at (last_message_at)
);

-- Conversation participants table
CREATE TABLE conversation_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('member', 'admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id)
);

-- Messages table - Messages dans conversations
CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('text', 'image', 'video', 'audio', 'location', 'post_share', 'sticker', 'game_invite') NOT NULL,
    content TEXT NULL,
    media_url VARCHAR(255) NULL,
    metadata JSON NULL, -- Pour données jeux, localisation, etc.
    reply_to_id BIGINT UNSIGNED NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Games table - Définitions des jeux
CREATE TABLE games (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('quiz', 'puzzle', 'challenge') NOT NULL,
    description TEXT NULL,
    max_players TINYINT UNSIGNED DEFAULT 2,
    duration_minutes TINYINT UNSIGNED NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_is_active (is_active)
);

-- Game sessions table - Sessions de jeu
CREATE TABLE game_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    game_id INT UNSIGNED NOT NULL,
    conversation_id BIGINT UNSIGNED NULL, -- NULL si jeu solo
    created_by BIGINT UNSIGNED NOT NULL,
    status ENUM('waiting', 'active', 'finished', 'cancelled') DEFAULT 'waiting',
    max_players TINYINT UNSIGNED DEFAULT 2,
    current_players TINYINT UNSIGNED DEFAULT 1,
    settings JSON NULL,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Game participants table
CREATE TABLE game_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    score INT UNSIGNED DEFAULT 0,
    position TINYINT UNSIGNED NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (session_id, user_id)
);

-- AI Generations table - Générations d'images IA
CREATE TABLE ai_generations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    prompt TEXT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    style VARCHAR(100) NULL,
    size VARCHAR(20) DEFAULT '512x512',
    model VARCHAR(100) NULL,
    credits_used TINYINT UNSIGNED DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_generated_at (generated_at),
    INDEX idx_is_public (is_public)
);

-- Gallery items table - Galerie temporaire
CREATE TABLE gallery_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('ai_generated', 'edited_photo', 'created_video', 'draft') NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255) NULL,
    metadata JSON NULL,
    folder VARCHAR(100) DEFAULT 'general',
    is_favorite BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NULL, -- Auto-suppression selon le mode
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_folder (folder),
    INDEX idx_expires_at (expires_at)
);

-- Badges table - Badges de gamification
CREATE TABLE badges (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    category ENUM('social', 'creator', 'gamer', 'milestone', 'special') NOT NULL,
    rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
    requirements JSON NOT NULL, -- Conditions pour débloquer
    rewards JSON NULL, -- Récompenses (crédits IA, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_name (name),
    INDEX idx_category (category),
    INDEX idx_rarity (rarity)
);

-- User badges table - Badges débloqués par utilisateur
CREATE TABLE user_badges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    badge_id INT UNSIGNED NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_earned_at (earned_at)
);

-- User progress table - Progression utilisateur
CREATE TABLE user_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    metric ENUM('posts_count', 'likes_received', 'comments_made', 'games_won', 'ai_generations', 'friends_count') NOT NULL,
    current_value INT UNSIGNED DEFAULT 0,
    daily_value INT UNSIGNED DEFAULT 0,
    weekly_value INT UNSIGNED DEFAULT 0,
    monthly_value INT UNSIGNED DEFAULT 0,
    last_reset_daily DATE NULL,
    last_reset_weekly DATE NULL,
    last_reset_monthly DATE NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_metric (user_id, metric)
);

-- Notifications table - Notifications utilisateur
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('like', 'comment', 'follow', 'game_invite', 'badge_earned', 'challenge', 'mention') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL, -- Données spécifiques (IDs, liens, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Transactions table - Transactions financières
CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('purchase', 'subscription', 'reward', 'refund') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method ENUM('mtn_momo', 'moov_money', 'stripe', 'free_credits') NOT NULL,
    payment_reference VARCHAR(255) NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    description TEXT NULL,
    metadata JSON NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_payment_method (payment_method),
    INDEX idx_created_at (created_at)
);

-- Groups table - Groupes d'utilisateurs
CREATE TABLE groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    avatar VARCHAR(255) NULL,
    cover_photo VARCHAR(255) NULL,
    privacy ENUM('public', 'private') DEFAULT 'public',
    created_by BIGINT UNSIGNED NOT NULL,
    members_count INT UNSIGNED DEFAULT 1,
    posts_count INT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_privacy (privacy),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Group members table
CREATE TABLE group_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
    status ENUM('active', 'banned', 'left') DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_member (group_id, user_id)
);

-- Pages table - Pages créateurs/commerces
CREATE TABLE pages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NULL,
    avatar VARCHAR(255) NULL,
    cover_photo VARCHAR(255) NULL,
    category VARCHAR(100) NOT NULL,
    website VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    followers_count INT UNSIGNED DEFAULT 0,
    posts_count INT UNSIGNED DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_username (username),
    INDEX idx_category (category),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_active (is_active)
);

-- Page followers table
CREATE TABLE page_followers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_follower (page_id, user_id)
);

-- Hashtags table - Hashtags populaires
CREATE TABLE hashtags (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    usage_count INT UNSIGNED DEFAULT 0,
    trending_score DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_usage_count (usage_count),
    INDEX idx_trending_score (trending_score)
);

-- Post hashtags table - Relation posts-hashtags
CREATE TABLE post_hashtags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    hashtag_id INT UNSIGNED NOT NULL,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_hashtag (post_id, hashtag_id)
);

-- Reports table - Signalements
CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT UNSIGNED NOT NULL,
    reportable_id BIGINT UNSIGNED NOT NULL,
    reportable_type ENUM('user', 'post', 'comment', 'message') NOT NULL,
    reason ENUM('spam', 'harassment', 'inappropriate', 'fake', 'copyright', 'other') NOT NULL,
    description TEXT NULL,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_reportable (reportable_id, reportable_type)
);
