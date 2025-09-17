# PDF Processor Setup Guide

This guide explains how to set up and use the PDF processing flow that extracts images and structured data from PDF files.

## Features

- **PDF Upload**: Users can upload PDF files through a web interface
- **Image Extraction**: Automatically extracts images from PDFs using the external API at `https://extract.rawaes.com/extract-images`
- **Data Extraction**: Uses Google Gemini AI to extract structured data from PDF content
- **Image Selection**: Users can select which extracted images to save
- **Database Storage**: Only saves data after user confirmation (no automatic saving)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install uuid @types/uuid
```

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"

# Base URL (for production)
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

### 3. Database Migration

Run the Prisma migration to add the new tables:

```bash
npx prisma migrate dev --name add-pdf-processing-models
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

## API Endpoints

### 1. External APIs Used
- **Image Extraction**: `https://extract.rawaes.com/extract-images`
  - **Purpose**: Extracts images from PDF files
  - **Input**: PDF file via FormData
  - **Output**: 
    ```json
    {
      "image_urls": ["url1", "url2", ...]
    }
    ```

- **Data Extraction**: `https://aidoc.rawaes.com/api/gemini`
  - **Purpose**: Extracts structured data from PDF using Gemini AI
  - **Input**: PDF file via FormData (field name: 'image')
  - **Output**: 
    ```json
    {
      "jsonResponse": { /* structured data */ }
    }
    ```

### 2. `/api/save-pdf-data` (POST)
- **Purpose**: Saves selected images and extracted data to AutomaticEmployee table
- **Input**: 
  ```json
  {
    "sessionId": "session-id",
    "selectedImages": ["url1", "url2"],
    "geminiData": { "jsonResponse": { /* data */ } },
    "originalFileName": "document.pdf",
    "notes": "optional notes",
    "processedBy": "user identifier"
  }
  ```
- **Output**:
  ```json
  {
    "success": true,
    "employeeId": 123,
    "message": "Employee data saved successfully"
  }
  ```

## Frontend Component

The main component is located at `/pages/admin/pdf-processor.tsx` and provides:

- **Step-by-Step Process**: 5-step wizard interface
- **File Upload**: Drag-and-drop or click to upload PDF files
- **Image Selection**: Choose specific profile and full body images
- **Image Upload**: Upload selected images to Digital Ocean Spaces
- **Data Extraction**: Trigger Gemini AI processing
- **Data Preview**: Show extracted structured data in table format
- **Save Controls**: Save uploaded images and data with optional notes

## Database Models

### AutomaticEmployee
- **Primary table** for storing employee data extracted from PDFs
- Contains all employee information (name, age, nationality, etc.)
- Stores profile and full images
- Includes skills (babySitting, cleaning, cooking, etc.)

### Data Mapping
- **Gemini Data → AutomaticEmployee**: Maps extracted data to employee fields
- **Image URLs**: First image → profileImage, Second image → fullImage
- **Boolean Fields**: Converts text values to boolean (yes/no, نعم/لا)
- **Field Mapping**: Handles multiple field name variations from Gemini

### Digital Ocean Integration
- **Presigned URLs**: Uses `/api/upload-presigned-url/[id]` for secure uploads
- **Image Storage**: Stores images in Digital Ocean Spaces
- **Public Access**: Images are publicly accessible via CDN URLs
- **File Naming**: Automatic naming with timestamps for uniqueness

## Usage Flow

1. **Upload PDF**: User selects and uploads a PDF file
2. **Extract Images**: System extracts images from PDF using external API
3. **Select Images**: User selects two specific images:
   - Profile image (صورة شخصية)
   - Full body image (صورة بالطول)
4. **Upload Images**: System uploads selected images to Digital Ocean Spaces
5. **Extract Data**: System sends PDF to Gemini API for data extraction
6. **Review & Save**: User reviews extracted data and saves to database

## Error Handling

- File validation (PDF only, size limits)
- API error handling with user-friendly messages
- Graceful degradation if one service fails
- Session-based error recovery

## Security Considerations

- File type validation
- File size limits (50MB)
- Temporary file cleanup
- Input sanitization
- API key protection

## Testing

To test the complete flow:

1. Start the development server: `npm run dev`
2. Navigate to `/admin/pdf-processor`
3. Upload a PDF file
4. Review extracted images and data
5. Select images and save

## Troubleshooting

### Common Issues

1. **External APIs**: Verify both external APIs are accessible:
   - `https://extract.rawaes.com/extract-images` for image extraction
   - `https://aidoc.rawaes.com/api/gemini` for data extraction
2. **Database Connection**: Verify `DATABASE_URL` is correct
3. **File Upload**: Check file size and type restrictions
4. **CORS Issues**: Ensure external APIs allow requests from your domain

### Logs

Check the browser console and server logs for detailed error messages.

## Future Enhancements

- Batch processing support
- Progress indicators for large files
- Image preview optimization
- Data export functionality
- User authentication integration
