# Obsense API

Obsense API is a RESTful backend for managing users, artists, collections, 3D objects, genres, and purchases for the Obsense platform.

## Features

- User authentication (JWT)
- Artist and user profile management
- Collection and 3D object CRUD operations
- Genre management
- Purchase and token system
- File uploads (profile pictures, cover images, 3D objects)
- Search functionality

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- Passport.js (JWT)
- Cloudinary (file storage)
- CORS enabled

## Setup

1. **Clone the repository**

   ```
   git clone <repo-url>
   cd Obsense-API
   ```

2. **Install dependencies**

   ```
   npm install
   ```

3. **Environment variables**

   Create a `.env` file in the root with the following variables:

   ```
   DATABASE_CONN=mongodb://localhost:27017/obsense
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start the server**

   ```
   npm start
   ```

   The API will run on the default port (e.g., `http://localhost:3000`).

## API Endpoints

All endpoints are prefixed with `/api/v1/`.

### Authentication

- `POST /users/signup` — Register a new user
- `POST /users/login` — Login and receive JWT

### Users

- `GET /users/me` — Get current user profile
- `PUT /users/me` — Update profile
- `DELETE /users/me` — Delete account
- `PUT /users/change-password` — Change password
- `PUT /users/me/profile-picture` — Update profile picture
- `PATCH /users/me/make-artist` — Become an artist

### Artists

- `GET /artists` — List all artists
- `GET /artists/:id` — Get artist details

### Collections

- `GET /collections` — List all collections
- `GET /collections/:id` — Get collection details
- `GET /collections/creator/:id` — Collections by artist
- `GET /collections/genre/:id` — Collections by genre
- `POST /collections/:id/like` — Like/unlike a collection

### Artist Collections (for authenticated artists)

- `POST /artist/collections` — Create collection
- `GET /artist/collections` — List own collections
- `GET /artist/collections/:id` — Get own collection
- `PUT /artist/collections/:id` — Update collection
- `DELETE /artist/collections/:id` — Delete collection
- `PUT /artist/collections/:id/add-objects` — Add objects to collection
- `PATCH /artist/collections/:id/toggle-publish` — Publish/unpublish

### Objects

- `POST /objects` — Upload 3D object
- `GET /objects` — List own objects
- `GET /objects/collections/:id` — Objects in a collection
- `GET /objects/:id` — Get object details
- `PUT /objects/:id` — Update object
- `DELETE /objects/:id` — Delete object
- `POST /objects/:id/thumbnail` — Upload object thumbnail
- `DELETE /objects/:id/thumbnail` — Delete object thumbnail

### Genres

- `POST /genres` — Create genre
- `GET /genres` — List genres
- `GET /genres/:id` — Get genre details

### Purchases

- `POST /purchases/:collectionId` — Purchase a collection
- `GET /purchases` — List user purchases

### Tokens

- `PUT /tokens` — Update user tokens

### Search

- `GET /search/collections` — Search collections
- `GET /search/artists` — Search artists

## Notes

- Most endpoints require JWT authentication via the `Authorization: Bearer <token>` header.
- File uploads use multipart/form-data.
- See the code for detailed request/response formats.

## License

MIT
