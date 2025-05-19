use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpServer};
use dotenv::dotenv;
use std::env;

mod db;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting server at http://0.0.0.0:8080");
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().filter("info"));
    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new().wrap(cors)
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
