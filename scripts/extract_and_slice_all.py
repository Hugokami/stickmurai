import os
import shutil
import zipfile
import io
from PIL import Image, ImageDraw
import numpy as np

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def save_frame(img, out_paths):
    for p in out_paths:
        ensure_dir(os.path.dirname(p))
        img.save(p, "PNG")

def copy_file(src_bytes, out_paths):
    for p in out_paths:
        ensure_dir(os.path.dirname(p))
        with open(p, "wb") as f:
            f.write(src_bytes)

print("=== STEP 1: EXTRACTING AND PLACING SOUND EFFECTS ===")

audio_files_to_place = {}

# 1. 437113__cpawsmusic__sword-4.wav -> sfx_sword_clash.wav
src_sword = r"C:\Users\lyan1\Downloads\437113__cpawsmusic__sword-4.wav"
with open(src_sword, "rb") as f:
    audio_files_to_place["sfx_sword_clash.wav"] = f.read()

# 2. yodguard-short-energy-beam-shot-1-482495.mp3 -> sfx_energy_beam.mp3
src_beam = r"C:\Users\lyan1\Downloads\yodguard-short-energy-beam-shot-1-482495.mp3"
with open(src_beam, "rb") as f:
    audio_files_to_place["sfx_energy_beam.mp3"] = f.read()

# 3. sci-fi-sfx.zip
src_scifi = r"C:\Users\lyan1\Downloads\sci-fi-sfx.zip"
with zipfile.ZipFile(src_scifi, "r") as z:
    audio_files_to_place["sfx_teleport.ogg"] = z.read("teleport_01.ogg")
    audio_files_to_place["sfx_sci_explosion.ogg"] = z.read("retro_explosion.ogg")
    audio_files_to_place["sfx_affix_alert.ogg"] = z.read("terminal_01.ogg")

# 4. ignisforge-oga-sampler-cc0.zip
src_ignis = r"C:\Users\lyan1\Downloads\ignisforge-oga-sampler-cc0.zip"
with zipfile.ZipFile(src_ignis, "r") as z:
    audio_files_to_place["sfx_magatama_pickup.wav"] = z.read("coin_01.wav")
    audio_files_to_place["sfx_shrine_blessing.wav"] = z.read("powerup_01.wav")
    audio_files_to_place["sfx_primal_zap.wav"] = z.read("spellzap_01.wav")
    audio_files_to_place["sfx_stage_conquered.wav"] = z.read("jingle_01.wav")

for filename, content in audio_files_to_place.items():
    p1 = os.path.join("public", "audio", filename)
    p2 = os.path.join("dist", "audio", filename)
    copy_file(content, [p1, p2])
    print(f"Placed {filename} ({len(content)} bytes)")

print("=== STEP 2: SLICING PRIMAL SATYR HERO SPRITES ===")

satyr_zip = r"C:\Users\lyan1\Desktop\game assets\SATYR_sprite_sheet .zip"
with zipfile.ZipFile(satyr_zip, "r") as z:
    sheet_bytes = z.read("SPRITE_SHEET.png")
    portrait_bytes = z.read("SPRITE_PORTRAIT.png")

sheet = Image.open(io.BytesIO(sheet_bytes)).convert("RGBA")
portrait_img = Image.open(io.BytesIO(portrait_bytes)).convert("RGBA")

# 10 cols x 11 rows of 32x32px
frame_w, frame_h = 32, 32
target_w, target_h = 48, 48
pos_x = 8
pos_y = 17

anim_rows = [
    (0, 6, "idle"),
    (1, 8, "walk"),
    (8, 6, "dash"),
    (9, 10, "attack"),
    (7, 4, "hit"),
    (6, 10, "dead")
]

for row_idx, frame_count, anim_name in anim_rows:
    for c in range(frame_count):
        crop_box = (c * frame_w, row_idx * frame_h, (c + 1) * frame_w, (row_idx + 1) * frame_h)
        frame_32 = sheet.crop(crop_box)
        
        # Place onto 48x48 canvas centered with feet aligned at y=44
        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        canvas.paste(frame_32, (pos_x, pos_y), frame_32)
        
        fname = f"{anim_name}{c + 1:02d}.png"
        out1 = os.path.join("public", "sprites", "HeroSatyr", fname)
        out2 = os.path.join("dist", "sprites", "HeroSatyr", fname)
        save_frame(canvas, [out1, out2])

print("Satyr animations sliced into public/sprites/HeroSatyr/ and dist/sprites/HeroSatyr/")

# Generate Satyr Portrait for Dojo Card
port_bg = Image.new("RGBA", (100, 100), (15, 23, 42, 255))
draw_port = ImageDraw.Draw(port_bg)
# Emerald radial glow (theme color #10B981)
for r in range(45, 0, -2):
    alpha = int(85 * (1 - r / 45))
    draw_port.ellipse([50 - r, 50 - r, 50 + r, 50 + r], fill=(16, 185, 129, alpha))

satyr_port_scaled = portrait_img.resize((84, 76), Image.NEAREST)
port_bg.paste(satyr_port_scaled, (8, 12), satyr_port_scaled)
save_frame(port_bg, [
    os.path.join("public", "sprites", "portraits", "portrait_satyr.png"),
    os.path.join("dist", "sprites", "portraits", "portrait_satyr.png")
])
print("Satyr portrait generated at public/sprites/portraits/portrait_satyr.png")

# Generate Emerald Nature Slash VFX (slash_satyr) from slash_ronin
print("=== STEP 3: GENERATING SATYR EMERALD SLASH VFX ===")
for i in range(1, 10):
    src_path = os.path.join("public", "sprites", "vfx", "slashes", "slash_ronin", f"frame_{i:02d}.png")
    if not os.path.exists(src_path):
        continue
    ronin_f = Image.open(src_path).convert("RGBA")
    arr = np.array(ronin_f, dtype=np.float32)
    alpha = arr[:, :, 3] / 255.0
    
    # Calculate luminance/brightness from original slash
    lum = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0
    
    # Map luminance to emerald / jade nature blade glow:
    r_channel = np.clip(lum * 180 + (lum ** 2) * 75, 0, 255)
    g_channel = np.clip(lum * 240 + 15, 0, 255)
    b_channel = np.clip(lum * 140, 0, 255)
    
    new_arr = np.zeros_like(arr, dtype=np.uint8)
    new_arr[:, :, 0] = r_channel.astype(np.uint8)
    new_arr[:, :, 1] = g_channel.astype(np.uint8)
    new_arr[:, :, 2] = b_channel.astype(np.uint8)
    new_arr[:, :, 3] = (alpha * 255).astype(np.uint8)
    
    out_img = Image.fromarray(new_arr, "RGBA")
    save_frame(out_img, [
        os.path.join("public", "sprites", "vfx", "slashes", "slash_satyr", f"frame_{i:02d}.png"),
        os.path.join("dist", "sprites", "vfx", "slashes", "slash_satyr", f"frame_{i:02d}.png")
    ])

print("Satyr emerald slash frames generated in public/sprites/vfx/slashes/slash_satyr/")
print("=== EXTRACTION AND SLICING COMPLETED SUCCESSFULLY! ===")
