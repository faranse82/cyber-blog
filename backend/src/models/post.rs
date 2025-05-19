use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Post {
    pub id: Uuid,
    pub author_id: Uuid,
    pub content: String,
    pub excerpt: String,
    pub title: String,
    pub slug: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostResponse {
    pub id: Uuid,
    pub author_id: Uuid,
    pub content: String,
    pub excerpt: String,
    pub title: String,
    pub slug: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    pub author_id: Uuid,
    pub content: String,
    pub excerpt: String,
    pub title: String,
}

impl Post {
    pub fn to_response(&self) -> PostResponse {
        PostResponse {
            id: self.id,
            author_id: self.author_id.clone(),
            content: self.content.clone(),
            excerpt: self.excerpt.clone(),
            title: self.title.clone(),
            slug: self.slug.clone(),
        }
    }
}
