import os
import sys
from PIL import Image

DIRS = [
    'public/icons',
    'public/ui',
    'public/fantasy_bg',
    'public/sprites/portraits',
]

total_orig = 0
total_opt = 0
processed_count = 0
reduced_count = 0

def optimize_file(fp):
    global total_orig, total_opt, processed_count, reduced_count
    orig_sz = os.path.getsize(fp)
    total_orig += orig_sz
    processed_count += 1
    
    try:
        im = Image.open(fp)
        tmp = fp + '.tmp.png'
        
        best_sz = orig_sz
        best_method = None
        
        # Method 1: Just re-save with optimize=True
        im.save(tmp, format='PNG', optimize=True)
        sz1 = os.path.getsize(tmp)
        if sz1 < best_sz:
            best_sz = sz1
            best_method = 'optimize'
        
        # Method 2: Quantize if RGBA / RGB
        if im.mode in ('RGBA', 'RGB'):
            try:
                if im.mode == 'RGBA':
                    im_q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
                else:
                    im_q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
                tmp_q = fp + '.q.tmp.png'
                im_q.save(tmp_q, format='PNG', optimize=True)
                sz2 = os.path.getsize(tmp_q)
                if sz2 < best_sz:
                    best_sz = sz2
                    best_method = 'quantize'
                    if os.path.exists(tmp):
                        os.remove(tmp)
                    os.rename(tmp_q, tmp)
                else:
                    if os.path.exists(tmp_q):
                        os.remove(tmp_q)
            except Exception:
                pass
        
        if best_sz < orig_sz and os.path.exists(tmp):
            os.replace(tmp, fp)
            total_opt += best_sz
            reduced_count += 1
            savings = (1 - best_sz / orig_sz) * 100
            print(f'Optimized {fp}: {orig_sz/1024:.1f}KB -> {best_sz/1024:.1f}KB ({savings:.1f}%, {best_method})')
        else:
            if os.path.exists(tmp):
                os.remove(tmp)
            total_opt += orig_sz
    except Exception as e:
        total_opt += orig_sz
        print(f'Skip {fp}: {e}')

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    for d in DIRS:
        full_dir = os.path.join(root, d)
        if not os.path.exists(full_dir):
            continue
        for r, _, files in os.walk(full_dir):
            for f in files:
                if f.lower().endswith('.png'):
                    optimize_file(os.path.join(r, f))
                    
    print('\n--- Optimization Complete ---')
    print(f'Processed: {processed_count} files')
    print(f'Reduced: {reduced_count} files')
    print(f'Total Size: {total_orig/1024/1024:.2f} MB -> {total_opt/1024/1024:.2f} MB')
    if total_orig > 0:
        print(f'Overall Savings: {(1 - total_opt/total_orig)*100:.1f}%')

if __name__ == '__main__':
    main()
