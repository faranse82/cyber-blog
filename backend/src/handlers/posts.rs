use actix_web::{web, Error, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{create_token, hash_password, verify_passowrd};
use crate::models::post::{CreatePostRequest, Post};

pub async fn create_post(
    pool: web::Data<PgPool>,
    user_req: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, Error> {
}

pub async fn update_post(
    pool: web::Data<PgPool>,
    user_req: web::Json,
) -> Result<HttpResponse, Error> {
}

pub async fn delete_post(
    pool: web::Data<PgPool>,
    user_req: web::Json,
) -> Result<HttpResponse, Error> {
}

pub async fn get_post_by_id(
    pool: web::Data<PgPool>,
    user_req: web::Json,
) -> Result<HttpResponse, Error> {
}

pub async fn get_all_posts(
    pool: web::Data<PgPool>,
    user_req: web::Json,
) -> Result<HttpResponse, Error> {
}
