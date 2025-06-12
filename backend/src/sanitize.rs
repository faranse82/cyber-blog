use ammonia::Builder;
use maplit::{hashmap, hashset};
use serde_json::Value;

pub fn sanitize_html(html: &str) -> String {
    let tags = hashset![
        "p",
        "br",
        "strong",
        "em",
        "u",
        "i",
        "b",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "a",
        "img",
        "div",
        "span"
    ];

    let tag_attributes = hashmap! {
        "a" => hashset!["href", "title"],
        "img" => hashset!["src", "alt", "title", "width", "height"],
        "blockquote" => hashset!["cite"]
    };

    let url_schemes = hashset!["http", "https", "mailto"];

    Builder::default()
        .tags(tags)
        .tag_attributes(tag_attributes)
        .url_schemes(url_schemes)
        .clean(html)
        .to_string()
}

/// Sanitize EditorJS content blocks
pub fn sanitize_editor_content(content: &str) -> Result<String, String> {
    let mut parsed: Value =
        serde_json::from_str(content).map_err(|e| format!("Invalid JSON content: {}", e))?;

    if let Value::Object(ref mut root) = parsed {
        if let Some(Value::Array(blocks)) = root.get_mut("blocks") {
            for block in blocks.iter_mut() {
                if let Value::Object(ref mut block_obj) = block {
                    if let Some(Value::Object(ref mut data)) = block_obj.get_mut("data") {
                        sanitize_block_data(data);
                    }
                }
            }
        }
    }

    serde_json::to_string(&parsed)
        .map_err(|e| format!("Failed to serialize sanitized content: {}", e))
}

fn sanitize_block_data(data: &mut serde_json::Map<String, Value>) {
    for (key, value) in data.iter_mut() {
        match value {
            Value::String(text) => {
                // Sanitize text content based on the field
                match key.as_str() {
                    "text" | "caption" | "title" => {
                        *text = sanitize_html(text);
                    }
                    "url" | "link" => {
                        // Validate and sanitize URLs
                        if !is_safe_url(text) {
                            *text = String::from("#");
                        }
                    }
                    _ => {
                        // For other string fields, escape HTML
                        *text = html_escape::encode_text(text).to_string();
                    }
                }
            }
            Value::Array(items) => {
                // Handle list items
                for item in items.iter_mut() {
                    match item {
                        Value::String(text) => {
                            *text = sanitize_html(text);
                        }
                        Value::Object(obj) => {
                            // Handle complex list items (like checklists)
                            if let Some(Value::String(content)) = obj.get_mut("content") {
                                *content = sanitize_html(content);
                            }
                        }
                        _ => {}
                    }
                }
            }
            Value::Object(nested) => {
                // Recursively sanitize nested objects
                sanitize_block_data(nested);
            }
            _ => {}
        }
    }
}

fn is_safe_url(url: &str) -> bool {
    url.starts_with("http://")
        || url.starts_with("https://")
        || url.starts_with("mailto:")
        || url.starts_with("/")
        || url.starts_with("#")
}
