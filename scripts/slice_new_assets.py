import os
import zipfile
import io
from PIL import Image, ImageDraw

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def save_frame(img, out_paths):
    for p in out_paths:
        ensure_dir(os.path.dirname(p))
        img.save(p, "PNG")

# -------------------------------------------------------------
# 1. SKELETON WARLORD (Boss)
# -------------------------------------------------------------
print("--- Slicing Skeleton Warlord Boss ---")
skel_src = r"C:\Users\lyan1\Desktop\game assets\Skeleton\Sprite Sheets"
# Target canvas: 48x48, body centered at x=24, feet at y=44
target_w, target_h = 48, 48
feet_y = 44
center_x = 24

skel_configs = [
    ("Skeleton Idle.png", 24, 32, 11, "idle", 0, 11),
    ("Skeleton Walk.png", 22, 33, 13, "walk", 0, 13),
    ("Skeleton React.png", 22, 32, 4, "react", 0, 4),
    ("Skeleton Attack.png", 43, 37, 18, "attack", 0, 9),    # frames 0-8: windup & strike
    ("Skeleton Attack.png", 43, 37, 18, "recover", 9, 18),  # frames 9-17: recover blade
    ("Skeleton Hit.png", 30, 32, 8, "hit", 0, 8),
    ("Skeleton Dead.png", 33, 32, 15, "dead", 0, 15),
]

for sheet_file, frame_w, frame_h, total_frames, anim_name, start_idx, end_idx in skel_configs:
    sheet_path = os.path.join(skel_src, sheet_file)
    sheet = Image.open(sheet_path).convert("RGBA")
    
    frame_num = 1
    for i in range(start_idx, end_idx):
        crop_box = (i * frame_w, 0, (i + 1) * frame_w, frame_h)
        frame = sheet.crop(crop_box)
        
        # Place onto 48x48 canvas
        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        # align feet to feet_y
        pos_y = feet_y - frame_h
        # center horizontally
        pos_x = center_x - (frame_w // 2)
        canvas.paste(frame, (pos_x, pos_y), frame)
        
        fname = f"{anim_name}{frame_num:02d}.png"
        out1 = os.path.join("public", "sprites", "BossSkeleton", fname)
        out2 = os.path.join("dist", "sprites", "BossSkeleton", fname)
        save_frame(canvas, [out1, out2])
        frame_num += 1

print("Skeleton Warlord sliced successfully.")

# -------------------------------------------------------------
# 2. NIGHTBORNE SOVEREIGN (Hero, 200k)
# -------------------------------------------------------------
print("--- Slicing Nightborne Sovereign ---")
nb_zip_path = r"C:\Users\lyan1\Desktop\game assets\NightBorne.zip"
with zipfile.ZipFile(nb_zip_path) as z:
    nb_sheet = Image.open(io.BytesIO(z.read("NightBorne.png"))).convert("RGBA")
    
    # 5 rows of 80px, cells are 80x80
    # Must horizontally flip so character faces Right by default
    nb_rows = [
        (0, 9, "idle"),
        (1, 6, "walk"),
        (2, 12, "attack"),
        (3, 5, "hit"),
        (4, 23, "dead"),
    ]
    
    for row_idx, count, anim_name in nb_rows:
        for col_idx in range(count):
            crop_box = (col_idx * 80, row_idx * 80, (col_idx + 1) * 80, (row_idx + 1) * 80)
            frame = nb_sheet.crop(crop_box)
            # Flip to face Right
            frame_flipped = frame.transpose(Image.FLIP_LEFT_RIGHT)
            
            fname = f"{anim_name}{col_idx + 1:02d}.png"
            out1 = os.path.join("public", "sprites", "HeroNightborne", fname)
            out2 = os.path.join("dist", "sprites", "HeroNightborne", fname)
            save_frame(frame_flipped, [out1, out2])
            
            if anim_name == "walk":
                # Also save as dash
                fname_dash = f"dash{col_idx + 1:02d}.png"
                d1 = os.path.join("public", "sprites", "HeroNightborne", fname_dash)
                d2 = os.path.join("dist", "sprites", "HeroNightborne", fname_dash)
                save_frame(frame_flipped, [d1, d2])

    # Generate Portrait for Dojo
    portrait_f0 = nb_sheet.crop((0, 0, 80, 80)).transpose(Image.FLIP_LEFT_RIGHT)
    port_bg = Image.new("RGBA", (100, 100), (15, 23, 42, 255))
    draw = ImageDraw.Draw(port_bg)
    # radial glow purple
    for r in range(45, 0, -2):
        alpha = int(80 * (1 - r / 45))
        draw.ellipse([50 - r, 50 - r, 50 + r, 50 + r], fill=(168, 85, 247, alpha))
    # paste Nightborne scaled
    port_f0_scaled = portrait_f0.resize((90, 90), Image.NEAREST)
    port_bg.paste(port_f0_scaled, (5, 5), port_f0_scaled)
    save_frame(port_bg, [
        os.path.join("public", "sprites", "portraits", "portrait_nightborne.png"),
        os.path.join("dist", "sprites", "portraits", "portrait_nightborne.png")
    ])

print("Nightborne Sovereign sliced successfully.")

# -------------------------------------------------------------
# 3. GRANDMASTER SAMURAI (Hero, 150k)
# -------------------------------------------------------------
print("--- Slicing Grandmaster Samurai ---")
sam_zip_path = r"C:\Users\lyan1\Desktop\game assets\FREE_Samurai 2D Pixel Art v1.2.zip"
with zipfile.ZipFile(sam_zip_path) as z:
    sam_sheets = [
        ("FREE_Samurai 2D Pixel Art v1.2/Sprites/IDLE.png", 10, "idle"),
        ("FREE_Samurai 2D Pixel Art v1.2/Sprites/RUN.png", 16, "walk"),
        ("FREE_Samurai 2D Pixel Art v1.2/Sprites/ATTACK 1.png", 7, "attack"),
        ("FREE_Samurai 2D Pixel Art v1.2/Sprites/HURT.png", 4, "hit"),
    ]
    
    for zip_file, count, anim_name in sam_sheets:
        sheet = Image.open(io.BytesIO(z.read(zip_file))).convert("RGBA")
        for i in range(count):
            crop_box = (i * 96, 0, (i + 1) * 96, 96)
            frame = sheet.crop(crop_box)
            # Already faces Right
            fname = f"{anim_name}{i + 1:02d}.png"
            out1 = os.path.join("public", "sprites", "HeroSamurai", fname)
            out2 = os.path.join("dist", "sprites", "HeroSamurai", fname)
            save_frame(frame, [out1, out2])
            
            if anim_name == "walk" and i < 8:
                fname_dash = f"dash{i + 1:02d}.png"
                d1 = os.path.join("public", "sprites", "HeroSamurai", fname_dash)
                d2 = os.path.join("dist", "sprites", "HeroSamurai", fname_dash)
                save_frame(frame, [d1, d2])
    
    # Create dead frames from hurt sheet with decay
    hurt_sheet = Image.open(io.BytesIO(z.read("FREE_Samurai 2D Pixel Art v1.2/Sprites/HURT.png"))).convert("RGBA")
    for i in range(8):
        hurt_idx = min(3, i // 2)
        frame = hurt_sheet.crop((hurt_idx * 96, 0, (hurt_idx + 1) * 96, 96))
        # Fade alpha slightly on later frames
        alpha_mult = max(0.2, 1.0 - (i * 0.1))
        r, g, b, a = frame.split()
        a = a.point(lambda p: int(p * alpha_mult))
        frame.putalpha(a)
        fname_dead = f"dead{i + 1:02d}.png"
        out1 = os.path.join("public", "sprites", "HeroSamurai", fname_dead)
        out2 = os.path.join("dist", "sprites", "HeroSamurai", fname_dead)
        save_frame(frame, [out1, out2])

    # Generate Portrait for Dojo
    idle_sheet = Image.open(io.BytesIO(z.read("FREE_Samurai 2D Pixel Art v1.2/Sprites/IDLE.png"))).convert("RGBA")
    sam_f0 = idle_sheet.crop((0, 0, 96, 96))
    port_sam = Image.new("RGBA", (100, 100), (15, 23, 42, 255))
    draw_sam = ImageDraw.Draw(port_sam)
    # radial glow gold
    for r in range(45, 0, -2):
        alpha = int(80 * (1 - r / 45))
        draw_sam.ellipse([50 - r, 50 - r, 50 + r, 50 + r], fill=(234, 179, 8, alpha))
    sam_scaled = sam_f0.resize((90, 90), Image.NEAREST)
    port_sam.paste(sam_scaled, (5, 5), sam_scaled)
    save_frame(port_sam, [
        os.path.join("public", "sprites", "portraits", "portrait_samurai.png"),
        os.path.join("dist", "sprites", "portraits", "portrait_samurai.png")
    ])

print("Grandmaster Samurai sliced successfully.")

# -------------------------------------------------------------
# 4. TOASTER BOT (Ranged Enemy)
# -------------------------------------------------------------
print("--- Slicing Toaster Bot ---")
tb_zip_path = r"C:\Users\lyan1\Desktop\game assets\Toaster Bot.zip"
with zipfile.ZipFile(tb_zip_path) as z:
    tb_sheets = [
        ("Toaster Bot/idle.png", 10, "idle"),
        ("Toaster Bot/run.png", 16, "walk"),
        ("Toaster Bot/attack.png", 22, "attack"),
        ("Toaster Bot/damaged.png", 4, "hit"),
        ("Toaster Bot/death.png", 10, "dead"),
    ]
    
    # Target uniform canvas: 56x28 to provide a clean centered box
    target_tb_w, target_tb_h = 56, 28
    
    for zip_file, count, anim_name in tb_sheets:
        sheet = Image.open(io.BytesIO(z.read(zip_file))).convert("RGBA")
        for i in range(count):
            crop_box = (i * 53, 0, (i + 1) * 53, 22)
            frame = sheet.crop(crop_box)
            
            # place onto 56x28 canvas centered
            canvas = Image.new("RGBA", (target_tb_w, target_tb_h), (0, 0, 0, 0))
            canvas.paste(frame, (1, 3), frame)
            
            fname = f"{anim_name}{i + 1:02d}.png"
            out1 = os.path.join("public", "sprites", "EnemyToasterBot", fname)
            out2 = os.path.join("dist", "sprites", "EnemyToasterBot", fname)
            save_frame(canvas, [out1, out2])

print("Toaster Bot sliced successfully.")
print("=== All new sprite assets processed and placed! ===")
