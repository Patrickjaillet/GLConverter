use wasm_bindgen::prelude::*;

const ENGINE_VERSION: &str = "0.6.0";

fn is_ident_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_' || c == '$'
}

fn collapse_ws_before_char(input: &str, keyword: &str, target: char) -> String {
    let chars: Vec<char> = input.chars().collect();
    let keyword_chars: Vec<char> = keyword.chars().collect();
    let mut output = String::with_capacity(input.len());
    let mut i = 0;

    while i < chars.len() {
        let matches_keyword = i + keyword_chars.len() <= chars.len()
            && chars[i..i + keyword_chars.len()] == keyword_chars[..];
        let boundary_ok = i == 0 || !is_ident_char(chars[i - 1]);

        if matches_keyword && boundary_ok {
            let after_keyword = i + keyword_chars.len();
            let mut k = after_keyword;

            while k < chars.len() && chars[k].is_whitespace() {
                k += 1;
            }

            if k < chars.len() && chars[k] == target {
                output.push_str(keyword);
                output.push(target);
                i = k + 1;
                continue;
            }

            output.push_str(keyword);
            i = after_keyword;
            continue;
        }

        output.push(chars[i]);
        i += 1;
    }

    output
}

fn collapse_ws_run(input: &str, before: char, after: &str) -> String {
    let chars: Vec<char> = input.chars().collect();
    let after_chars: Vec<char> = after.chars().collect();
    let mut output = String::with_capacity(input.len());
    let mut i = 0;

    while i < chars.len() {
        if chars[i] == before {
            let mut k = i + 1;

            while k < chars.len() && chars[k].is_whitespace() {
                k += 1;
            }

            if k + after_chars.len() <= chars.len() && chars[k..k + after_chars.len()] == after_chars[..] {
                output.push(before);
                output.push_str(after);
                i = k + after_chars.len();
                continue;
            }
        }

        output.push(chars[i]);
        i += 1;
    }

    output
}

pub fn compact(source: &str) -> String {
    let mut output = source.to_string();

    output = collapse_ws_run(&output, '}', "else{");
    output = collapse_ws_run(&output, '}', "else if(");
    output = collapse_ws_before_char(&output, "try", '{');
    output = collapse_ws_before_char(&output, "do", '{');
    output = collapse_ws_before_char(&output, "function", '(');
    output = collapse_ws_run(&output, ')', "{");
    output = collapse_ws_before_char(&output, "if", '(');
    output = collapse_ws_before_char(&output, "for", '(');
    output = collapse_ws_before_char(&output, "while", '(');
    output = collapse_ws_before_char(&output, "switch", '(');
    output = collapse_ws_before_char(&output, "catch", '(');
    output = collapse_ws_run(&output, ';', ")");

    loop {
        let next = output.replace(";}", "}");

        if next == output {
            break;
        }

        output = next;
    }

    output.trim().to_string()
}

pub fn lexical_token_count(source: &str) -> u32 {
    let chars: Vec<char> = source.chars().collect();
    let mut count: u32 = 0;
    let mut i = 0;

    while i < chars.len() {
        let c = chars[i];

        if c.is_whitespace() {
            i += 1;
            continue;
        }

        if c == '"' || c == '\'' || c == '`' {
            let quote = c;
            i += 1;
            count += 1;

            while i < chars.len() && chars[i] != quote {
                if chars[i] == '\\' && i + 1 < chars.len() {
                    i += 2;
                } else {
                    i += 1;
                }
            }

            i += 1;
            continue;
        }

        if c == '/' && i + 1 < chars.len() && chars[i + 1] == '/' {
            while i < chars.len() && chars[i] != '\n' {
                i += 1;
            }
            continue;
        }

        if c == '/' && i + 1 < chars.len() && chars[i + 1] == '*' {
            i += 2;

            while i + 1 < chars.len() && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }

            i += 2;
            continue;
        }

        if is_ident_char(c) {
            count += 1;

            while i < chars.len() && is_ident_char(chars[i]) {
                i += 1;
            }

            continue;
        }

        count += 1;
        i += 1;
    }

    count
}

#[wasm_bindgen]
pub fn engine_version() -> String {
    String::from(ENGINE_VERSION)
}

#[wasm_bindgen]
pub fn compact_whitespace(source: &str) -> String {
    compact(source)
}

#[wasm_bindgen]
pub fn count_tokens(source: &str) -> u32 {
    lexical_token_count(source)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compacts_control_flow_spacing() {
        let input = "function greet(name) {if (name) {console.log(name);} else {console.log(0);}}";
        let output = compact(input);
        assert!(!output.contains("if ("));
        assert!(!output.contains("} else {"));
    }

    #[test]
    fn counts_simple_tokens() {
        let input = "let a = 1 + 2;";
        assert_eq!(lexical_token_count(input), 7);
    }
}
