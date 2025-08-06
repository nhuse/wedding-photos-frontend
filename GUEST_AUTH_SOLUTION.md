# Guest Authentication Solution for Wedding Photo Sharing

## Overview

This solution implements a guest authentication system that allows wedding guests to upload, view, and delete their own photos without requiring traditional user accounts. The system uses a combination of:

1. **localStorage** for session persistence
2. **Cloudflare Workers** for guest session management
3. **R2 metadata** for ownership tracking

## How It Works

### 1. Guest Session Creation
- When a user first visits the app, a unique guest session ID is generated
- The session ID is stored in localStorage for persistence across browser sessions
- Sessions are validated on app initialization

### 2. Photo Ownership Tracking
- Each uploaded photo includes metadata with the guest's session ID
- The `uploadedBy` field in R2 metadata tracks ownership
- Only the original uploader can delete their photos

### 3. Security Features
- Session validation on the server side
- Ownership verification before deletion
- Automatic session refresh if validation fails

## Key Components

### Backend (Cloudflare Worker)
- `/auth/guest` - Creates new guest sessions
- `/auth/validate` - Validates existing sessions
- `/upload` - Uploads files with session tracking
- `/delete` - Deletes files with ownership validation
- `/my-photos` - Lists user's own photos

### Frontend
- `useGuestSession` hook - Manages guest sessions
- `MyPhotos` component - Shows user's own photos with delete functionality
- Updated `FileUploaderWorker` - Includes session tracking
- Navigation between upload, view all, and my photos

## Usage Flow

1. **First Visit**: User gets a guest session automatically
2. **Upload Photos**: Photos are tagged with the user's session ID
3. **View My Photos**: Users can see only their uploaded photos
4. **Delete Photos**: Users can only delete their own photos
5. **Session Persistence**: Sessions persist across browser restarts

## Security Considerations

- Session IDs are cryptographically random
- Server-side ownership validation prevents unauthorized deletions
- No sensitive data is stored in localStorage (only session ID)
- Sessions can be invalidated server-side if needed

## Benefits

- **No Registration Required**: Guests can start uploading immediately
- **Ownership Control**: Users can only delete their own photos
- **Session Persistence**: Users don't lose access when closing browser
- **Simple UX**: No login forms or account management
- **Scalable**: Works with any number of guests

## Implementation Notes

- The solution is designed for a wedding photo sharing context
- Session IDs are long-lived (7 days) but can be adjusted
- The system gracefully handles session validation failures
- All operations include proper error handling and user feedback

## Future Enhancements

- Add session expiration and renewal
- Implement rate limiting per session
- Add admin controls for session management
- Include session analytics and usage tracking 