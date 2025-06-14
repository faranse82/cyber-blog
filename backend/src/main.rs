use actix_cors::Cors;
use actix_governor::{Governor, GovernorConfigBuilder};
use actix_web::{middleware, web, App, HttpServer};
use dotenv::dotenv;

mod auth;
mod db;
mod handlers;
mod models;
mod sanitize;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().filter_or("RUST_LOG", "info"));

    let governor_conf = GovernorConfigBuilder::default()
        .per_second(150)
        .burst_size(200)
        .finish()
        .unwrap();

    let pool = db::create_pool()
        .await
        .expect("Failed to create database pool");

    std::fs::create_dir_all("./uploads").expect("Failed to create uploads directory");

    println!("🔒 Starting HTTP server at http://0.0.0.0:8443");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec!["Authorization", "Content-Type"])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(
                actix_web::web::PayloadConfig::new(10 * 1024 * 1024), // 10MB limit
            )
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .wrap(Governor::new(&governor_conf)) // applied rate limiting.
            .service(
                web::scope("/api/auth")
                    .route("/register", web::post().to(handlers::users::register))
                    .route("/login", web::post().to(handlers::users::login)),
            )
            .service(
                web::scope("/api/users")
                    .route("/profile", web::put().to(handlers::users::update_profile))
                    .route("/me", web::get().to(handlers::users::user_info)),
            )
            .service(
                web::scope("/api/posts")
                    .route("", web::get().to(handlers::posts::get_all_posts))
                    .route("/{slug}", web::get().to(handlers::posts::get_post_by_slug))
                    .route("/{id}", web::delete().to(handlers::posts::delete_post))
                    .route("/{id}", web::put().to(handlers::posts::update_post))
                    .route("", web::post().to(handlers::posts::create_post)),
            )
            .service(
                web::scope("/api/comments")
                    .route("", web::post().to(handlers::comments::create_comment))
                    .route(
                        "/post/{post_id}",
                        web::get().to(handlers::comments::get_comments_for_post),
                    )
                    .route(
                        "/{comment_id}",
                        web::put().to(handlers::comments::update_comment),
                    )
                    .route(
                        "/{comment_id}",
                        web::delete().to(handlers::comments::delete_comment),
                    ),
            )
            .service(
                web::scope("/api/files")
                    .route("/upload", web::post().to(handlers::files::upload_file))
                    .route("/fetchUrl", web::post().to(handlers::files::upload_by_url))
                    .route("/{filename}", web::get().to(handlers::files::get_file)),
            )
    })
    .bind("0.0.0.0:8443")?
    .run()
    .await
}
