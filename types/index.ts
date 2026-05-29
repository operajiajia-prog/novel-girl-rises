import type {
  User,
  Book,
  BookStatus,
  Friendship,
  FriendshipStatus,
  ActionType,
} from '@prisma/client'

export type { User, Book, BookStatus, Friendship, FriendshipStatus, ActionType }

export type SafeUser = Omit<User, 'passwordHash'>

export type BookWithOwner = Book & {
  user: SafeUser
}
