import os

# Masukkan hari
day_number = input("Masukkan nomor hari (contoh: 002): ")
folder_name = f"Day_{day_number}"

# Membuat Folder
if not os.path.exists(folder_name):
    os.makedirs(folder_name)
    
    # Membuat README di dalam folder
    with open(f"{folder_name}/README.md", "w") as f:
        f.write(f"# Day {day_number}\n\n## Deskripsi Proyek\n[Tulis deskripsi di sini]\n\n## Cara Menjalankan\n...")
    
    print(f"✅ Folder '{folder_name}' berhasil dibuat!")
else:
    print(f"❌ Folder '{folder_name}' sudah ada.")