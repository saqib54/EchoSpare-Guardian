# EcoSphere Guardian

An environmental monitoring application powered by AI to help reduce food waste, monitor pollution, and optimize agricultural practices.

## Deployment to Netlify

Follow these steps to deploy the application to Netlify:

1. **Connect to Netlify**:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your repository

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables**:
   - Go to Site settings > Build & deploy > Environment
   - Add the following variable:
     ```
     VITE_GEMINI_API_KEY = your_gemini_api_key_here
     ```

4. **Deploy**:
   - Click "Deploy site"
   - Your application will be live at the provided Netlify URL

## Local Development

To run the application locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser to http://localhost:5173

## Environment Variables

Create a `.env` file in the root directory with your Gemini API key:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/).