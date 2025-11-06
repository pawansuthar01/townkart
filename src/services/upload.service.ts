import { apiClient } from '@/lib/api-client'

export class UploadService {
  static async uploadImage(file: File, folder: string = 'general'): Promise<any> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('folder', folder)

    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async uploadMultipleImages(files: File[], folder: string = 'general'): Promise<any> {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`images[${index}]`, file)
    })
    formData.append('folder', folder)

    const response = await apiClient.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async uploadDocument(file: File, type: string = 'document'): Promise<any> {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('type', type)

    const response = await apiClient.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async uploadAvatar(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await apiClient.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async uploadProductImages(productId: string, files: File[]): Promise<any> {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`images[${index}]`, file)
    })
    formData.append('productId', productId)

    const response = await apiClient.post('/upload/product-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async uploadShopLogo(shopId: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('logo', file)
    formData.append('shopId', shopId)

    const response = await apiClient.post('/upload/shop-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async uploadDeliveryProof(deliveryId: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('proof', file)
    formData.append('deliveryId', deliveryId)

    const response = await apiClient.post('/upload/delivery-proof', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async deleteFile(fileUrl: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete('/upload/file', {
      data: { fileUrl }
    })
    return response.data
  }

  static async getUploadUrl(fileName: string, fileType: string, folder: string = 'general'): Promise<any> {
    const response = await apiClient.post('/upload/get-url', {
      fileName,
      fileType,
      folder
    })
    return response.data
  }

  static async uploadToS3(url: string, file: File): Promise<any> {
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return { success: true, url }
  }

  static async getFileInfo(fileUrl: string): Promise<any> {
    const response = await apiClient.get('/upload/file-info', {
      params: { fileUrl }
    })
    return response.data
  }

  static async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  static async validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF files are allowed' }
    }

    return { valid: true }
  }

  static async validateDocumentFile(file: File): Promise<{ valid: boolean; error?: string }> {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF, DOC, DOCX, JPEG, and PNG files are allowed' }
    }

    return { valid: true }
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  static generateFileName(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now()
    const extension = this.getFileExtension(originalName)
    const baseName = originalName.replace(/\.[^/.]+$/, '')
    return `${prefix}${baseName}_${timestamp}.${extension}`
  }
}