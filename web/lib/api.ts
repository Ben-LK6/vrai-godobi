const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  birth_date: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profile_photo: string | null;
  bio: string | null;
  is_verified: boolean;
  is_active: boolean;
  ultra_light_mode: boolean;
  ai_credits: number;
  xp_points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
  followers_count?: number;
  following_count?: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface LoginData {
  login: string;
  password: string;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  type: 'text' | 'image' | 'video' | 'ai_generated';
  media_urls: string[] | null;
  image_url?: string; // URL unique pour image IA
  visibility: 'public' | 'friends' | 'private';
  hashtags: string[] | null;
  mentions: number[] | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_ai_generated: boolean;
  ai_prompt: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  };
}

export interface CreatePostData {
  content: string;
  type: 'text' | 'image' | 'video' | 'ai_generated';
  media_urls?: string[];
  visibility: 'public' | 'friends' | 'private';
  hashtags?: string[];
  mentions?: number[];
  is_ai_generated?: boolean;
  ai_prompt?: string;
}

export interface PostsResponse {
  data: Post[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  };
  replies?: Comment[];
}

export interface CreateCommentData {
  content: string;
  parent_id?: number;
}

export interface Conversation {
  id: number;
  other_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  };
  last_message: {
    id: number;
    content: string;
    created_at: string;
  } | null;
  unread_count: number;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  };
  receiver?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  };
}

export interface CreateMessageData {
  content: string;
}

export interface Notification {
  id: number;
  user_id: number;
  actor_id: number | null;
  group_id: number | null;
  event_id: number | null;
  call_id: number | null;
  type: 'like' | 'comment' | 'follow' | 'message' | 'game_invite' | 'ai_image_ready' | 
        'group_invitation' | 'group_message' | 'group_mention' | 
        'event_invitation' | 'event_response' | 'event_created' | 'event_invite' |
        'call_incoming' | 'call_missed' | 'call_declined' | 'call_ended';
  message: string;
  data: any;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  actor?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_photo: string | null;
  };
}

export interface NotificationsResponse {
  data: Notification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const api = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async logout(token: string): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getProfile(token: string): Promise<{ success: boolean; data: { user: User } }> {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  // Posts API
  async getPosts(token: string, page = 1, filters?: { type?: string; visibility?: string; user_id?: number }): Promise<PostsResponse> {
    const params = new URLSearchParams({ page: page.toString() });
    if (filters?.type) params.append('type', filters.type);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());

    const response = await fetch(`${API_URL}/posts?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return response.json();
  },

  async createPost(token: string, data: CreatePostData): Promise<{ message: string; post: Post }> {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }

    return response.json();
  },

  async getPost(token: string, id: number): Promise<Post> {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch post');
    }

    return response.json();
  },

  async updatePost(token: string, id: number, data: Partial<CreatePostData>): Promise<{ message: string; post: Post }> {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update post');
    }

    return response.json();
  },

  async deletePost(token: string, id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete post');
    }

    return response.json();
  },

  async getFeed(token: string, page = 1): Promise<PostsResponse> {
    const response = await fetch(`${API_URL}/feed?page=${page}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feed');
    }

    return response.json();
  },

  // Comments API
  async getComments(token: string, postId: number): Promise<Comment[]> {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return response.json();
  },

  async createComment(token: string, postId: number, data: CreateCommentData): Promise<{ message: string; comment: Comment }> {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create comment');
    }

    return response.json();
  },

  async deleteComment(token: string, postId: number, commentId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }

    return response.json();
  },

  // Likes API
  async togglePostLike(token: string, postId: number): Promise<{ message: string; liked: boolean; likes_count: number }> {
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }

    return response.json();
  },

  async toggleCommentLike(token: string, commentId: number): Promise<{ message: string; liked: boolean; likes_count: number }> {
    const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle comment like');
    }

    return response.json();
  },

  // Followers
  async followUser(token: string, userId: number) {
    const response = await fetch(`${API_URL}/users/${userId}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to follow user');
    }

    return response.json();
  },

  async checkFollowing(token: string, userId: number) {
    const response = await fetch(`${API_URL}/users/${userId}/follow/check`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check following status');
    }

    return response.json();
  },

  async getFollowing(token: string) {
    const response = await fetch(`${API_URL}/following`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch following');
    }

    return response.json();
  },

  async getFollowers(token: string) {
    const response = await fetch(`${API_URL}/followers`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch followers');
    }

    return response.json();
  },

  async getUserFollowing(token: string, userId: number) {
    const response = await fetch(`${API_URL}/users/${userId}/following`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user following');
    }

    return response.json();
  },

  async getUserFollowers(token: string, userId: number) {
    const response = await fetch(`${API_URL}/users/${userId}/followers`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user followers');
    }

    return response.json();
  },

  async getSuggestions(token: string) {
    const response = await fetch(`${API_URL}/users/suggestions`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }

    return response.json();
  },

  // Messages API
  async getConversations(token: string): Promise<{ data: Conversation[] }> {
    const response = await fetch(`${API_URL}/conversations`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return response.json();
  },

  async getOrCreateConversation(token: string, userId: number) {
    const response = await fetch(`${API_URL}/conversations/${userId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get or create conversation');
    }

    return response.json();
  },

  async getMessages(token: string, conversationId: number): Promise<{ data: Message[] }> {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  async sendMessage(token: string, conversationId: number, data: CreateMessageData) {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },

  async deleteMessage(token: string, conversationId: number, messageId: number) {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete message');
    }

    return response.json();
  },

  async getUnreadCount(token: string): Promise<{ count: number }> {
    const response = await fetch(`${API_URL}/messages/unread-count`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    return response.json();
  },

  // Notifications API
  async getNotifications(token: string, page = 1): Promise<NotificationsResponse> {
    const response = await fetch(`${API_URL}/notifications?page=${page}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  },

  async getNotificationsUnreadCount(token: string): Promise<{ count: number }> {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications unread count');
    }

    return response.json();
  },

  async markNotificationAsRead(token: string, notificationId: number) {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return response.json();
  },

  async markAllNotificationsAsRead(token: string) {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
  },

  async deleteNotification(token: string, notificationId: number) {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return response.json();
  },

  async clearReadNotifications(token: string) {
    const response = await fetch(`${API_URL}/notifications/clear-read`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to clear read notifications');
    }

    return response.json();
  },

  // Ajoutez ceci
  likePost: async (token: string, postId: number) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/posts/${postId}/like`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to like post: ${res.status} ${text}`);
    }
    return res.json();
  },
};

// ===== STORIES INTERFACES =====
export interface Story {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  views_count: number;
  created_at: string;
  expires_at: string;
  is_viewed?: boolean;
}

export interface StoryGroup {
  user_id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_photo: string | null;
  };
  stories: Story[];
  has_unviewed: boolean;
}

export interface StoryViewer {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_photo: string | null;
  };
  viewed_at: string;
}

// ===== STORIES API =====
export const storiesApi = {
  async getStories(token: string): Promise<StoryGroup[]> {
    const response = await fetch(`${API_URL}/stories`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stories');
    }

    return response.json();
  },

  async createStory(token: string, media: File, caption?: string) {
    const formData = new FormData();
    formData.append('media', media);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await fetch(`${API_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to create story');
    }

    return response.json();
  },

  async getStory(token: string, storyId: number) {
    const response = await fetch(`${API_URL}/stories/${storyId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch story');
    }

    return response.json();
  },

  async getStoryViewers(token: string, storyId: number): Promise<StoryViewer[]> {
    const response = await fetch(`${API_URL}/stories/${storyId}/viewers`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch story viewers');
    }

    return response.json();
  },

  async deleteStory(token: string, storyId: number) {
    const response = await fetch(`${API_URL}/stories/${storyId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete story');
    }

    return response.json();
  },
};

// ===== GROUPS INTERFACES =====
export interface Group {
  id: number;
  name: string;
  description: string | null;
  photo: string | null;
  members_count: number;
  is_private: boolean;
  is_admin: boolean;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_photo: string | null;
  };
  last_message?: {
    content: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
    };
    created_at: string;
  };
  unread_count: number;
  members?: GroupMember[];
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_photo: string | null;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface GroupMessage {
  id: number;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'file' | null;
  mentions?: number[];
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_photo: string | null;
  };
  created_at: string;
}

// ===== GROUPS API =====
export const groupsApi = {
  async getGroups(token: string): Promise<Group[]> {
    const response = await fetch(`${API_URL}/groups`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }

    return response.json();
  },

  async createGroup(token: string, data: FormData) {
    const response = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error('Failed to create group');
    }

    return response.json();
  },

  async getGroup(token: string, groupId: number): Promise<Group> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch group' }));
      console.error('Group fetch error:', error);
      throw new Error(error.message || 'Failed to fetch group');
    }

    return response.json();
  },

  async updateGroup(token: string, groupId: number, data: FormData) {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error('Failed to update group');
    }

    return response.json();
  },

  async deleteGroup(token: string, groupId: number) {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete group');
    }

    return response.json();
  },

  async addMember(token: string, groupId: number, userId: number) {
    const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to add member');
    }

    return response.json();
  },

  async removeMember(token: string, groupId: number, userId: number) {
    const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove member');
    }

    return response.json();
  },

  async leaveGroup(token: string, groupId: number) {
    const response = await fetch(`${API_URL}/groups/${groupId}/leave`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to leave group');
    }

    return response.json();
  },

  async getMessages(token: string, groupId: number, page: number = 1) {
    const response = await fetch(`${API_URL}/groups/${groupId}/messages?page=${page}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  async sendMessage(token: string, groupId: number, content: string, media?: File) {
    const formData = new FormData();
    formData.append('content', content);
    if (media) {
      formData.append('media', media);
    }

    const response = await fetch(`${API_URL}/groups/${groupId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },
};

// ===== EVENTS INTERFACES =====
export interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  cover_photo: string | null;
  start_time: string;
  end_time: string;
  is_online: boolean;
  meeting_link: string | null;
  max_attendees: number | null;
  is_private: boolean;
  creator: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_photo: string | null;
  };
  is_creator?: boolean;
  my_status?: 'going' | 'maybe' | 'not_going' | 'invited' | null;
  going_count: number;
  is_full: boolean;
  is_past: boolean;
  attendees?: {
    going: EventAttendee[];
    maybe: EventAttendee[];
    invited: EventAttendee[];
  };
  comments?: EventComment[];
  created_at: string;
}

export interface EventAttendee {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_photo: string | null;
}

export interface EventComment {
  id: number;
  comment: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_photo: string | null;
  };
  created_at: string;
}

// ===== EVENTS API =====
export const eventsApi = {
  async getEvents(token: string, filter: 'upcoming' | 'past' | 'my_events' | 'invited' = 'upcoming'): Promise<{ data: Event[]; meta: any }> {
    const response = await fetch(`${API_URL}/events?filter=${filter}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    return response.json();
  },

  async createEvent(token: string, data: FormData) {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create event' }));
      console.error('Event creation error:', error);
      throw new Error(error.message || JSON.stringify(error.errors) || 'Failed to create event');
    }

    return response.json();
  },

  async getEvent(token: string, eventId: number): Promise<Event> {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch event' }));
      console.error('Event fetch error:', error);
      throw new Error(error.message || 'Failed to fetch event');
    }

    return response.json();
  },

  async updateEvent(token: string, eventId: number, data: FormData) {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error('Failed to update event');
    }

    return response.json();
  },

  async deleteEvent(token: string, eventId: number) {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete event');
    }

    return response.json();
  },

  async respond(token: string, eventId: number, status: 'going' | 'maybe' | 'not_going') {
    const response = await fetch(`${API_URL}/events/${eventId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to respond to event');
    }

    return response.json();
  },

  async invite(token: string, eventId: number, userIds: number[]) {
    const response = await fetch(`${API_URL}/events/${eventId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_ids: userIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to send invitations');
    }

    return response.json();
  },

  async addComment(token: string, eventId: number, content: string) {
    const response = await fetch(`${API_URL}/events/${eventId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ comment: content }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to add comment' }));
      console.error('Add comment error:', error);
      throw new Error(error.message || JSON.stringify(error.errors) || 'Failed to add comment');
    }

    return response.json();
  },
};

// ==================== CALLS API ====================

export interface Call {
  id: number;
  caller_id: number;
  receiver_id: number | null;
  group_id: number | null;
  type: 'audio' | 'video';
  call_type: 'one_to_one' | 'group';
  status: 'calling' | 'ringing' | 'connected' | 'ended' | 'missed' | 'declined' | 'busy' | 'failed';
  channel_name: string;
  agora_token: string | null;
  duration: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  caller?: User;
  receiver?: User;
  participants?: CallParticipant[];
}

export interface CallParticipant {
  id: number;
  call_id: number;
  user_id: number;
  status: 'invited' | 'ringing' | 'joined' | 'left' | 'declined' | 'missed';
  joined_at: string | null;
  left_at: string | null;
  duration: number;
  user?: User;
}

export interface CallHistoryResponse {
  data: Call[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const callsApi = {
  async initiateCall(token: string, data: { receiver_id?: number; group_id?: number; type: 'audio' | 'video' }) {
    const response = await fetch(`${API_URL}/calls/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to initiate call' }));
      throw new Error(error.message || 'Failed to initiate call');
    }

    return response.json();
  },

  async answerCall(token: string, callId: number) {
    const response = await fetch(`${API_URL}/calls/${callId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to answer call');
    }

    return response.json();
  },

  async declineCall(token: string, callId: number) {
    const response = await fetch(`${API_URL}/calls/${callId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to decline call');
    }

    return response.json();
  },

  async endCall(token: string, callId: number) {
    const response = await fetch(`${API_URL}/calls/${callId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to end call');
    }

    return response.json();
  },

  async getCallHistory(token: string, type: 'all' | 'missed' | 'outgoing' | 'incoming' = 'all'): Promise<CallHistoryResponse> {
    const response = await fetch(`${API_URL}/calls/history?type=${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get call history');
    }

    return response.json();
  },

  async getCallDetails(token: string, callId: number): Promise<Call> {
    const response = await fetch(`${API_URL}/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get call details');
    }

    return response.json();
  },
};

// ============================================
// AI GENERATION INTERFACES & API
// ============================================

export interface AiGeneration {
  id: number;
  user_id: number;
  prompt: string;
  negative_prompt: string | null;
  image_url: string;
  thumbnail_url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  model: 'stable-diffusion' | 'dalle-3' | 'midjourney' | 'test';
  parameters: {
    style?: string;
    seed?: number;
    variation_of?: number;
  } | null;
  width: number;
  height: number;
  style: 'realistic' | 'anime' | 'cartoon' | 'artistic' | 'photographic' | '3d-render';
  credits_used: number;
  generation_time: string | null;
  is_public: boolean;
  is_favorite: boolean;
  post_id: number | null;
  likes_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  };
  post?: Post | null;
}

export interface AiPromptTemplate {
  id: number;
  title: string;
  prompt: string;
  negative_prompt: string | null;
  category: string;
  style: string;
  thumbnail_url: string | null;
  usage_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiStats {
  total_generations: number;
  completed_generations: number;
  failed_generations: number;
  favorites_count: number;
  public_generations: number;
  total_credits_used: number;
  credits_remaining: number;
  styles_used: Array<{
    style: string;
    count: number;
  }>;
}

export const aiApi = {
  // Générer une image
  generateImage: async (
    token: string,
    data: {
      prompt: string;
      negative_prompt?: string;
      style?: string;
      width?: number;
      height?: number;
      is_public?: boolean;
    }
  ) => {
    const response = await fetch(`${API_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate image');
    }

    return response.json();
  },

  // Récupérer l'historique
  getGenerations: async (
    token: string,
    params?: {
      per_page?: number;
      status?: 'all' | 'completed' | 'failed' | 'generating';
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_URL}/ai/generations?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch generations');
    }

    return response.json();
  },

  // Galerie publique
  getPublicGallery: async (
    token: string,
    params?: {
      per_page?: number;
      style?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.style) queryParams.append('style', params.style);

    const response = await fetch(`${API_URL}/ai/gallery?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch gallery');
    }

    return response.json();
  },

  // Détails d'une génération
  getGenerationDetails: async (token: string, id: number) => {
    const response = await fetch(`${API_URL}/ai/generations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch generation details');
    }

    return response.json();
  },

  // Toggle favori
  toggleFavorite: async (token: string, id: number) => {
    const response = await fetch(`${API_URL}/ai/generations/${id}/favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle favorite');
    }

    return response.json();
  },

  // Supprimer une génération
  deleteGeneration: async (token: string, id: number) => {
    const response = await fetch(`${API_URL}/ai/generations/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete generation');
    }

    return response.json();
  },

  // Créer une variation
  createVariation: async (
    token: string,
    id: number,
    data: { variation_prompt?: string }
  ) => {
    const response = await fetch(`${API_URL}/ai/generations/${id}/variation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create variation');
    }

    return response.json();
  },

  // Templates de prompts
  getPromptTemplates: async (
    token: string,
    params?: {
      category?: string;
      featured?: boolean;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());

    const response = await fetch(`${API_URL}/ai/prompts/templates?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    return response.json();
  },

  // Utiliser un template
  useTemplate: async (token: string, id: number) => {
    const response = await fetch(`${API_URL}/ai/prompts/templates/${id}/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to use template');
    }

    return response.json();
  },

  // Statistiques utilisateur
  getUserStats: async (token: string) => {
    const response = await fetch(`${API_URL}/ai/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    return response.json();
  },
};
