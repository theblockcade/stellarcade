use soroban_sdk::{Env, String};

use crate::types::{AchievementTier, Avatar};

fn write_str(buf: &mut [u8], pos: &mut usize, s: &str) {
    let bytes = s.as_bytes();
    let len = bytes.len();
    buf[*pos..*pos + len].copy_from_slice(bytes);
    *pos += len;
}

fn write_u32(buf: &mut [u8], pos: &mut usize, mut n: u32) {
    if n == 0 {
        buf[*pos] = b'0';
        *pos += 1;
        return;
    }
    let start = *pos;
    while n > 0 {
        buf[*pos] = b'0' + (n % 10) as u8;
        *pos += 1;
        n /= 10;
    }
    buf[start..*pos].reverse();
}

fn write_u64(buf: &mut [u8], pos: &mut usize, mut n: u64) {
    if n == 0 {
        buf[*pos] = b'0';
        *pos += 1;
        return;
    }
    let start = *pos;
    while n > 0 {
        buf[*pos] = b'0' + (n % 10) as u8;
        *pos += 1;
        n /= 10;
    }
    buf[start..*pos].reverse();
}

fn border_color(tier: &AchievementTier) -> &'static str {
    match tier {
        AchievementTier::Bronze => "#CD7F32",
        AchievementTier::Silver => "#C0C0C0",
        AchievementTier::Gold => "#FFD700",
        AchievementTier::Neon => "#39FF14",
    }
}

fn tier_label(tier: &AchievementTier) -> &'static str {
    match tier {
        AchievementTier::Bronze => "Bronze",
        AchievementTier::Silver => "Silver",
        AchievementTier::Gold => "Gold",
        AchievementTier::Neon => "Neon",
    }
}

fn write_svg(buf: &mut [u8], pos: &mut usize, avatar: &Avatar) {
    let color = border_color(&avatar.tier);
    let tier = tier_label(&avatar.tier);

    write_str(buf, pos, "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"#1a1a2e\" stroke=\"");
    write_str(buf, pos, color);
    write_str(buf, pos, "\" stroke-width=\"8\"/><text x=\"100\" y=\"80\" text-anchor=\"middle\" fill=\"white\" font-size=\"24\" font-family=\"monospace\">Level ");
    write_u32(buf, pos, avatar.level);
    write_str(
        buf,
        pos,
        "</text><text x=\"100\" y=\"120\" text-anchor=\"middle\" fill=\"",
    );
    write_str(buf, pos, color);
    write_str(buf, pos, "\" font-size=\"18\" font-family=\"monospace\">");
    write_str(buf, pos, tier);
    write_str(buf, pos, "</text><text x=\"100\" y=\"155\" text-anchor=\"middle\" fill=\"#aaa\" font-size=\"14\" font-family=\"monospace\">Wins: ");
    write_u32(buf, pos, avatar.wins);
    write_str(buf, pos, "</text></svg>");
}

pub fn generate_token_uri(env: &Env, avatar: &Avatar) -> String {
    let mut buf = [0u8; 8192];
    let mut pos = 0;

    write_str(&mut buf, &mut pos, "{\"name\":\"Arcade Avatar #");
    write_u64(&mut buf, &mut pos, avatar.token_id);
    write_str(
        &mut buf,
        &mut pos,
        "\",\"description\":\"Dynamic on-chain avatar\",\"image\":\"data:image/svg+xml;base64,",
    );

    write_svg(&mut buf, &mut pos, avatar);

    write_str(&mut buf, &mut pos, "\"}");

    String::from_bytes(env, &buf[..pos])
}
