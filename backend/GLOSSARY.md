# Kia Blog Domain Glossary

This glossary defines the domain language used by the backend. Code, tests, API documentation, and architecture discussions should use these terms consistently.

## Identity and access

### User

A registered account that can authenticate and interact with the blog. A User may own Posts, Comments, Bookmarks, Post Likes, Sessions, and Media.

### Role

The authorization level assigned to a User. The supported Roles are:

- `USER`: can read published content and create interactions.
- `AUTHOR`: has the `USER` capabilities and can manage their own Posts.
- `ADMIN`: can manage application content and Users beyond ownership restrictions.

### Session

An authenticated login represented by a stored hashed Refresh Token. Revoking a Session prevents that Refresh Token from creating new Access Tokens.

### Access Token

A short-lived JWT used to authenticate requests. It contains the User identity and current Role.

### Refresh Token

A longer-lived JWT used to obtain a new Access Token. Only its hash is stored. A Refresh Token belongs to one Session and may be revoked.

### Email Verification

The one-time workflow that proves a User controls their email address. Completing it must atomically mark both the User as verified and the Email Verification Token as used.

### Password Reset

The one-time workflow that replaces a User's password. Completing it must atomically consume the Password Reset Token, replace the password hash, and revoke all active Sessions.

## Content

### Post

An article owned by an Author. A Post has a unique slug and one lifecycle state: `DRAFT`, `PUBLISHED`, or `DEPRECATED`.

### Published Post

A Post whose current lifecycle state is `PUBLISHED`, making it visible to the public and eligible for new Comments, Bookmarks, and Post Likes. `publishedAt` records when the Post most recently entered the published state; a past publication date alone does not grant public visibility.

### Category

A curated grouping used to organize Posts. Categories are managed by Admins.

### Tag

A lightweight label attached to Posts. Tags are managed by Admins.

### Comment

User-authored discussion attached to a Published Post. A Comment may be top-level or a reply to another Comment. Ownership controls editing and deletion, while Admins may moderate any Comment.

### Bookmark

A User's private saved reference to a Published Post. A User can Bookmark a given Post at most once; if the Post becomes unpublished, the reference remains removable but its content is hidden from the User's Bookmark list until republished.

### Post Like

A User's positive interaction with a Published Post. A User can like a given Post at most once.

## Media

### Media

Metadata for an image owned by a User. The image bytes are stored in Cloudinary; the database stores the Cloudinary public ID, URL, dimensions, format, and ownership.

### Avatar

The Media currently selected as a User's profile image. Replacing an Avatar must activate the new Media without leaving the User in a partially updated state. Cleanup of the previous remote image is a separate recoverable operation.

## Cross-system invariants

- Raw verification, password-reset, and refresh tokens are never stored.
- A one-time token cannot successfully complete its workflow more than once.
- Password Reset revokes every active Session belonging to the User.
- Only Published Posts accept public interactions.
- Ownership checks apply to mutations unless the current Role explicitly grants administrative access.
- Database records and Cloudinary assets should be compensated or remain safely retryable when a cross-system operation fails.
