# Panduan Integrasi Frontend Uppy v6 dengan Yono S3-Compatible API

Dokumentasi ini menjelaskan cara mengintegrasikan **Uppy v6** (menggunakan plugin `@uppy/aws-s3`) di sisi frontend (React, Vue, Svelte, atau Vanilla JS) dengan backend **Yono Cloud Storage API**.

---

## 1. Konsep Arsitektur Alur Kerja

```
[ Browser (Uppy v6) ]                  [ Yono Backend API ]                 [ S3 / MinIO Storage ]
         |                                      |                                    |
         |-- 1. GET /api/v1/files/s3/config --->|                                    |
         |<- 2. threshold & chunk size ---------|                                    |
         |                                      |                                    |
         |-- 3. Inisiasi Upload (Single/Multi)->|                                    |
         |      POST /api/v1/files/s3/presign   |                                    |
         |      (method, key, size)             |                                    |
         |<- 4. Presigned URL & isolated key ---|                                    |
         |                                                                           |
         |-- 5. Upload langsung ke S3 ---------------------------------------------->|
         |      - Single: PUT binary                                                 |
         |      - Multipart: Upload parts via /s3/presign PUT chunks                 |
         |      - Complete: POST XML via /s3/presign                                 |
         |                                                                           |
         |-- 6. Upload Selesai (event: upload-success)                               |
         |      POST /api/v1/files/confirm-upload                                    |
         |      (key, name, size, folder_id) -->|                                    |
         |                                      |-- 7. HeadObject (Verifikasi S3) -->|
         |                                      |<- 8. ETag & ContentLength ---------|
         |                                      |-- 9. Simpan ke DB & tambah Quota   |
         |<- 10. HTTP 201 File Created ---------|                                    |
```

---

## 2. Instalasi Uppy v6 di Frontend

```bash
npm install @uppy/core @uppy/dashboard @uppy/aws-s3
```

Atau menggunakan CDN:
```html
<link rel="stylesheet" href="https://releases.transloadit.com/uppy/v6.0.0/uppy.min.css">
<script type="module">
  import { Uppy } from 'https://releases.transloadit.com/uppy/v6.0.0/uppy.min.mjs';
  import Dashboard from 'https://releases.transloadit.com/uppy/v6.0.0/dashboard.min.mjs';
  import AwsS3 from 'https://releases.transloadit.com/uppy/v6.0.0/aws-s3.min.mjs';
</script>
```

---

## 3. Contoh Implementasi Lengkap (Vanilla JavaScript / ESM)

```javascript
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import AwsS3 from '@uppy/aws-s3';

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function initUppyUploader(folderId = null) {
  // 1. Ambil batas ukuran multipart dan chunk size secara dinamis dari backend
  const configResponse = await fetch(`${API_BASE_URL}/files/s3/config`, {
    credentials: 'include', // kirim cookie session
  });
  const configData = await configResponse.json();
  const { multipart_threshold_bytes, multipart_chunksize_bytes } = configData.data;

  // 2. Inisialisasi Uppy Core
  const uppy = new Uppy({
    id: 'yono-uploader',
    autoProceed: false,
    restrictions: {
      maxNumberOfFiles: 20,
    },
  });

  // 3. Pasang UI Dashboard
  uppy.use(Dashboard, {
    target: '#uppy-dashboard',
    inline: true,
    showProgressDetails: true,
    note: `Batas upload multipart: ${(multipart_threshold_bytes / (1024 * 1024)).toFixed(0)}MB`,
    height: 480,
  });

  // 4. Pasang AwsS3 Plugin (Uppy v6 Specification)
  uppy.use(AwsS3, {
    // Ukuran per chunk untuk upload multipart
    getChunkSize: () => multipart_chunksize_bytes,

    // Tentukan kapan harus menggunakan multipart (file > threshold)
    shouldUseMultipart: (file) => (file.size || 0) > multipart_threshold_bytes,

    // Batas concurrent parts
    limit: 4,

    /**
     * Uppy v6 Unified Signer Callback
     * Dipanggil secara otomatis oleh S3mini untuk setiap request:
     * - PutObject
     * - CreateMultipartUpload
     * - UploadPart
     * - CompleteMultipartUpload
     * - AbortMultipartUpload
     * - ListParts
     */
    async signRequest(request) {
      const response = await fetch(`${API_BASE_URL}/files/s3/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Penting: cookie session Yono
        body: JSON.stringify({
          method: request.method,
          key: request.key,
          uploadId: request.uploadId,
          partNumber: request.partNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal menandatangani request upload ke S3');
      }

      const data = await response.json();
      return {
        url: data.url,
        key: data.key, // Backend mengembalikan isolated key per user
      };
    },
  });

  // 5. Event Listener: Upload Sukses -> Panggil Confirm Upload Backend
  uppy.on('upload-success', async (file, response) => {
    try {
      // response.body berisi { key, location } dari Uppy v6 S3mini
      const fileKey = (response.body && response.body.key) || file.s3Multipart?.key || file.name;

      const confirmResponse = await fetch(`${API_BASE_URL}/files/confirm-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          key: fileKey,
          name: file.name,
          extension: file.extension || file.name.split('.').pop(),
          size: file.size,
          folder_id: folderId,
        }),
      });

      if (!confirmResponse.ok) {
        const err = await confirmResponse.json().catch(() => ({}));
        console.error('Gagal mengonfirmasi upload:', err.message);
        uppy.info(`Gagal menyimpan data ${file.name}: ${err.message}`, 'error', 5000);
        return;
      }

      const confirmedData = await confirmResponse.json();
      console.log('File berhasil tersimpan di sistem Yono:', confirmedData.data);
      uppy.info(`File ${file.name} berhasil tersimpan!`, 'success', 3000);
    } catch (err) {
      console.error('Error konfirmasi:', err);
    }
  });

  uppy.on('upload-error', (file, error) => {
    console.error(`Upload error untuk ${file.name}:`, error);
  });

  return uppy;
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  initUppyUploader(null);
});
```
