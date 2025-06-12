use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize)]
pub struct Post {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub published: bool,
    pub author_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePostRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    #[validate(length(min = 1, max = 50000))]
    pub content: String,
    #[validate(length(max = 500))]
    pub excerpt: Option<String>,
    pub published: Option<bool>,
}

/*
#[derive(Debug, Deserialize)]
pub struct UpdatePostRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub published: Option<bool>,
}
*/

#[derive(Debug, Serialize)]
pub struct AuthorInfo {
    pub id: Uuid,
    pub username: String,
    pub profile_pic_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PostResponse {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub published: bool,
    pub author: AuthorInfo,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct CommentResponse {
    pub id: Uuid,
    pub content: String,
    pub author: AuthorInfo,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct PostWithComments {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub published: bool,
    pub author_id: Uuid,
    pub author_name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub comments: Vec<CommentResponse>,
}
