import { gql } from 'graphql-tag';
import { User } from '../db/models/user.js';
import { Post, Notification, Connection } from '../db/models/index.js';

// ── Type definitions ───────────────────────────────────────────
export const typeDefs = gql`
  scalar Date
  scalar JSON

  type User {
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: String!
    profilePicture: String
    coverPhoto: String
    bio: String
    location: String
    isActive: Boolean!
    isEmailVerified: Boolean!
    viewsToday: Int
    postViews: Int
    searchAppearances: Int
    createdAt: Date
    updatedAt: Date
  }

  type Post {
    _id: ID!
    author: User!
    content: String!
    images: [String]
    likes: [ID]
    likesCount: Int!
    commentsCount: Int!
    tags: [String]
    visibility: String!
    createdAt: Date!
  }

  type Notification {
    _id: ID!
    recipient: ID!
    sender: User
    type: String!
    title: String!
    message: String!
    read: Boolean!
    createdAt: Date!
  }

  type Connection {
    _id: ID!
    requester: User!
    recipient: User!
    status: String!
    message: String
    createdAt: Date!
  }

  type DashboardStats {
    totalUsers: Int!
    totalStudents: Int!
    totalAlumni: Int!
    activeUsers: Int!
    totalPosts: Int!
    totalJobs: Int!
    totalEvents: Int!
    totalConnections: Int!
    recentSignups: Int!
  }

  type PaginationMeta {
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type PostsResult {
    data: [Post!]!
    pagination: PaginationMeta!
  }

  type Query {
    me: User
    user(id: ID!): User
    searchUsers(q: String, role: String, page: Int, limit: Int): [User!]!
    posts(page: Int, limit: Int, sort: String): PostsResult!
    post(id: ID!): Post
    notifications(page: Int): [Notification!]!
    unreadNotificationsCount: Int!
    connections: [User!]!
    dashboardStats: DashboardStats
  }

  type AuthPayload {
    user: User!
    token: String!
    refreshToken: String
  }

  type Mutation {
    updateProfile(firstName: String, lastName: String, bio: String, location: String): User!
    createPost(content: String!, images: [String], tags: [String]): Post!
    likePost(postId: ID!): Boolean!
    markNotificationRead(id: ID!): Boolean!
    markAllNotificationsRead: Boolean!
    sendConnectionRequest(recipientId: ID!, message: String): Connection!
    acceptConnection(requestId: ID!): Connection!
    declineConnection(requestId: ID!): Boolean!
  }

  type Subscription {
    newNotification(userId: ID!): Notification
    newMessage(conversationId: ID!): JSON
  }
`;

// ── Resolvers ──────────────────────────────────────────────────
export const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return User.findById(user._id);
    },

    user: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return User.findById(id);
    },

    searchUsers: async (_, { q, role, page = 1, limit = 20 }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const filter = { isActive: true };
      if (q) filter.$or = [{ firstName: new RegExp(q, 'i') }, { lastName: new RegExp(q, 'i') }];
      if (role) filter.role = role;
      return User.find(filter).limit(limit).skip((page - 1) * limit);
    },

    posts: async (_, { page = 1, limit = 20, sort = 'latest' }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const skip = (page - 1) * limit;
      const sortObj = sort === 'trending' ? { likes: -1, createdAt: -1 } : { createdAt: -1 };
      const [data, total] = await Promise.all([
        Post.find({ visibility: 'public' }).populate('author').sort(sortObj).skip(skip).limit(limit),
        Post.countDocuments({ visibility: 'public' }),
      ]);
      const totalPages = Math.ceil(total / limit);
      return { data, pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
    },

    post: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return Post.findById(id).populate('author');
    },

    notifications: async (_, { page = 1 }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return Notification.find({ recipient: user._id })
        .populate('sender')
        .sort({ createdAt: -1 })
        .skip((page - 1) * 20)
        .limit(20);
    },

    unreadNotificationsCount: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return Notification.countDocuments({ recipient: user._id, read: false });
    },

    connections: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const conns = await Connection.find({
        $or: [{ requester: user._id }, { recipient: user._id }],
        status: 'accepted',
      }).populate('requester recipient');
      return conns.map(c =>
        c.requester._id.toString() === user._id.toString() ? c.recipient : c.requester
      );
    },

    dashboardStats: async (_, __, { user }) => {
      if (!user || user.role !== 'admin') throw new Error('Not authorized');
      const { getDashboardStats } = await import('../services/userService.js');
      return getDashboardStats();
    },
  },

  Post: {
    likesCount: (post) => post.likes?.length || 0,
    commentsCount: (post) => post.comments?.length || 0,
  },

  Mutation: {
    updateProfile: async (_, args, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return User.findByIdAndUpdate(user._id, args, { new: true, runValidators: true });
    },

    createPost: async (_, { content, images, tags }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const post = await Post.create({ author: user._id, content, images, tags });
      return post.populate('author');
    },

    likePost: async (_, { postId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const post = await Post.findById(postId);
      if (!post) throw new Error('Post not found');
      const liked = post.likes.includes(user._id);
      if (liked) post.likes.pull(user._id);
      else post.likes.push(user._id);
      await post.save();
      return !liked;
    },

    markNotificationRead: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await Notification.findOneAndUpdate({ _id: id, recipient: user._id }, { read: true });
      return true;
    },

    markAllNotificationsRead: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await Notification.updateMany({ recipient: user._id, read: false }, { read: true });
      return true;
    },

    sendConnectionRequest: async (_, { recipientId, message }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { sendConnectionRequest } = await import('../services/coreServices.js');
      return sendConnectionRequest(user._id, recipientId, message);
    },

    acceptConnection: async (_, { requestId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { acceptConnectionRequest } = await import('../services/coreServices.js');
      return acceptConnectionRequest(requestId, user._id);
    },

    declineConnection: async (_, { requestId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const { declineConnectionRequest } = await import('../services/coreServices.js');
      await declineConnectionRequest(requestId, user._id);
      return true;
    },
  },
};

export default { typeDefs, resolvers };
