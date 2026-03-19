import { gql } from '@apollo/client';

// ── Fragments ──────────────────────────────────────────────────
export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    _id
    firstName
    lastName
    email
    role
    profilePicture
    bio
    location
    isActive
    viewsToday
    postViews
    searchAppearances
    createdAt
  }
`;

export const POST_FRAGMENT = gql`
  fragment PostFields on Post {
    _id
    content
    images
    likesCount
    commentsCount
    tags
    visibility
    createdAt
    author {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

// ── Queries ────────────────────────────────────────────────────
export const GET_ME = gql`
  query GetMe {
    me {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_POSTS = gql`
  query GetPosts($page: Int, $limit: Int, $sort: String) {
    posts(page: $page, limit: $limit, sort: $sort) {
      data {
        ...PostFields
      }
      pagination {
        total
        page
        limit
        totalPages
        hasNext
        hasPrev
      }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const SEARCH_USERS = gql`
  query SearchUsers($q: String, $role: String, $page: Int, $limit: Int) {
    searchUsers(q: $q, role: $role, page: $page, limit: $limit) {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($page: Int) {
    notifications(page: $page) {
      _id
      type
      title
      message
      read
      createdAt
      sender {
        _id
        firstName
        lastName
        profilePicture
      }
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount {
    unreadNotificationsCount
  }
`;

export const GET_CONNECTIONS = gql`
  query GetConnections {
    connections {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalUsers
      totalStudents
      totalAlumni
      activeUsers
      totalPosts
      totalJobs
      totalEvents
      totalConnections
      recentSignups
    }
  }
`;

// ── Mutations ──────────────────────────────────────────────────
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($firstName: String, $lastName: String, $bio: String, $location: String) {
    updateProfile(firstName: $firstName, lastName: $lastName, bio: $bio, location: $location) {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const CREATE_POST = gql`
  mutation CreatePost($content: String!, $images: [String], $tags: [String]) {
    createPost(content: $content, images: $images, tags: $tags) {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId)
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const SEND_CONNECTION_REQUEST = gql`
  mutation SendConnectionRequest($recipientId: ID!, $message: String) {
    sendConnectionRequest(recipientId: $recipientId, message: $message) {
      _id
      status
      createdAt
    }
  }
`;

export const ACCEPT_CONNECTION = gql`
  mutation AcceptConnection($requestId: ID!) {
    acceptConnection(requestId: $requestId) {
      _id
      status
    }
  }
`;

export const DECLINE_CONNECTION = gql`
  mutation DeclineConnection($requestId: ID!) {
    declineConnection(requestId: $requestId)
  }
`;
