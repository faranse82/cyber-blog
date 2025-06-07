use std::path;

use actix_cors::Cors;
use actix_web::{middleware, web::{self, route}, App, HttpServer};
use dotenv::dotenv;

mod auth;
mod db;
mod handlers;
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().filter_or("info", "info"));
    let pool = db::create_pool()
        .await
        .expect("Failed to create database pool");

    println!("Starting server at http://0.0.0.0:8080");

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(middleware::Logger::default())
            .wrap(cors)
            // Auth routes
            .service(
                web::scope("/api/auth")
                    .route("/register", web::post().to(handlers::users::register))
                    .route("/login", web::post().to(handlers::users::login)),
            )
            // User routes
            .service(
                web::scope("/api/users")
                    .route("/profile", web::put().to(handlers::users::update_profile))
                    .route("/me", web::get().to(handlers::users::user_info)),
            )
            // Post routes
            .service(
                web::scope("/api/posts")
                    .route("", web::get().to(handlers::posts::get_all_posts))
                    .route("/{slug}", web::get().to(handlers::posts::get_post_by_slug))
                    .route("", web::post().to(handlers::posts::create_post))
                    .route("/{id}", web::put().to(handlers::posts::update_post)) //to be implemented
                    .route("/{id}", web::delete().to(handlers::posts::delete_post)) //to be implemented
                    .route(
                        "/{slug}/comments",
                        web::get().to(handlers::posts::get_post_with_comments),
                    ),
            )
            .service(
                web::scope("/api/comments") //to be implemented
                    .route("", web::post().to(handlers::comments::create_comment))
                    .route(
                        "/post/{id}",
                        web::get().to(handlers::comments::get_comments_for_post),
                    )
                    .route("/{id}", web::put().to(handlers::comments::update_comment))
                    .route(
                        "/{id}",
                        web::delete().to(handlers::comments::delete_comment),
                    ),
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
