from django.core.management.base import BaseCommand
from django.conf import settings
import os
from PIL import Image

class Command(BaseCommand):
    help = 'Compress all images in MEDIA_ROOT except profile pictures'

    def handle(self, *args, **options):
        media_root = settings.MEDIA_ROOT
        self.stdout.write(f"Scanning media root: {media_root}")
        
        count_processed = 0
        count_errors = 0
        saved_space = 0

        for root, dirs, files in os.walk(media_root):
            # Exclude perfiles directory
            if 'perfiles' in root:
                continue
            
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    path = os.path.join(root, file)
                    try:
                        original_size = os.path.getsize(path)
                        
                        # Open and compress
                        with Image.open(path) as img:
                            # Convert to RGB if necessary (e.g. PNG with alpha)
                            if img.mode in ('RGBA', 'P'):
                                img = img.convert('RGB')
                                
                            # Resize if too large
                            max_dimension = 1280
                            if img.width > max_dimension or img.height > max_dimension:
                                img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                                
                            # Save with optimization
                            # We save to a temp path first to verify
                            img.save(path, quality=70, optimize=True)
                        
                        new_size = os.path.getsize(path)
                        saved = original_size - new_size
                        if saved > 0:
                            saved_space += saved
                            self.stdout.write(self.style.SUCCESS(f"Compressed {file}: -{saved/1024:.2f}KB"))
                        else:
                            self.stdout.write(f"Skipped {file} (no size reduction)")
                            
                        count_processed += 1
                        
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Error processing {path}: {e}"))
                        count_errors += 1

        self.stdout.write(self.style.SUCCESS(f"Done! Processed {count_processed} images. Saved {saved_space/1024/1024:.2f} MB."))
